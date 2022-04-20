/**
 * Utility functions
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";

/**
 * Returns the dimensions of the largest 16:9 rectangle
 * that can fit within the given screen dimensions.
 * @param {number} width screen width
 * @param {number} height screen height
 * @returns {number[]} the bounds
 */
export function getMaximalBounds(width, height, aspect = 16 / 9) {
  return width > height * aspect
    ? [height * aspect, height]
    : [width, width / aspect];
}

/**
 * Converts a point in the world to the corresponding
 * indices for the world array.
 * @param {THREE.Vector3} position position
 * @returns {THREE.Vector3} the indices
 */
export function positionToWorldIndices(position) {
  const indices = new THREE.Vector3();
  indices.copy(position).divideScalar(10).floor().addScalar(20);
  indices.y -= 20;
  return indices;
}

export function worldIndicesToPosition(indices) {

  const position = new THREE.Vector3();
  position.copy(indices);
  position.y += 20;
  position.addScalar(-20).multiplyScalar(10).addScalar(5);
  return position;
}
