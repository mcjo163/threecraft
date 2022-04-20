/**
 * CIS487 Final Project
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";
import * as Utils from "./utils.js";
import { BLOCKS } from "./blocks.js";

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

/** @type {THREE.Object3D[]} */
const objects = [];

/** @type {THREE.Mesh} */
let floor;

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

  const grid = new THREE.GridHelper(400, 40);
  scene.add(grid);

  const geo = new THREE.PlaneGeometry(400, 400);
  geo.rotateX(-Math.PI / 2);
  floor = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: 0x7ec850}));
  scene.add(floor);
  objects.push(floor);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  [w, h] = Utils.getMaximalBounds(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setSize(w, h);

  raycaster = new THREE.Raycaster();
  raycaster.far = 60;

  resetHud();

  // attach event handlers
  window.addEventListener("resize", onresize);
  canvas.addEventListener("click", canvas.requestPointerLock);
  document.addEventListener("pointerlockchange", onpointerlockchange);
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
  const mat = new THREE.MeshBasicMaterial({ map: hudTexture });
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
  velocity.x = inputVector.x * 0.4;
  velocity.z = inputVector.y * 0.4;

  camera.position.add(velocity);
}

function animate() {
  process();
  render();

  requestAnimationFrame(animate);
}

/**
 * Handles window resizes. Ensures the canvas maintains
 * a 16:9 aspect ratio.
 */
function onresize() {
  [w, h] = Utils.getMaximalBounds(window.innerWidth, window.innerHeight);
  renderer.setSize(w, h);

  resetHud();
  render();
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

  euler.x -= (e.movementY * Math.PI) / 500;
  euler.y -= (e.movementX * Math.PI) / 500;

  euler.x = THREE.MathUtils.clamp(
    euler.x,
    -Math.PI / 2 + 0.1,
    Math.PI / 2 - 0.1
  );
  camera.quaternion.setFromEuler(euler);

  render();
}

/**
 * Places or removes a block.
 * @param {MouseEvent} e event
 */
function onpointerdown(e) {

  raycaster.setFromCamera(new THREE.Vector2(), camera);
  const intersects = raycaster.intersectObjects(objects, false);

  // if anything was intersected with
  if (intersects.length) {
    const [intersect, ..._] = intersects;

    switch (e.button) {
      case 0:
        // left click - break block
        if (intersect.object !== floor) {
          scene.remove(intersect.object);
          objects.splice(objects.indexOf(intersect.object), 1);
        }
        break;
      case 2:
        // right click - place block
        const newBlock = BLOCKS[1].create();
        newBlock.position.copy(intersect.point).add(intersect.face.normal);
        newBlock.position
          .divideScalar(10)
          .floor()
          .multiplyScalar(10)
          .addScalar(5);
        objects.push(newBlock);
        scene.add(newBlock);
        break;
    }
  }
}
