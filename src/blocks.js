/**
 * Block definitions
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";

const loader = new THREE.TextureLoader();

class Block {
  constructor(shiny, ...textureNames) {
    this.materials = Block.getMaterials(shiny, textureNames);

    /** @type {THREE.BoxGeometry} */
    this.geometry = new THREE.BoxGeometry(10, 10, 10);
  }

  /**
   * Creates an array of references to materials
   * @param {string[]} textureNames texture names for block
   * @returns {THREE.Material[]} materials
   */
  static getMaterials(shiny, textureNames) {
    const uniqueNames = new Set(textureNames);
    let materialLookup = {};
    for (const n of uniqueNames) {
      let texture;
      // resource location depends on where this is running...
      if (document.URL.includes("github")) {
        texture = loader.load(`${document.URL}/textures/${n}.png`);
      } else {
        texture = loader.load(`../textures/${n}.png`);
      }

      // removes texture blur
      texture.magFilter = THREE.NearestFilter;

      // create material
      materialLookup[n] = new (
        shiny ? THREE.MeshPhongMaterial : THREE.MeshLambertMaterial
      )({
        map: texture,
      });
    }
    return textureNames.map((n) => materialLookup[n]);
  }

  /**
   * Creates and returns a new Object3D instance of this block.
   * @param {THREE.Vector3} position desired position
   * @returns {THREE.Mesh} the new instance
   */
  create(position) {
    const m = new THREE.Mesh(
      this.geometry,
      this.materials.length > 1 ? this.materials : this.materials[0]
    );

    m.receiveShadow = true;
    if (position) m.position.copy(position);
    return m;
  }

  /**
   * Creates a mesh to render on the HUD.
   * @returns {THREE.Mesh}
   */
  createHudItem() {
    return new THREE.Mesh(
      this.geometry,
      this.materials.length > 1 ? this.materials : this.materials[0]
    );
  }
}

export const BLOCKS = [
  undefined,
  new Block(
    false,
    "grass_side",
    "grass_side",
    "grass",
    "dirt",
    "grass_side",
    "grass_side"
  ),
  new Block(false, "dirt"),
  new Block(false, "stone"),
  new Block(false, "log", "log", "log_top", "log_top", "log", "log"),
  new Block(false, "leaves"),
  new Block(false, "plank"),
  new Block(false, "cobblestone"),
  new Block(false, "bricks"),
  new Block(true, "iron"),
  new Block(true, "gold"),
];
