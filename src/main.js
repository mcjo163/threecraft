/**
 * CIS487 Final Project
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";
import * as Utils from "./utils.js";

/** @type {HTMLCanvasElement} */
let canvas;

/** @type {THREE.PerspectiveCamera} */
let camera;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.WebGLRenderer} */
let renderer;

init();
render();

/**
 * Initializes the program.
 */
function init() {
  canvas = document.querySelector("#c");

  camera = new THREE.PerspectiveCamera(80, 16 / 9, 1, 10000);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(
    ...Utils.getMaximalBounds(window.innerWidth, window.innerHeight)
  );

  // attach event handlers
  window.addEventListener("resize", onresize);
}

/**
 * Renders the scene.
 */
function render() {
  renderer.render(scene, camera);
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
