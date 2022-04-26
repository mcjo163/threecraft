/**
 * CIS487 Final Project
 * Micah Johnson
 */
"use strict";
import * as THREE from "../build/three.module.js";
import { BLOCKS } from "./blocks.js";
import * as Utils from "./utils.js";
import { World } from "./world.js";

let inputs = {
  left: false,
  right: false,
  forward: false,
  backward: false,
  space: false,
};

let yVelocity = 0;
let canvasFocused = false;
let w, h;
let selectedBlock = 1;

/** @type {HTMLCanvasElement} */
let canvas;

/** @type {HTMLCanvasElement} */
let hudCanvas;

/** @type {THREE.PerspectiveCamera} */
let camera;

/** @type {THREE.OrthographicCamera} */
let hudCamera;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.Scene} */
let hudScene;

/** @type {CanvasRenderingContext2D} */
let hud;

/** @type {THREE.Texture} */
let hudTexture;

/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {THREE.Raycaster} */
let raycaster;

/** @type {THREE.Raycaster} */
let playerFloorcaster;

/** @type {World} */
let world;

/** @type {THREE.Mesh} */
let wireframeOutline;

/** @type {number} */
let t;

/** @type {THREE.Mesh[]} */
let hudItems;

init();
animate();

/**
 * Initializes the program.
 */
function init() {
  canvas = document.querySelector("#c");

  camera = new THREE.PerspectiveCamera(80, 16 / 9, 1, 10000);
  camera.position.y = 18;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  {
    const light = new THREE.DirectionalLight(0xffffff, 0.7);
    light.position.set(200, 300, 150);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;

    // shadow setup
    light.shadow.mapSize.height = 4096;
    light.shadow.mapSize.width = 4096;
    light.shadow.camera.far = 1000;
    light.shadow.camera.right = 300;
    light.shadow.camera.left = -300;
    light.shadow.camera.top = 300;
    light.shadow.camera.bottom = -300;
    scene.add(light);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(150),
      new THREE.MeshBasicMaterial({ color: 0xffffbb })
    );
    sun.position.copy(light.position).multiplyScalar(10);
    scene.add(sun);
  }

  const box = new THREE.BoxGeometry(10, 10, 10);
  const edges = new THREE.EdgesGeometry(box);
  wireframeOutline = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xcfcfcf })
  );
  scene.add(wireframeOutline);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  // renderer.setPixelRatio(window.devicePixelRatio);
  [w, h] = Utils.getMaximalBounds(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;

  raycaster = new THREE.Raycaster();
  raycaster.far = 60;

  playerFloorcaster = new THREE.Raycaster();
  playerFloorcaster.far = 18;

  world = new World(scene, basicWorld());

  resetHud();

  // attach event handlers
  window.addEventListener("resize", onresize);
  canvas.addEventListener("click", canvas.requestPointerLock);
  document.addEventListener("pointerlockchange", onpointerlockchange);
}

function basicWorld() {
  const blocks = [];
  for (let y = 0; y < 40; y++) {
    const layer = [];
    for (let x = 0; x < 40; x++) {
      const row = [];
      for (let z = 0; z < 40; z++) {
        row.push(y <= 19 ? 1 : 0);
      }
      layer.push(row);
    }
    blocks.push(layer);
  }
  return blocks;
}

function resetHud() {
  if (hudCanvas) hudCanvas.remove();

  hudCanvas = document.createElement("canvas");
  [hudCanvas.width, hudCanvas.height] = [w, h];
  hud = hudCanvas.getContext("2d");
  hud.font = "28px consolas";

  hudCamera = new THREE.OrthographicCamera(
    -w / 2,
    w / 2,
    h / 2,
    -h / 2,
    0,
    300
  );
  hudScene = new THREE.Scene();
  hudTexture = new THREE.Texture(hudCanvas);
  hudTexture.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({
    map: hudTexture,
  });
  mat.transparent = true;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  hudScene.add(m);

  {
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(100, 100, 100);
    light.target.position.set(0, 0, 0);
    hudScene.add(light);
    hudScene.add(new THREE.AmbientLight(0xffffff, 0.5));
  }

  let i = w / 20;
  hudItems = [undefined];
  for (const b of BLOCKS)
    if (b) {
      const item = b.createHudItem();
      item.position.z = -150;
      b === BLOCKS[selectedBlock]
        ? item.scale.set(w / 300, w / 300, w / 300)
        : item.scale.set(w / 400, w / 400, w / 400);
      item.rotation.x = Math.PI / 6;
      item.rotation.y = Math.PI / 4;
      item.position.y = h / 2 - w / 20;
      item.position.x = -w / 2 + i;
      i += w / 20;
      hudScene.add(item);
      hudItems.push(item);
    }
}

function updateHud(dt) {
  hud.clearRect(0, 0, w, h);

  // if game is playing, draw relevant HUD items
  if (canvasFocused) {
    // crosshair
    hud.strokeStyle = "#efefef";
    const chSize = h * 0.01;
    hud.beginPath();
    hud.moveTo(w / 2, h / 2 - chSize);
    hud.lineTo(w / 2, h / 2 + chSize);
    hud.stroke();
    hud.beginPath();
    hud.moveTo(w / 2 - chSize, h / 2);
    hud.lineTo(w / 2 + chSize, h / 2);
    hud.stroke();

    // spin the currently selected block's HUD item
    hudItems[selectedBlock].rotation.y += (Math.PI / 2) * dt;
  }
  // otherwise, draw "click to play" message
  else {
    hud.fillStyle = "rgba(0, 0, 0, 0.6)";
    hud.fillRect(0, 0, w, h);
    hud.fillStyle = "white";
    let t = hud.measureText("click to play!");
    hud.fillText("click to play!", (w - t.width) / 2, h / 3);
  }

  hudTexture.needsUpdate = true;
}

/**
 * Renders the scene.
 * @param {number} dt
 */
function render(dt) {
  updateWireframeOutline();
  renderer.render(scene, camera);

  updateHud(dt);
  renderer.render(hudScene, hudCamera);
}

/**
 * Processes movement and collisions.
 * @param {number} dt
 */
function process(dt) {
  const velocity = new THREE.Vector3();

  // apply gravity
  yVelocity -= 300 * dt;

  // get current directional input state
  const inputVector = new THREE.Vector2(
    inputs.right - inputs.left,
    inputs.backward - inputs.forward
  ).normalize();

  // get forward direction to base movement on
  const cameraDir = new THREE.Vector3();
  camera.getWorldDirection(cameraDir);
  const forwardDir = new THREE.Vector2(cameraDir.x, cameraDir.z).normalize();

  // rotate the input vector
  inputVector.rotateAround(
    new THREE.Vector2(),
    forwardDir.angle() + Math.PI / 2
  );

  // set desired velocity
  velocity.x = inputVector.x * 50 * dt;
  velocity.y = yVelocity * dt;
  velocity.z = inputVector.y * 50 * dt;

  // wall collisions
  const boxes = world.getCollisionMask(camera.position);
  const playerBox = new Utils.Box2D(
    new THREE.Vector2(camera.position.x, camera.position.z),
    6
  );

  let collided = false;

  // x-collisions
  let b = playerBox.collideList(boxes, velocity.x, 0);
  if (b) {
    // player would enter a block this frame. snap x value to
    // the side of the box.
    if (velocity.x) {
      velocity.x > 0
        ? (camera.position.x = b.left - playerBox.width / 2)
        : (camera.position.x = b.right + playerBox.width / 2);
      collided = true;
    }
  } else {
    camera.position.x += velocity.x;
  }

  // z-collisions
  b = playerBox.collideList(boxes, 0, velocity.z);
  if (b) {
    // player would enter a block this frame. snap z value to
    // the side of the box.
    if (velocity.z) {
      velocity.z > 0
        ? (camera.position.z = b.bottom - playerBox.height / 2)
        : (camera.position.z = b.top + playerBox.height / 2);
      collided = true;
    }
  } else {
    camera.position.z += velocity.z;
  }

  // x-z diagonal collisions
  b = playerBox.collideList(boxes, velocity.x, velocity.z);
  if (b && !collided) {
    // player would enter a block this frame. x and z to corner.
    if (velocity.x) {
      camera.position.x =
        velocity.x > 0
          ? b.left - playerBox.width / 2
          : b.right + playerBox.width / 2;
    }
    if (velocity.z) {
      camera.position.z =
        velocity.z > 0
          ? b.bottom - playerBox.height / 2
          : b.top + playerBox.height / 2;
    }
  }

  camera.position.y += velocity.y;
  // update position, keep within world bounds
  camera.position
    // .add(velocity)
    .clamp(
      new THREE.Vector3(-200, -182, -200),
      new THREE.Vector3(200, 198, 200)
    );

  // floor collision
  const collidables = world.nearby(camera.position, 2);

  // check four corners of player's collision area
  // . x
  // . .
  playerFloorcaster.set(
    new THREE.Vector3().addVectors(
      camera.position,
      new THREE.Vector3(2.999999999, 0, 2.999999999)
    ),
    new THREE.Vector3(0, -1, 0)
  );
  let intersects = playerFloorcaster.intersectObjects(collidables, false);

  // x .
  // . .
  playerFloorcaster.set(
    new THREE.Vector3().addVectors(
      camera.position,
      new THREE.Vector3(-2.999999999, 0, 2.999999999)
    ),
    new THREE.Vector3(0, -1, 0)
  );
  intersects.push(...playerFloorcaster.intersectObjects(collidables, false));

  // . .
  // . x
  playerFloorcaster.set(
    new THREE.Vector3().addVectors(
      camera.position,
      new THREE.Vector3(2.999999999, 0, -2.999999999)
    ),
    new THREE.Vector3(0, -1, 0)
  );
  intersects.push(...playerFloorcaster.intersectObjects(collidables, false));

  // . .
  // x .
  playerFloorcaster.set(
    new THREE.Vector3().addVectors(
      camera.position,
      new THREE.Vector3(-2.999999999, 0, -2.999999999)
    ),
    new THREE.Vector3(0, -1, 0)
  );
  intersects.push(...playerFloorcaster.intersectObjects(collidables, false));

  // filter intersects to avoid detecting the weird ghost objects at the origin
  // (make sure the intersection point is grid-aligned)... not a nice solution
  intersects = [...intersects].filter((i) => i.point.y % 10 == 0);

  if (intersects.length && yVelocity < 0) {
    const dist = Math.min(...intersects.map((i) => i.distance));
    camera.position.add(new THREE.Vector3(0, 18 - dist, 0));

    // reset velocity or start a jump
    yVelocity =
      inputs.space &&
      world.isEmpty(
        Utils.positionToWorldIndices(camera.position).add(
          new THREE.Vector3(0, 1, 0)
        )
      )
        ? 85
        : 0;
  }
}

function animate(time) {
  if (!t) t = time;
  const dt = time - t;

  if (dt > 1000 / 60) {
    if (canvasFocused) process(dt / 1000);
    render(dt / 1000);
    t = time;
  }

  requestAnimationFrame(animate);
}

function updateWireframeOutline() {
  raycaster.setFromCamera(new THREE.Vector2(), camera);
  const intersects = raycaster.intersectObjects(
    world.nearby(camera.position, 6),
    false
  );
  if (intersects.length) {
    const [intersect, ..._] = intersects;
    wireframeOutline.position.copy(intersect.object.position);
    wireframeOutline.material.visible = true;
  } else {
    wireframeOutline.material.visible = false;
  }
}

/**
 * Handles window resizes. Ensures the canvas maintains
 * a 16:9 aspect ratio.
 */
function onresize() {
  [w, h] = Utils.getMaximalBounds(window.innerWidth, window.innerHeight);
  renderer.setSize(w, h);

  resetHud();
}

/**
 * Handles keydown events.
 * @param {KeyboardEvent} e event
 */
function onkeydown(e) {
  switch (e.key) {
    case "w":
      inputs.forward = true;
      break;
    case "s":
      inputs.backward = true;
      break;
    case "a":
      inputs.left = true;
      break;
    case "d":
      inputs.right = true;
      break;
    case " ":
      inputs.space = true;
      break;
  }
}

/**
 * Handles keyup events.
 * @param {KeyboardEvent} e event
 */
function onkeyup(e) {
  switch (e.key) {
    case "w":
      inputs.forward = false;
      break;
    case "s":
      inputs.backward = false;
      break;
    case "a":
      inputs.left = false;
      break;
    case "d":
      inputs.right = false;
      break;
    case " ":
      inputs.space = false;
      break;
  }
}

/**
 * Determines whether the game should recieve input.
 */
function onpointerlockchange() {
  if (document.pointerLockElement === canvas) {
    // set focus state, remove click handler
    canvasFocused = true;
    canvas.removeEventListener("click", canvas.requestPointerLock);

    // attach input handlers
    document.addEventListener("mousemove", onmousemove);
    document.addEventListener("pointerdown", onpointerdown);
    document.addEventListener("wheel", onwheel);
    window.addEventListener("keydown", onkeydown);
    window.addEventListener("keyup", onkeyup);
  } else {
    // set focus state, add click handler back
    canvasFocused = false;
    canvas.addEventListener("click", canvas.requestPointerLock);

    // detach input handlers
    document.removeEventListener("mousemove", onmousemove);
    document.removeEventListener("pointerdown", onpointerdown);
    document.removeEventListener("wheel", onwheel);
    window.removeEventListener("keydown", onkeydown);
    window.removeEventListener("keyup", onkeyup);
  }
}

/**
 * Rotates the camera based on mouse movement.
 * @param {MouseEvent} e event
 */
function onmousemove(e) {
  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  euler.setFromQuaternion(camera.quaternion);

  euler.x -= (e.movementY * Math.PI) / 2400;
  euler.y -= (e.movementX * Math.PI) / 2400;

  euler.x = THREE.MathUtils.clamp(
    euler.x,
    -Math.PI / 2 + 0.01,
    Math.PI / 2 - 0.01
  );
  camera.quaternion.setFromEuler(euler);
}

/**
 * Places or removes a block.
 * @param {MouseEvent} e event
 */
function onpointerdown(e) {
  raycaster.setFromCamera(new THREE.Vector2(), camera);
  const intersects = raycaster.intersectObjects(
    world.nearby(camera.position, 6),
    false
  );
  // if anything was intersected with
  if (intersects.length) {
    const [intersect, ..._] = intersects;

    switch (e.button) {
      case 0:
        // left click - break block
        world.removeBlock(intersect.point.sub(intersect.face.normal));
        break;
      case 2:
        // right click - place block
        // avoid placing blocks that would overlap the player
        const blockPosition = Utils.snapPositionToGrid(
          intersect.point.add(intersect.face.normal)
        );
        const playerBox = new Utils.Box2D(
          new THREE.Vector2(camera.position.x, camera.position.z),
          6
        );
        const box = new Utils.Box2D(
          new THREE.Vector2(blockPosition.x, blockPosition.z),
          10
        );

        const overlapsPlayer =
          playerBox.collide(box) &&
          -5 < camera.position.y - blockPosition.y &&
          camera.position.y - blockPosition.y < 23;

        if (!overlapsPlayer) world.addBlock(blockPosition, selectedBlock);
        break;
    }
  }
}

/**
 * Changes selected block.
 * @param {WheelEvent} e event
 */
function onwheel(e) {
  if (e.deltaY != 0) {
    const dir = e.deltaY / Math.abs(e.deltaY);
    hudItems[selectedBlock].rotation.y = Math.PI / 4;
    hudItems[selectedBlock].scale.set(w / 400, w / 400, w / 400);
    selectedBlock =
    THREE.MathUtils.euclideanModulo(
      selectedBlock + dir - 1,
      BLOCKS.length - 1
      ) + 1;
    hudItems[selectedBlock].scale.set(w / 300, w / 300, w / 300);
  }
}
