/**
 * Block definitions
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";

const loader = new THREE.TextureLoader();

class Block {
  constructor(textureName, shiny) {
    if (document.URL.includes("github")) {
      /** @type {THREE.Texture} */
      this.texture = loader.load(
        `https://mcjo163.github.io/threecraft/textures/${textureName}.png`
      );
      
    } else {
      this.texture = loader.load(`../textures/${textureName}.png`);
    }

    this.texture.magFilter = THREE.NearestFilter;

    /** @type {THREE.Material} */
    this.material = new (
      shiny ? THREE.MeshPhongMaterial : THREE.MeshLambertMaterial
    )({ map: this.texture });

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
    m.receiveShadow = true;
    if (position) m.position.copy(position);
    return m;
  }

  /**
   * Creates a mesh to render on the HUD.
   * @returns {THREE.Mesh}
   */
  createHudItem() {
    return new THREE.Mesh(this.geometry, this.material);
  }
}

export const BLOCKS = [
  undefined,
  new Block("stone", false),
  new Block("plank", false),
  new Block("cobblestone", false),
  new Block("bricks", false),
  new Block("iron", true),
  new Block("gold", true),
];
