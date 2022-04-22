/**
 * Utility functions
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";

/**
 * Returns the dimensions of the largest rectangle
 * with the given aspect ratio that can fit within 
 * the given screen dimensions.
 * @param {number} width screen width
 * @param {number} height screen height
 * @param {number} aspect screen aspect ratio
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
  return indices;
}

/**
 * Converts world array indices to a point in the world.
 * @param {THREE.Vector3} indices indices
 * @returns {THREE.Vector3} the position
 */
export function worldIndicesToPosition(indices) {
  const position = new THREE.Vector3();
  position.copy(indices).addScalar(-20).multiplyScalar(10).addScalar(5);
  return position;
}
