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
          blocks[y][x][z] = { block, obj, exposed: false };
        }
      }
    }

    /**
     * @type {{
     *    block: number;
     *    obj: THREE.Object3D;
     *    exposed: boolean;
     *  }[][][]}
     */
    this.blockdata = blocks;

    for (let y = 0; y < this.blockdata.length; y++) {
      for (let x = 0; x < this.blockdata[y].length; x++) {
        for (let z = 0; z < this.blockdata[y][x].length; z++) {
          if (this.isExposed(new THREE.Vector3(x, y, z))) {
            this.blockdata[y][x][z].exposed = true;
            this.scene.add(this.blockdata[y][x][z].obj);
          }
        }
      }
    }

    this.updateWorldMesh();
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
   * Gets indices of all valid non-diagonal neighbors
   * of the given world index.
   * @param {THREE.Vector3} indices position
   * @returns {THREE.Vector3[]} neighbors
   */
  neighbors(indices) {
    const [x, y, z] = [indices.x, indices.y, indices.z];
    const neighbors = [];
    for (const _x of [-1, 1]) {
      const i = new THREE.Vector3(x + _x, y, z);
      if (this.isInWorld(i)) neighbors.push(i);
    }
    for (const _y of [-1, 1]) {
      const i = new THREE.Vector3(x, y + _y, z);
      if (this.isInWorld(i)) neighbors.push(i);
    }
    for (const _z of [-1, 1]) {
      const i = new THREE.Vector3(x, y, z + _z);
      if (this.isInWorld(i)) neighbors.push(i);
    }
    return neighbors;
  }

  /**
   * Checks if the given position is empty
   * @param {THREE.Vector3} indices position to check
   * @returns {boolean}
   */
  isEmpty(indices) {
    const [x, y, z] = [indices.x, indices.y, indices.z];
    return !this.isInWorld(indices) || this.blockdata[y][x][z].block == 0;
  }

  /**
   * Determines if the block at the given indices is exposed
   * (if it is not fully surrounded by other blocks)
   * @param {THREE.Vector3} indices position to check
   * @returns {boolean}
   */
  isExposed(indices) {
    if (this.isEmpty(indices)) return false;

    // check all non-diagonal neighbors
    const neighbors = this.neighbors(indices);
    if (neighbors.length < 6) return true;

    for (const i of neighbors) {
      if (this.isEmpty(i)) return true;
    }

    return false;
  }

  /**
   * Generates the position, normal, and index arrays
   * @returns {{
   *  positions: number[];
   *  normals: number[];
   *  indices: number[];
   * }} data
   */
  generateGeometryData() {
    const positions = [];
    const normals = [];
    const indices = [];

    for (let y = 0; y < this.blockdata.length; y++) {
      for (let x = 0; x < this.blockdata[y].length; x++) {
        for (let z = 0; z < this.blockdata[y][x].length; z++) {
          const i = new THREE.Vector3(x, y, z);
          if (!this.isEmpty(i)) {
            for (const { dir, corners } of World.faces) {
              const _i = new THREE.Vector3().addVectors(
                i,
                new THREE.Vector3(...dir)
              );
              if (this.isEmpty(_i)) {
                const ndx = positions.length / 3;
                for (const pos of corners) {
                  positions.push(pos[0] + x, pos[1] + y, pos[2] + z);
                  normals.push(...dir);
                }
                indices.push(ndx, ndx + 1, ndx + 2, ndx + 2, ndx + 1, ndx + 3);
              }
            }
          }
        }
      }
    }
    return { positions, normals, indices };
  }

  updateWorldMesh() {
    // create mesh if needed
    if (!this.mesh) {
      const geometry = new THREE.BufferGeometry();

      this.mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          blending: THREE.AdditiveBlending,
        })
      );
      this.mesh.castShadow = true;
      this.mesh.position.sub(new THREE.Vector3(200, 200, 200));
      this.mesh.scale.set(10, 10, 10);
      this.scene.add(this.mesh);
    }

    // update geometry data
    const { positions, normals, indices } = this.generateGeometryData();
    this.mesh.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    ).needsUpdate = true;
    this.mesh.geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(normals), 3)
    ).needsUpdate = true;
    this.mesh.geometry.setIndex(indices);
  }

  /**
   * Gets a list of Box2D objects representing collidable blocks.
   * @param {THREE.Vector3} position head position
   * @returns {Utils.Box2D[]} boxes of nearby blocks
   */
  getCollisionMask(position) {
    const i = Utils.positionToWorldIndices(position);
    const mask = [];
    for (const _x of [-1, 0, 1]) {
      for (const _z of [-1, 0, 1]) {
        // basically, include the block in the mask if it is possible
        // for the player to collide with it (needs to include 2 or
        // 3 world layers depending on the y-value of the player)
        if (
          this.isInWorld(new THREE.Vector3(i.x + _x, i.y, i.z + _z)) &&
          (this.blockdata[i.y][i.x + _x][i.z + _z].block ||
            this.blockdata[i.y - 1][i.x + _x][i.z + _z].block ||
            (THREE.MathUtils.euclideanModulo(position.y, 10) < 8
              ? this.blockdata[i.y - 2][i.x + _x][i.z + _z].block
              : false))
        ) {
          const p = Utils.worldIndicesToPosition(
            new THREE.Vector3(i.x + _x, i.y, i.z + _z)
          );
          mask.push(new Utils.Box2D(new THREE.Vector2(p.x, p.z), 10));
        }
      }
    }
    return mask;
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
    if (this.isEmpty(i)) {
      const obj = BLOCKS[block].create(Utils.worldIndicesToPosition(i));
      this.blockdata[i.y][i.x][i.z] = { block, obj, exposed: true };
      this.scene.add(obj);
    } else {
      return;
    }

    // hide any newly covered blocks (any of this block's neighbors
    // are candidates)
    for (const _i of this.neighbors(i)) {
      if (this.isInWorld(_i) && !this.isExposed(_i) && !this.isEmpty(_i)) {
        this.blockdata[_i.y][_i.x][_i.z].exposed = false;
        this.scene.remove(this.blockdata[_i.y][_i.x][_i.z].obj);
      }
    }

    this.updateWorldMesh();
  }

  /**
   * Removes a block from the world at the specified location.
   * @param {THREE.Vector3} position world location to remove
   */
  removeBlock(position) {
    const i = Utils.positionToWorldIndices(position);
    if (!this.isInWorld(i)) return;

    if (!this.isEmpty(i)) {
      this.scene.remove(this.blockdata[i.y][i.x][i.z].obj);
      this.blockdata[i.y][i.x][i.z] = { block: 0, obj: null, exposed: false };
    }

    // expose any newly uncovered blocks (any of this block's neighbors
    // are candidates)
    for (const _i of this.neighbors(i)) {
      if (this.isInWorld(_i) && this.isExposed(_i) && !this.isEmpty(_i)) {
        if (!this.blockdata[_i.y][_i.x][_i.z].exposed) {
          this.blockdata[_i.y][_i.x][_i.z].exposed = true;
          this.scene.add(this.blockdata[_i.y][_i.x][_i.z].obj);
        }
      }
    }

    this.updateWorldMesh();
  }

  /**
   * Gets a list of cube objects that are near to the given position.
   * @param {THREE.Vector3} position world position
   * @returns {THREE.Object3D[]} neighbors
   */
  nearby(position, dist = 1) {
    const i = Utils.positionToWorldIndices(position);
    const nearby = [];
    for (let y = i.y - dist; y <= i.y + dist; y++) {
      for (let x = i.x - dist; x <= i.x + dist; x++) {
        for (let z = i.z - dist; z <= i.z + dist; z++) {
          if (
            this.isInWorld(new THREE.Vector3(x, y, z)) &&
            this.blockdata[y][x][z].block != 0 &&
            this.blockdata[y][x][z].exposed
          ) {
            nearby.push(this.blockdata[y][x][z].obj);
          }
        }
      }
    }
    return nearby;
  }
}

World.faces = [
  {
    // left
    dir: [-1, 0, 0],
    corners: [
      [0, 1, 0],
      [0, 0, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  },
  {
    // right
    dir: [1, 0, 0],
    corners: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
      [1, 0, 0],
    ],
  },
  {
    // bottom
    dir: [0, -1, 0],
    corners: [
      [1, 0, 1],
      [0, 0, 1],
      [1, 0, 0],
      [0, 0, 0],
    ],
  },
  {
    // top
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
  {
    // back
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    // front
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ],
  },
];
