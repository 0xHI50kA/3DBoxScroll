
import * as THREE from "three";

// ------------------------------------
// 1. CREATE THE SCENE
// ------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b10);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(4, 3.5, 7);
camera.lookAt(0, 1.3, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById("scene-container")
    .appendChild(renderer.domElement);


// ------------------------------------
// 2. ADD LIGHTS
// ------------------------------------

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const blueLight = new THREE.PointLight(0x29bfff, 35);
blueLight.position.set(2, 4, 3);
scene.add(blueLight);

const topLight = new THREE.DirectionalLight(0xffffff, 2);
topLight.position.set(-3, 5, 4);
scene.add(topLight);


// ------------------------------------
// 3. CREATE THE BOX
// ------------------------------------

const box = new THREE.Group();
scene.add(box);

const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x182431,
    metalness: 0.65,
    roughness: 0.3,
    transparent: true,
    opacity: 1
});

const insideMaterial = new THREE.MeshStandardMaterial({
    color: 0x07131f,
    metalness: 0.4,
    roughness: 0.6,
    transparent: true,
    opacity: 1
});

// Helper: create a box part at a position
function makePart(width, height, depth, x, y, z, material) {

    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);

    box.add(mesh);

    return mesh;
}

// Bottom
makePart(
    2, 0.2, 2,
    0, 0.1, 0,
    darkMaterial
);

// Four walls
makePart(
    2, 1.5, 0.15,
    0, 0.95, 0.925,
    darkMaterial
);

makePart(
    2, 1.5, 0.15,
    0, 0.95, -0.925,
    darkMaterial
);

makePart(
    0.15, 1.5, 1.7,
    -0.925, 0.95, 0,
    darkMaterial
);

makePart(
    0.15, 1.5, 1.7,
    0.925, 0.95, 0,
    darkMaterial
);


// ------------------------------------
// 4. CREATE AN INDEPENDENT LID
// ------------------------------------

// The pivot is attached to the rear edge.
// Rotating this group opens and closes the lid.

const lidPivot = new THREE.Group();

lidPivot.position.set(0, 1.72, -0.85);
box.add(lidPivot);

const lidGeometry = new THREE.BoxGeometry(
    2.1, 0.16, 1.9
);

const lid = new THREE.Mesh(
    lidGeometry,
    darkMaterial
);

// Offset the lid relative to its pivot
lid.position.set(0, 0, 0.95);

lidPivot.add(lid);


// ------------------------------------
// 5. CREATE THE OBJECT INSIDE THE BOX
// ------------------------------------

// An octahedron looks like a simple crystal.

const objectGeometry = new THREE.OctahedronGeometry(0.48, 0);

const objectMaterial = new THREE.MeshStandardMaterial({
    color: 0x24cfff,
    emissive: 0x0875bb,
    emissiveIntensity: 1.8,
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 1
});

const crystal = new THREE.Mesh(
    objectGeometry,
    objectMaterial
);

crystal.position.set(0, 0.55, 0);
scene.add(crystal);


// ------------------------------------
// 6. SCROLL PROGRESS
// ------------------------------------

let scrollProgress = 0;

// Keep a value between 0 and 1
function clamp(value) {
    return Math.max(0, Math.min(1, value));
}

// Smoothly transition between two scroll positions
function range(value, start, end) {

    const t = clamp((value - start) / (end - start));

    // Smoothstep easing
    return t * t * (3 - 2 * t);
}

// Update progress whenever the page scrolls
function updateScroll() {

    const maxScroll =
        document.documentElement.scrollHeight -
        window.innerHeight;

    scrollProgress = maxScroll > 0
        ? clamp(window.scrollY / maxScroll)
        : 0;
}

window.addEventListener("scroll", updateScroll, {
    passive: true
});

updateScroll();



 // ------------------------------------
 // 7. SHATTER, SPIN, REASSEMBLE, DISAPPEAR
 // ------------------------------------

 // Save the original transforms of the box parts.
 // The bottom, four walls, and lid pivot are separate pieces.

 const pieces = box.children.map((part, index) => ({
     part: part,
     originalPosition: part.position.clone(),
     originalRotation: part.rotation.clone(),

     // Each piece travels in a different direction.
     direction: [
         new THREE.Vector3(0, -1, 0),
         new THREE.Vector3(0, 1, 1),
         new THREE.Vector3(0, 1, -1),
         new THREE.Vector3(-1, 0.5, 0),
         new THREE.Vector3(1, 0.5, 0),
         new THREE.Vector3(0, 1.5, -1)
     ][index] || new THREE.Vector3(1, 1, 1)
 }));

 // Enable transparency for every box material.
 box.traverse((child) => {
     if (child.isMesh) {
         child.material.transparent = true;
     }
 });

 function animate() {

     requestAnimationFrame(animate);

     const p = scrollProgress;

     // ------------------------------------
     // A. SHATTER THE BOX
     // ------------------------------------

     const shatter = range(p, 0.15, 0.40);

     // Reassemble the pieces from 65% to 85%.
     const reassemble = range(p, 0.65, 0.85);

     // 0 = assembled, 1 = fully shattered.
     const explosionAmount = shatter * (1 - reassemble);

     // ------------------------------------
     // B. MOVE AND SPIN EACH PIECE
     // ------------------------------------

     pieces.forEach((piece, index) => {

         const part = piece.part;

         const direction = piece.direction.clone().normalize();

         // Move the pieces away from the box.
         const distance = 2.5 * explosionAmount;

         part.position.copy(piece.originalPosition);

         part.position.addScaledVector(
             direction,
             distance
         );

         // Give each piece its own spinning direction.
         const spin = explosionAmount * Math.PI * 2;

         part.rotation.set(
             piece.originalRotation.x + spin * (index % 2 === 0 ? 1 : -1),
             piece.originalRotation.y + spin * (index % 3 === 0 ? 1 : -1),
             piece.originalRotation.z + spin * (index % 2 === 0 ? -1 : 1)
         );

     });

     // ------------------------------------
     // C. CRYSTAL RISES AND RETURNS
     // ------------------------------------

     const riseAmount = range(p, 0.28, 0.55);
     const returnAmount = range(p, 0.65, 0.85);

     crystal.position.y = 0.55 +
         2.4 * riseAmount * (1 - returnAmount);

     // Spin the crystal as the box breaks apart.
     crystal.rotation.y = p * Math.PI * 6;
     crystal.rotation.x = p * Math.PI * 2;


    // ------------------------------------
    // D. KEEP THE BOX VISIBLE AT THE END
    // ------------------------------------

    // Keep the box fully visible.
    box.scale.setScalar(1);

    box.traverse((child) => {
        if (child.isMesh) {
            child.material.opacity = 1;
        }
    });

    // Keep the crystal fully visible too.
    crystal.material.opacity = 1;

     // ------------------------------------
     // E. RENDER THE SCENE
     // ------------------------------------

     renderer.render(scene, camera);

 }

 animate();


// ------------------------------------
// 8. HANDLE WINDOW RESIZING
// ------------------------------------

window.addEventListener("resize", function() {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );
});