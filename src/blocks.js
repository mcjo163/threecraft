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
   * @returns {THREE.Mesh} the new instance
   */
  create() {
    return new THREE.Mesh(this.geometry, this.material);
  }
}

export const BLOCKS = [
  undefined,
  new Block("plank"),
];
