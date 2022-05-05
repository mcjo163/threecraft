/**
 * World generation functions
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";

/**
 * Generates a world with the given generator function
 * @param {Function} generator Function that takes
 * x, y, z and returns a block ID
 * @returns {number[][][]}
 */
function generate(generator) {
  const blocks = [];
  for (let y = 0; y < 40; y++) {
    const layer = [];
    for (let x = 0; x < 40; x++) {
      const row = [];
      for (let z = 0; z < 40; z++) {
        row.push(generator(x, y, z));
      }
      layer.push(row);
    }
    blocks.push(layer);
  }
  return blocks;
}

/**
 * Generates a flat world with grass, dirt, and stone
 * @returns {number[][][]}
 */
export function basicWorld() {
  return generate((_x, y, _z) => {
    if (y == 19) return 1;
    else if (13 <= y && y < 19) return 2;
    else if (y < 13) return 3;
    else return 0;
  });
}

/**
 * Generates a world using Perlin Noise.
 * @returns {number[][][]}
 */
export function noiseWorld() {
  const blocks = generate((x, y, z) => {
    const surfaceHeight = perlin.get(x / 20 - 1, z / 20 - 1) * 6;
    const yOffset = y - 19;
    if (yOffset > surfaceHeight) return 0;
    else if (yOffset + 1 > surfaceHeight) return 1;
    else if (yOffset + 6 > surfaceHeight) return 2;
    else return 3;
  });

  // generate 10-20 trees in the world
  generateTrees(blocks, Math.floor(Math.random() * 10) + 10);

  return blocks;
}

function generateTrees(blocks, n) {
  /** @type {THREE.Vector2[]} */
  const positions = [];

  // generate possible tree positions
  while (positions.length < n) {
    const newPos = new THREE.Vector2(
      Math.floor(Math.random() * 34) + 3,
      Math.floor(Math.random() * 34) + 3
    );
    let skip = false;
    for (const p of positions) {
      if (p.distanceTo(newPos) < 3) skip = true;
    }
    if (!skip) positions.push(newPos);
  }

  // construct trees at each position
  for (const { x, y: z } of positions) {
    // find the surface at this position
    let y = 0;
    while (blocks[y][x][z]) y++;

    // build the tree!
    for (let _y = 0; _y < 5; _y++) {
      switch (_y) {
        // first two layers are just logs
        case 0:
        case 1:
          blocks[y + _y][x][z] = 4;
          break;

        // third layer has a log surrounded by leaves,
        // with diagonals each having a 40% chance to spawn
        case 2:
          for (const _x of [-1, 0, 1]) {
            for (const _z of [-1, 0, 1]) {
              if (Math.abs(_x) + Math.abs(_z) == 2) {
                if (Math.random() < 0.4) blocks[y + _y][x + _x][z + _z] = 5;
              } else {
                blocks[y + _y][x + _x][z + _z] = 5;
              }
            }
          }
          blocks[y + _y][x][z] = 4;
          break;

        // fourth layer has a log surrounded on all
        // sides by leaves
        case 3:
          for (const _x of [-1, 0, 1]) {
            for (const _z of [-1, 0, 1]) {
              blocks[y + _y][x + _x][z + _z] = 5;
            }
          }
          blocks[y + _y][x][z] = 4;
          break;

        // fifth (top) layer is leaves, diagonals have a 30%
        // chance to spawn
        case 4:
          for (const _x of [-1, 0, 1]) {
            for (const _z of [-1, 0, 1]) {
              if (Math.abs(_x) + Math.abs(_z) == 2) {
                if (Math.random() < 0.3) blocks[y + _y][x + _x][z + _z] = 5;
              } else {
                blocks[y + _y][x + _x][z + _z] = 5;
              }
            }
          }
          break;
      }
    }
  }
}
