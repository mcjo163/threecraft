/**
 * CIS487 Final Project
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";
import * as Utils from "./utils.js";
import { World } from "./world.js";

let inputs = {
  left: false,
  right: false,
  forward: false,
  backward: false,
};

let canvasFocused = false;
let w, h;

/** @type {HTMLCanvasElement} */
let canvas;

/** @type {HTMLCanvasElement} */
let hudCanvas;

/** @type {THREE.PerspectiveCamera} */
let camera;

/** @type {THREE.OrthographicCamera} */
let hudCamera;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.Scene} */
let hudScene;

/** @type {CanvasRenderingContext2D} */
let hud;

/** @type {THREE.Texture} */
let hudTexture;

/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {THREE.Raycaster} */
let raycaster;

/** @type {World} */
let world;

/** @type {THREE.Mesh} */
let wireframeOutline;

init();
animate();

/**
 * Initializes the program.
 */
function init() {
  canvas = document.querySelector("#c");

  camera = new THREE.PerspectiveCamera(80, 16 / 9, 1, 10000);
  camera.position.y = 18;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  {
    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(200, 300, 150);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    // shadow setup
    light.shadow.mapSize.height = 4096;
    light.shadow.mapSize.width = 4096;
    light.shadow.camera.far = 1000;
    light.shadow.camera.right = 300;
    light.shadow.camera.left = -300;
    light.shadow.camera.top = 300;
    light.shadow.camera.bottom = -300;
    scene.add(light);
  }

  const box = new THREE.BoxGeometry(10, 10, 10);
  const edges = new THREE.EdgesGeometry(box);
  wireframeOutline = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xcfcfcf })
  );
  scene.add(wireframeOutline);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  [w, h] = Utils.getMaximalBounds(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;

  raycaster = new THREE.Raycaster();
  raycaster.far = 60;

  world = new World(scene, basicWorld());

  resetHud();

  // attach event handlers
  window.addEventListener("resize", onresize);
  canvas.addEventListener("click", canvas.requestPointerLock);
  document.addEventListener("pointerlockchange", onpointerlockchange);
}

function basicWorld() {
  const blocks = [];
  for (let y = 0; y < 40; y++) {
    const layer = [];
    for (let x = 0; x < 40; x++) {
      const row = [];
      for (let z = 0; z < 40; z++) {
        row.push(y <= 19 ? 1 : 0);
      }
      layer.push(row);
    }
    blocks.push(layer);
  }
  return blocks;
}

function resetHud() {
  if (hudCanvas) hudCanvas.remove();

  hudCanvas = document.createElement("canvas");
  [hudCanvas.width, hudCanvas.height] = [w, h];
  hud = hudCanvas.getContext("2d");
  hud.font = "28px consolas";

  hudCamera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0, 30);
  hudScene = new THREE.Scene();
  hudTexture = new THREE.Texture(hudCanvas);
  hudTexture.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: hudTexture,
  });
  mat.transparent = true;
  hudScene.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat));
}

function updateHud() {
  hud.clearRect(0, 0, w, h);

  // if game is playing, draw relevant HUD items
  if (canvasFocused) {
    // crosshair
    hud.strokeStyle = "#efefef";
    const chSize = h * 0.01;
    hud.beginPath();
    hud.moveTo(w / 2, h / 2 - chSize);
    hud.lineTo(w / 2, h / 2 + chSize);
    hud.stroke();
    hud.beginPath();
    hud.moveTo(w / 2 - chSize, h / 2);
    hud.lineTo(w / 2 + chSize, h / 2);
    hud.stroke();
  }
  // otherwise, draw "click to play" message
  else {
    hud.fillStyle = "rgba(0, 0, 0, 0.6)";
    hud.fillRect(0, 0, w, h);
    hud.fillStyle = "white";
    let t = hud.measureText("click to play!");
    hud.fillText("click to play!", (w - t.width) / 2, h / 3);
  }

  hudTexture.needsUpdate = true;
}

/**
 * Renders the scene.
 */
function render() {
  updateWireframeOutline();
  renderer.render(scene, camera);

  updateHud();
  renderer.render(hudScene, hudCamera);
}

/**
 * Processes movement and collisions.
 */
function process() {
  const velocity = new THREE.Vector3();

  // get current directional input state
  const inputVector = new THREE.Vector2(
    inputs.right - inputs.left,
    inputs.backward - inputs.forward
  ).normalize();

  // get forward direction to base movement on
  const cameraDir = new THREE.Vector3();
  camera.getWorldDirection(cameraDir);
  const forwardDir = new THREE.Vector2(cameraDir.x, cameraDir.z).normalize();

  // rotate the input vector
  inputVector.rotateAround(
    new THREE.Vector2(),
    forwardDir.angle() + Math.PI / 2
  );

  // set desired xz-velocity
  velocity.x = inputVector.x * 0.6;
  velocity.z = inputVector.y * 0.6;

  camera.position.add(velocity);
}

function animate() {
  process();
  render();

  requestAnimationFrame(animate);
}

function updateWireframeOutline() {
  raycaster.setFromCamera(new THREE.Vector2(), camera);
  const intersects = raycaster.intersectObjects(
    world.nearby(camera.position, 6),
    false
  );
  if (intersects.length) {
    const [intersect, ..._] = intersects;
    wireframeOutline.position.copy(intersect.object.position);
    wireframeOutline.material.visible = true;
  } else {
    wireframeOutline.material.visible = false;
  }
}

/**
 * Handles window resizes. Ensures the canvas maintains
 * a 16:9 aspect ratio.
 */
function onresize() {
  [w, h] = Utils.getMaximalBounds(window.innerWidth, window.innerHeight);
  renderer.setSize(w, h);

  resetHud();
}

/**
 * Handles keydown events.
 * @param {KeyboardEvent} e event
 */
function onkeydown(e) {
  switch (e.key) {
    case "w":
      inputs.forward = true;
      break;
    case "s":
      inputs.backward = true;
      break;
    case "a":
      inputs.left = true;
      break;
    case "d":
      inputs.right = true;
      break;
  }
}

/**
 * Handles keyup events.
 * @param {KeyboardEvent} e event
 */
function onkeyup(e) {
  switch (e.key) {
    case "w":
      inputs.forward = false;
      break;
    case "s":
      inputs.backward = false;
      break;
    case "a":
      inputs.left = false;
      break;
    case "d":
      inputs.right = false;
      break;
  }
}

/**
 * Determines whether the game should recieve input.
 */
function onpointerlockchange() {
  if (document.pointerLockElement === canvas) {
    // set focus state, remove click handler
    canvasFocused = true;
    canvas.removeEventListener("click", canvas.requestPointerLock);

    // attach input handlers
    document.addEventListener("mousemove", onmousemove);
    document.addEventListener("pointerdown", onpointerdown);
    window.addEventListener("keydown", onkeydown);
    window.addEventListener("keyup", onkeyup);
  } else {
    // set focus state, add click handler back
    canvasFocused = false;
    canvas.addEventListener("click", canvas.requestPointerLock);

    // detach input handlers
    document.removeEventListener("mousemove", onmousemove);
    document.removeEventListener("pointerdown", onpointerdown);
    window.removeEventListener("keydown", onkeydown);
    window.removeEventListener("keyup", onkeyup);
  }
}

/**
 * Rotates the camera based on mouse movement.
 * @param {MouseEvent} e event
 */
function onmousemove(e) {
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  euler.setFromQuaternion(camera.quaternion);

  euler.x -= (e.movementY * Math.PI) / 1000;
  euler.y -= (e.movementX * Math.PI) / 1000;

  euler.x = THREE.MathUtils.clamp(
    euler.x,
    -Math.PI / 2 + 0.01,
    Math.PI / 2 - 0.01
  );
  camera.quaternion.setFromEuler(euler);
}

/**
 * Places or removes a block.
 * @param {MouseEvent} e event
 */
function onpointerdown(e) {
  raycaster.setFromCamera(new THREE.Vector2(), camera);
  const intersects = raycaster.intersectObjects(
    world.nearby(camera.position, 6),
    false
  );
  // if anything was intersected with
  if (intersects.length) {
    const [intersect, ..._] = intersects;

    switch (e.button) {
      case 0:
        // left click - break block
        world.removeBlock(intersect.point.sub(intersect.face.normal));
        break;
      case 2:
        // right click - place block
        world.addBlock(intersect.point.add(intersect.face.normal), 2);
        break;
    }
  }
}
