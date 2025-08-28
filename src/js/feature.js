import GUI from 'lil-gui'
import * as THREE from 'three'
import gsap from 'gsap'
import vert from './shaders/feature.vert'
import frag from './shaders/feature.frag'

// =============================================================================
// Base
// =============================================================================

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// =============================================================================
// Loaders
// =============================================================================

// Texture Loader
const textureLoader = new THREE.TextureLoader()

// =============================================================================
// Textures
// =============================================================================
const textures = {
  img1: textureLoader.load('https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg'),
  img2: textureLoader.load('https://images.pexels.com/photos/31979794/pexels-photo-31979794.jpeg'),
  img3: textureLoader.load('https://images.pexels.com/photos/18263146/pexels-photo-18263146.jpeg'),
  disp: textureLoader.load('/displacement-textures/disp1.jpg')
};

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
// Mesh
// =============================================================================
const cameraDistance = 2
const fov = 75
const aspectRatio = sizes.width / sizes.height

const planeHeight = 2 * Math.tan((fov * Math.PI) / 360) * cameraDistance
const planeWidth = planeHeight * aspectRatio

const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
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
// Camera
// =============================================================================

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.z = 2
camera.lookAt(mesh.position)

scene.add(camera)

// =============================================================================
// Renderer
// =============================================================================

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// =============================================================================
// Raycaster
// =============================================================================

const raycaster = new THREE.Raycaster()

const rayOrigin = new THREE.Vector3(-3, 0, 0)
const rayDirection = new THREE.Vector3(10, 0, 0)
rayDirection.normalize()

raycaster.set(rayOrigin, rayDirection)

// =============================================================================
// Mouse
// =============================================================================

const mouse = new THREE.Vector2(-1000, -1000)

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX / sizes.width * 2 - 1
  mouse.y = - (e.clientY / sizes.height * 2 - 1)
})

window.addEventListener("mouseout", (e) => {
  mouse.x = -1000
  mouse.y = -1000
})

// =============================================================================
// Debug GUI
// =============================================================================

const gui = new GUI()

gui.add(material.uniforms.progress, 'value', 0, 1, 0.01).name('displacement progress')
gui.add(material.uniforms.intensity, 'value', 0.1, 5, 0.1).name('displacement intensity')

// =============================================================================
// Animate
// =============================================================================
const clock = new THREE.Clock()

// gsap.to(material.uniforms.progress, {
//   duration: 1,
//   ease: 'expo.inOut',
//   value: 1.0,
//   repeat: -1,
//   yoyo: true,
//   repeatDelay: 1
// })

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  raycaster.setFromCamera(mouse, camera)

  // Renderer
  renderer.render(scene, camera)

  // Call tick again on next frame
  window.requestAnimationFrame(tick)
}

tick()