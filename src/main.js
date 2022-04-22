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
  space: false,
};

let yVelocity = 0;
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

/** @type {THREE.Raycaster} */
let playerFloorcaster;

/** @type {World} */
let world;

/** @type {THREE.Mesh} */
let wireframeOutline;

/** @type {number} */
let t;

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

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(150),
      new THREE.MeshBasicMaterial({color: 0xffffbb}),
    );
    sun.position.copy(light.position).multiplyScalar(10);
    scene.add(sun);
  }

  const box = new THREE.BoxGeometry(10, 10, 10);
  const edges = new THREE.EdgesGeometry(box);
  wireframeOutline = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xcfcfcf })
  );
  scene.add(wireframeOutline);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // renderer.setPixelRatio(window.devicePixelRatio);
  [w, h] = Utils.getMaximalBounds(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;

  raycaster = new THREE.Raycaster();
  raycaster.far = 60;

  playerFloorcaster = new THREE.Raycaster();
  playerFloorcaster.far = 18;

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
 * @param {number} dt
 */
function process(dt) {
  const velocity = new THREE.Vector3();
  // apply gravity
  yVelocity -= 300 * dt;

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

  // set desired velocity
  velocity.x = inputVector.x * 50 * dt;
  velocity.y = yVelocity * dt;
  velocity.z = inputVector.y * 50 * dt;

  // update position, keep within world bounds
  camera.position
    .add(velocity)
    .clamp(
      new THREE.Vector3(-200, -182, -200),
      new THREE.Vector3(200, 198, 200)
    );

  // floor collision
  const collidables = world.nearby(camera.position, 2);
  playerFloorcaster.set(camera.position, new THREE.Vector3(0, -1, 0));

  // filter intersects to avoid detecting the weird ghost objects at the origin
  // (make sure the intersection point is grid-aligned)... not a nice solution
  const intersects = playerFloorcaster
    .intersectObjects(collidables, false)
    .filter((i) => i.point.y % 10 == 0);

  if (intersects.length && yVelocity < 0) {
    const [intersect, ..._] = intersects;
    camera.position.copy(intersect.point).add(new THREE.Vector3(0, 18, 0));

    // reset velocity or start a jump
    yVelocity = inputs.space ? 100 : 0;
  }
}

function animate(time) {
  if (!t) t = time;
  const dt = time - t;

  if (dt > 1000 / 60) {
    if (canvasFocused) process(dt / 1000);
    render();
    t = time;
  }

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
    case " ":
      inputs.space = true;
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
    case " ":
      inputs.space = false;
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
        // avoid placing blocks inside the currently occupied positions
        const currentPosition = Utils.positionToWorldIndices(camera.position);
        const blockPosition = intersect.point.add(intersect.face.normal);
        if (
          !currentPosition.equals(
            Utils.positionToWorldIndices(blockPosition)
          ) &&
          !currentPosition
            .add(new THREE.Vector3(0, -1, 0))
            .equals(Utils.positionToWorldIndices(blockPosition))
        )
          world.addBlock(blockPosition, 2);
        break;
    }
  }
}
