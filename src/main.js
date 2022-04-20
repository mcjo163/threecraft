/**
 * CIS487 Final Project
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";
import * as Utils from "./utils.js";

let inputs = {
  left: false,
  right: false,
  forward: false,
  backward: false,
};

/** @type {HTMLCanvasElement} */
let canvas;

/** @type {THREE.PerspectiveCamera} */
let camera;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.WebGLRenderer} */
let renderer;

init();
animate();

/**
 * Initializes the program.
 */
function init() {
  canvas = document.querySelector("#c");
  canvas.onclick = () => canvas.requestPointerLock();

  camera = new THREE.PerspectiveCamera(80, 16 / 9, 1, 10000);
  camera.position.y = 20;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const grid = new THREE.GridHelper(1000, 100);
  scene.add(grid);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(
    ...Utils.getMaximalBounds(window.innerWidth, window.innerHeight)
  );

  // attach event handlers
  window.addEventListener("resize", onresize);
  document.addEventListener("pointerlockchange", onpointerlockchange);
}

/**
 * Renders the scene.
 */
function render() {
  renderer.render(scene, camera);
}

/**
 * Processes movement and collisions.
 */
function process() {

  // get current directional input state
  const inputVector = new THREE.Vector2(
    inputs.right - inputs.left,
    inputs.backward - inputs.forward,
  ).normalize();

  // get forward direction to base movement on
  const cameraDir = new THREE.Vector3();
  camera.getWorldDirection(cameraDir);
  const forwardDir = new THREE.Vector2(cameraDir.x, cameraDir.z).normalize();

  // rotate the input vector
  inputVector.rotateAround(new THREE.Vector2, forwardDir.angle() + Math.PI / 2);

  // update position
  camera.position.x += inputVector.x;
  camera.position.z += inputVector.y;
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
  renderer.setSize(
    ...Utils.getMaximalBounds(window.innerWidth, window.innerHeight)
  );
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
    document.addEventListener("mousemove", onmousemove);
    window.addEventListener("keydown", onkeydown);
    window.addEventListener("keyup", onkeyup);
  } else {
    document.removeEventListener("mousemove", onmousemove);
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
  
  euler.x -= e.movementY * Math.PI / 500;
  euler.y -= e.movementX * Math.PI / 500;

  euler.x = THREE.MathUtils.clamp(euler.x, -Math.PI / 2 + .1, Math.PI / 2 - .1);
  camera.quaternion.setFromEuler(euler);

  render();
}
