/**
 * Utility functions and classes
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";

export class Box2D {
  /**
   * Creates a Box2D centered at `center`.
   * @param {THREE.Vector2} center center of the box
   * @param {number} width box width
   * @param {number} height box height (omit for square)
   */
  constructor(center, width, height) {
    if (!height) height = width;
    this.center = center;
    this.width = width;
    this.height = height;

    this.left = center.x - width / 2;
    this.right = center.x + width / 2;
    this.top = center.y + height / 2;
    this.bottom = center.y - height / 2;
  }

  /**
   * Checks if this Box2D is overlapping another one.
   * @param {Box2D} other another Box2D
   * @param {number} dx x offset to check
   * @param {number} dy y offset to check
   * @returns {boolean}
   */
  collide(other, dx = 0, dy = 0) {
    const l = this.left + dx,
      r = this.right + dx,
      t = this.top + dy,
      b = this.bottom + dy;

    return (
      r > other.left && l < other.right && t > other.bottom && b < other.top
    );
  }

  /**
   * Checks for collisions against a list of other Box2Ds
   * @param {Box2D[]} others a list of Box2Ds
   * @param {number} dx x offset
   * @param {number} dy y offset
   * @returns {Box2D | false} the (first) collided box, or false if no collision
   */
  collideList(others, dx = 0, dy = 0) {
    for (const other of others) if (this.collide(other, dx, dy)) return other;
    return false;
  }
}

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

/**
 * Snaps any position in the world to the center of the
 * block it is in.
 * @param {THREE.Vector3} position position
 * @returns {THREE.Vector3}
 */
export function snapPositionToGrid(position) {
  return worldIndicesToPosition(positionToWorldIndices(position));
}
