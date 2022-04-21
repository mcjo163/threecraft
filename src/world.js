/**
 * World class
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";
import * as Utils from "./utils.js";
import { BLOCKS } from "./blocks.js";

export class World {
  /**
   * Creates an empty world or creates one if blocks are given
   * @param {THREE.Scene} scene The scene to add the blocks to
   * @param {number[][][]} blocks world data
   */
  constructor(scene, blocks) {
    this.scene = scene;
    // if block template is given, create the necessary blocks
    // and use them as the world blockdata.
    for (let y = 0; y < blocks.length; y++) {
      for (let x = 0; x < blocks[y].length; x++) {
        for (let z = 0; z < blocks[y][x].length; z++) {
          const block = blocks[y][x][z];
          const obj =
            block > 0
              ? BLOCKS[block].create(
                  Utils.worldIndicesToPosition(new THREE.Vector3(x, y, z))
                )
              : null;
          // if (obj) this.scene.add(obj);
          blocks[y][x][z] = { block, obj };
        }
      }
    }

    /**
     * @type {{
     *    block: number;
     *    obj: THREE.Object3D;
     *  }[][][]}
     */
    this.blockdata = blocks;

    for (let y = 0; y < this.blockdata.length; y++) {      
      for (let x = 0; x < this.blockdata[y].length; x++) {      
        for (let z = 0; z < this.blockdata[y][x].length; z++) {      
          if (this.isExposed(new THREE.Vector3(x, y, z)))
            this.scene.add(this.blockdata[y][x][z].obj);
        }
      }
    }
  }

  /**
   * Determines if the given indices are within the world bounds.
   * @param {THREE.Vector3} indices position to check
   * @returns {boolean}
   */
  isInWorld(indices) {
    return !!(
      this.blockdata[indices.y] &&
      this.blockdata[indices.y][indices.x] &&
      this.blockdata[indices.y][indices.x][indices.z]
    );
  }

  /**
   * Determines if the block at the given indices is exposed
   * (if it is not fully surrounded by other blocks)
   * @param {THREE.Vector3} indices position to check
   * @returns {boolean}
   */
  isExposed(indices) {
    const [x, y, z] = [indices.x, indices.y, indices.z];
    if (this.blockdata[y][x][z].block == 0) return false;

    for (const _y of [-1, 1]) {
      for (const _x of [-1, 1]) {
        for (const _z of [-1, 1]) {
          const i = new THREE.Vector3(x + _x, y + _y, z + _z);
          if (this.isInWorld(i)) {
            const b = this.blockdata[i.y][i.x][i.z];
            if (b.block == 0) return true;
          } else {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Inserts a new block into the world at the specfied location.
   * @param {THREE.Vector3} position world location to add
   * @param {number} block block id
   */
  addBlock(position, block) {
    const i = Utils.positionToWorldIndices(position);
    if (!this.isInWorld(i)) return;

    // ensure this spot is available
    if (this.blockdata[i.y][i.x][i.z].block == 0) {
      const obj = BLOCKS[block].create(Utils.worldIndicesToPosition(i));
      this.blockdata[i.y][i.x][i.z] = { block, obj };
      this.scene.add(obj);
    }
  }

  /**
   * Removes a block from the world at the specified location.
   * @param {THREE.Vector3} position world location to remove
   */
  removeBlock(position) {
    const i = Utils.positionToWorldIndices(position);
    if (!this.isInWorld(i)) return;

    if (this.blockdata[i.y][i.x][i.z].block != 0) {
      this.scene.remove(this.blockdata[i.y][i.x][i.z].obj);
      this.blockdata[i.y][i.x][i.z] = { block: 0, obj: null };
    }
  }

  /**
   * Gets all objects in the world.
   * @returns {THREE.Object3D[]} objects
   */
  objects() {
    return this.blockdata
      .flat(3)
      .filter((b) => b.obj)
      .map((b) => b.obj);
  }

  /**
   * Gets a list of cube objects that are near to the given position.
   * @param {THREE.Vector3} position world position
   * @returns {THREE.Object3D[]} neighbors
   */
  getNeighboringObjects(position) {}
}
