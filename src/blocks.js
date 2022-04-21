/**
 * Block definitions
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";

const loader = new THREE.TextureLoader();

class Block {
  constructor(textureName) {
    /** @type {THREE.Texture} */
    this.texture = loader.load(`../textures/${textureName}.png`);
    this.texture.magFilter = THREE.NearestFilter;

    /** @type {THREE.MeshLambertMaterial} */
    this.material = new THREE.MeshBasicMaterial({map: this.texture});

    /** @type {THREE.BoxGeometry} */
    this.geometry = new THREE.BoxGeometry(10, 10, 10);
  }

  /**
   * Creates and returns a new Object3D instance of this block.
   * @param {THREE.Vector3} position desired position
   * @returns {THREE.Mesh} the new instance
   */
  create(position) {
    const m = new THREE.Mesh(this.geometry, this.material);
    if (position) m.position.copy(position);
    return m;
  }
}

export const BLOCKS = [
  undefined,
  new Block("plank"),
];
