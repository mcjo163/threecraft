/**
 * Utility functions
 * Micah Johnson
 */
"use strict";

/**
 * Returns the dimenstions of the largest 16:9 rectangle
 * that can fit within the given screen dimensions.
 * @param {number} width screen width
 * @param {number} height screen height
 * @returns {number[]} the bounds
 */
export function getMaximalBounds(width, height, aspect=16/9) {
  return width > height * aspect
    ? [height * aspect, height]
    : [width, width / aspect];
}
