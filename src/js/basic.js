import GUI from 'lil-gui'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'
import vert from './shaders/img.vert'
import frag from './shaders/img.frag'

// =============================================================================
// Base
// =============================================================================

// Debug
const debugObject = {}
const gui = new GUI({
  width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// =============================================================================
// Loaders
// =============================================================================

// Texture Loader
const textureLoader = new THREE.TextureLoader()

// Draco Loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF Loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// =============================================================================
// Textures
// =============================================================================
const textures = {
  img1: textureLoader.load('https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg'),
  img2: textureLoader.load('https://images.pexels.com/photos/31979794/pexels-photo-31979794.jpeg'),
  img3: textureLoader.load('https://images.pexels.com/photos/18263146/pexels-photo-18263146.jpeg'),
  disp: textureLoader.load('/displacement-textures/disp1.jpg')
};

// textures.img1.colorSpace = THREE.SRGBColorSpace
// textures.img2.colorSpace = THREE.SRGBColorSpace
// textures.img3.colorSpace = THREE.SRGBColorSpace

// =============================================================================
// Object
// =============================================================================
const aspectRatio = 16 / 9;
const geometry = new THREE.PlaneGeometry(4, 4 / aspectRatio)
// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const material = new THREE.ShaderMaterial({
  uniforms: {
    progress: { type: 'f', value: 0.0 },
    intensity: { type: 'f', value: 1.0 },
    texture1: { type: 't', value: textures.img1 },
    texture2: { type: 't', value: textures.img2 },
    texture3: { type: 't', value: textures.img3 },
    dispMap: { type: 't', value: textures.disp }
  },
  vertexShader: vert,
  fragmentShader: frag
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// =============================================================================
// Sizes
// =============================================================================

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// =============================================================================
// Camera
// =============================================================================

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.z = 2
camera.lookAt(mesh.position)

scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

// =============================================================================
// Renderer
// =============================================================================

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = '#000000'
renderer.setClearColor(debugObject.clearColor)
gui
  .addColor(debugObject, 'clearColor')
  .onChange(() => {
    renderer.setClearColor(debugObject.clearColor)
  })

// =============================================================================
// Raycaster
// =============================================================================

// Update the mesh's world matrix to ensure accurate raycasting
// This is necessary because the mesh might have been transformed (position, rotation, scale)
// and we need the current world coordinates for proper intersection detection
// mesh.updateMatrixWorld()

// Create a raycaster instance
// Raycaster is used to cast rays from a point in 3D space and detect intersections with objects
const raycaster = new THREE.Raycaster()

// Set up initial ray origin and direction for testing purposes
// These values are not used in the final implementation but show the concept
const rayOrigin = new THREE.Vector3(-3, 0, 0)      // Start point of the ray (left side of screen)
const rayDirection = new THREE.Vector3(10, 0, 0)    // Direction vector (pointing right)
rayDirection.normalize()                             // Normalize to unit length (length = 1)

// Set the raycaster with the initial ray parameters
// This is just for demonstration - the actual raycasting happens in the animation loop
raycaster.set(rayOrigin, rayDirection)

// =============================================================================
// Mouse
// =============================================================================

// Create a 2D vector to store mouse coordinates
// Values are normalized to range [-1, 1] where:
// x: -1 = left edge, 0 = center, 1 = right edge
// y: -1 = bottom edge, 0 = center, 1 = top edge
const mouse = new THREE.Vector2(-1000, -1000)

// Update mouse position when mouse moves
window.addEventListener('mousemove', (e) => {
  // Convert screen coordinates to normalized device coordinates
  // clientX/Y gives pixel coordinates, we convert to [-1, 1] range
  mouse.x = e.clientX / sizes.width * 2 - 1
  mouse.y = - (e.clientY / sizes.height * 2 - 1)  // Negative because screen Y is inverted
})

// Reset mouse position when mouse leaves the window
// This prevents the hover effect from staying active when mouse is outside
window.addEventListener("mouseout", (e) => {
  mouse.x = -1000
  mouse.y = -1000
})


// =============================================================================
// Animate
// =============================================================================
const clock = new THREE.Clock()

// Track the current intersection state to detect enter/exit events
let currentIntersect = null

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Cast a ray from the camera through the mouse position
  // This creates a ray that goes from the camera position through the mouse cursor
  // The raycaster will detect any objects this ray intersects with
  raycaster.setFromCamera(mouse, camera)

  // Check for intersections between the ray and our mesh
  // Returns an array of intersection objects, sorted by distance (closest first)
  const intersects = raycaster.intersectObjects([mesh])

  // Check if we're hovering over the mesh
  if (intersects.length > 0) {
    // Mouse just entered the mesh (hover started)
    if (currentIntersect === null) {
      // Animate the progress uniform from 0 to 1 over 0.5 seconds
      // This triggers the shader transition effect
      gsap.to(mesh.material.uniforms.progress, {
        value: 1,
        duration: 0.5,
        ease: "power2.out"
      })
    }
    // Store the current intersection for next frame comparison
    currentIntersect = intersects[0]
  } else {
    // Mouse just left the mesh (hover ended)
    if (currentIntersect !== null) {
      // Animate the progress uniform back to 0 over 0.5 seconds
      // This reverses the shader transition effect
      gsap.to(mesh.material.uniforms.progress, {
        value: 0,
        duration: 0.5,
        ease: "power2.out"
      })
    }
    // Clear the intersection state
    currentIntersect = null
  }

  // Update controls
  // controls.update()

  // Renderer
  renderer.render(scene, camera)

  // Call tick again on next frame
  window.requestAnimationFrame(tick)
}

tick()