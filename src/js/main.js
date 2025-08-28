import * as THREE from 'three'
import gsap from 'gsap'
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'

class Slider {
  constructor() {
    this.bindAll()
    
    this.vert = vertex
    this.frag = fragment
    
    this.el = document.querySelector('.js-slider')
    this.inner = this.el.querySelector('.js-slider__inner')
    this.slides = [...this.el.querySelectorAll('.js-slide')]
    this.bullets = [...this.el.querySelectorAll('.js-slider-bullet')]
    
    this.renderer = null
    this.scene = null
    this.clock = null
    this.camera = null
    
    this.images = [
      'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg',
      'https://images.pexels.com/photos/31979794/pexels-photo-31979794.jpeg',
      'https://images.pexels.com/photos/18263146/pexels-photo-18263146.jpeg'
    ]
    
    this.data = {
      current: 0,
      total: this.images.length - 1
    }
    
    this.state = {
      animating: false,
      text: false,
      initial: true
    }
    
    this.textures = null
    
    this.init()
  }
  
  bindAll() {
    this.render = this.render.bind(this)
    this.nextSlide = this.nextSlide.bind(this)
    this.handleResize = this.handleResize.bind(this)
  }
  
  setStyles() {
    this.slides.forEach((slide, index) => {
      if (index === 0) return
      
      gsap.set(slide, { autoAlpha: 0 })
    })
    
    this.bullets.forEach((bullet, index) => {
      if (index === 0) return
      
      const txt = bullet.querySelector('.js-slider-bullet__text')
      const line = bullet.querySelector('.js-slider-bullet__line')
      
      gsap.set(txt, {
        alpha: 0.25
      })
      gsap.set(line, {
        scaleX: 0,
        transformOrigin: 'right'
      })
    })
  }
  
  cameraSetup() {
    this.camera = new THREE.OrthographicCamera(
      this.el.offsetWidth / -2,
      this.el.offsetWidth / 2,
      this.el.offsetHeight / 2,
      this.el.offsetHeight / -2,
      1,
      1000
    )

    this.camera.lookAt(this.scene.position)
    this.camera.position.z = 1
  }

  setup() {
    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock(true)
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)
    
    this.inner.appendChild(this.renderer.domElement)
  }
  
  loadTextures() {
    const loader = new THREE.TextureLoader()
    
    this.textures = []
    this.images.forEach((image, index) => {
      const texture = loader.load(
        image, 
        this.render,
        undefined,
        (error) => console.error('Error loading texture:', error)
      )
      
      texture.minFilter = THREE.LinearFilter
      texture.generateMipmaps = false
      
      if (index === 0 && this.mat) {
        this.mat.uniforms.size.value = [
          texture.image.naturalWidth,
          texture.image.naturalHeight
        ]
      }

      this.textures.push(texture)
    })
    
    this.disp = loader.load(
      '/displacement-textures/disp1.jpg', 
      this.render,
      undefined,
      (error) => console.error('Error loading displacement texture:', error)
    )
    this.disp.magFilter = this.disp.minFilter = THREE.LinearFilter
    this.disp.wrapS = this.disp.wrapT = THREE.RepeatWrapping
  }
  
  createMesh() {
    this.mat = new THREE.ShaderMaterial( {
      uniforms: {
        dispPower: { type: 'f', value: 0.0 },
        intensity: { type: 'f', value: 1.0 },
        res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        size: { value: new THREE.Vector2(1, 1) },
        texture1: { type: 't', value: this.textures[0] },
        texture2: { type: 't', value: this.textures[1] },
        disp: { type: 't', value: this.disp }
      },
      transparent: true,
      vertexShader: this.vert,
      fragmentShader: this.frag
    })

    const geometry = new THREE.PlaneGeometry(
      this.el.offsetWidth, 
      this.el.offsetHeight, 
      1
    )
    
    const mesh = new THREE.Mesh(geometry, this.mat)

    this.scene.add(mesh)    
  }
  
  getNextIndex() {
    return this.data.current === this.data.total ? 0 : this.data.current + 1
  }
  
  getPrevIndex() {
    return this.data.current === 0 ? this.data.total : this.data.current - 1
  }
  
  setTextures(currentIndex, targetIndex) {
    this.mat.uniforms.texture1.value = this.textures[currentIndex]
    this.mat.uniforms.texture2.value = this.textures[targetIndex]
  }
  
  transitionNext() {
    const nextIndex = this.getNextIndex()
    
    // Set textures before transition starts
    this.setTextures(this.data.current, nextIndex)
    
    // Get DOM elements for animation
    const current = this.slides[this.data.current]
    const next = this.slides[nextIndex]
    
    const currentImages = current.querySelectorAll('.js-slide__img')
    const nextImages = next.querySelectorAll('.js-slide__img')
    
    const currentText = current.querySelectorAll('.js-slider__text-line div')
    const nextText = next.querySelectorAll('.js-slider__text-line div')
    
    const currentBullet = this.bullets[this.data.current]
    const nextBullet = this.bullets[nextIndex]
    
    const currentBulletTxt = currentBullet.querySelectorAll('.js-slider-bullet__text')
    const nextBulletTxt = nextBullet.querySelectorAll('.js-slider-bullet__text')
    
    const currentBulletLine = currentBullet.querySelectorAll('.js-slider-bullet__line')
    const nextBulletLine = nextBullet.querySelectorAll('.js-slider-bullet__line')
    
    // Start the displacement transition
    gsap.to(this.mat.uniforms.dispPower, {
      duration: 2.5,
      value: 1,
      ease: 'expo.inOut',
      onUpdate: this.render,
      onComplete: () => {
        this.mat.uniforms.dispPower.value = 0.0
        this.data.current = nextIndex
        this.state.animating = false
      }
    })
    
    // Create and play the GSAP timeline for DOM animations
    const tl = gsap.timeline({ paused: true })
    
    if (this.state.initial) {
      gsap.to('.js-scroll', {
        duration: 1.5,
        yPercent: 100,
        alpha: 0,
        ease: 'power4.inOut'
      })
      this.state.initial = false
    }
    
    tl
      .fromTo(currentImages, {
        yPercent: 0,
        scale: 1
      }, {
        duration: 1.5,
        yPercent: -185,
        scaleY: 1.5,
        ease: 'expo.inOut',
        stagger: 0.075
      }, 0.075)
      .to(currentBulletTxt, {
        duration: 1.5,
        alpha: 0.25,
        ease: 'linear.none'
      }, 0)
      .set(currentBulletLine, {
        transformOrigin: 'right'
      }, 0)
      .to(currentBulletLine, {
        duration: 1.5,
        scaleX: 0,
        ease: 'expo.inOut'
      }, 0)
    
    if (currentText) {
      tl
        .fromTo(currentText, {
          yPercent: 0
        }, {
          duration: 2,
          yPercent: -100,
          ease: 'power4.inOut'
        }, 0)  
    }
    
    tl
      .set(current, {
        autoAlpha: 0
      })
      .set(next, {
        autoAlpha: 1
      }, 1)
    
    if (nextText) {
      tl
        .fromTo(nextText, {
          yPercent: 100
        }, {
          duration: 2,
          yPercent: 0,
          ease: 'power4.out'
        }, 1.5)  
      }
    
    tl
      .fromTo(nextImages, {
        yPercent: 150,
        scaleY: 1.5
      }, {
        duration: 1.5,
        yPercent: 0,
        scaleY: 1,
        ease: 'expo.inOut',
        stagger: 0.075
      }, 0.075, 1)
      .to(nextBulletTxt, {
        duration: 1.5,
        alpha: 1,
        ease: 'linear.none'
      }, 1)
      .set(nextBulletLine, {
        transformOrigin: 'right'
      }, 1)
      .to(nextBulletLine, {
        duration: 1.5,
        scaleX: 1,
        ease: 'expo.inOut'
      }, 1)
    
    tl.play()
  }
  
  transitionPrev() {
    const prevIndex = this.getPrevIndex()
    
    // Set textures before transition starts
    this.setTextures(this.data.current, prevIndex)
    
    // Get DOM elements for animation
    const current = this.slides[this.data.current]
    const prev = this.slides[prevIndex]
    
    const currentImages = current.querySelectorAll('.js-slide__img')
    const prevImages = prev.querySelectorAll('.js-slide__img')
    
    const currentText = current.querySelectorAll('.js-slider__text-line div')
    const prevText = prev.querySelectorAll('.js-slider__text-line div')
    
    const currentBullet = this.bullets[this.data.current]
    const prevBullet = this.bullets[prevIndex]
    
    const currentBulletTxt = currentBullet.querySelectorAll('.js-slider-bullet__text')
    const prevBulletTxt = prevBullet.querySelectorAll('.js-slider-bullet__text')
    
    const currentBulletLine = currentBullet.querySelectorAll('.js-slider-bullet__line')
    const prevBulletLine = prevBullet.querySelectorAll('.js-slider-bullet__line')
    
    // Start the displacement transition
    gsap.to(this.mat.uniforms.dispPower, {
      duration: 2.5,
      value: 1,
      ease: 'expo.inOut',
      onUpdate: this.render,
      onComplete: () => {
        this.mat.uniforms.dispPower.value = 0.0
        this.data.current = prevIndex
        this.state.animating = false
      }
    })
    
    // Create and play the GSAP timeline for DOM animations
    const tl = gsap.timeline({ paused: true })
    
    if (this.state.initial) {
      gsap.to('.js-scroll', {
        duration: 1.5,
        yPercent: 100,
        alpha: 0,
        ease: 'power4.inOut'
      })
      this.state.initial = false
    }
    
    tl
      .fromTo(currentImages, {
        yPercent: 0,
        scale: 1
      }, {
        duration: 1.5,
        yPercent: 185,
        scaleY: 1.5,
        ease: 'expo.inOut',
        stagger: 0.075
      }, 0.075)
      .to(currentBulletTxt, {
        duration: 1.5,
        alpha: 0.25,
        ease: 'linear.none'
      }, 0)
      .set(currentBulletLine, {
        transformOrigin: 'right'
      }, 0)
      .to(currentBulletLine, {
        duration: 1.5,
        scaleX: 0,
        ease: 'expo.inOut'
      }, 0)
    
    if (currentText) {
      tl
        .fromTo(currentText, {
          yPercent: 0
        }, {
          duration: 2,
          yPercent: -100,
          ease: 'power4.inOut'
        }, 0)  
    }
    
    tl
      .set(current, {
        autoAlpha: 0
      })
      .set(prev, {
        autoAlpha: 1
      }, 1)
    
    if (prevText && prevText.length > 0) {
      tl
        .fromTo(prevText, {
          yPercent: 100
        }, {
          duration: 2,
          yPercent: 0,
          ease: 'power4.out'
        }, 1.5)  
      }
    
    tl
      .fromTo(prevImages, {
        yPercent: -150,
        scaleY: 1.5
      }, {
        duration: 1.5,
        yPercent: 0,
        scaleY: 1,
        ease: 'expo.inOut',
        stagger: 0.075
      }, 0.075, 1)
      .to(prevBulletTxt, {
        duration: 1.5,
        alpha: 1,
        ease: 'linear.none'
      }, 1)
      .set(prevBulletLine, {
        transformOrigin: 'right'
      }, 1)
      .to(prevBulletLine, {
        duration: 1.5,
        scaleX: 1,
        ease: 'expo.inOut'
      }, 1)
    
    tl.play()
  }
  
  prevSlide() {
    if (this.state.animating) return
    this.state.animating = true
    this.transitionPrev()
  }
  
  nextSlide() {
    if (this.state.animating) return
    this.state.animating = true
    this.transitionNext()
  }
 
  listeners() {
    window.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        this.nextSlide()
      } else {
        this.prevSlide()
      }
    }, { passive: true })
  }
  
  render() {
    this.renderer.render(this.scene, this.camera)
    console.log(this.mat.uniforms.dispPower.value)
  }
  
  handleResize() {
    // Update renderer size
    this.renderer.setSize(this.el.offsetWidth, this.el.offsetHeight)
    
    // Update camera frustum for orthographic camera
    this.camera.left = this.el.offsetWidth / -2
    this.camera.right = this.el.offsetWidth / 2
    this.camera.top = this.el.offsetHeight / 2
    this.camera.bottom = this.el.offsetHeight / -2
    
    // Update camera projection matrix
    this.camera.updateProjectionMatrix()
    
    // Update resolution uniform for shader
    this.mat.uniforms.res.value.set(window.innerWidth, window.innerHeight)
    
    // Ensure shader textures are synchronized with current slide
    if (this.textures && this.textures.length > 0) {
      const currentIndex = this.data.current
      const nextIndex = this.getNextIndex()
      
      // Set the correct textures based on current state
      this.mat.uniforms.texture1.value = this.textures[currentIndex]
      this.mat.uniforms.texture2.value = this.textures[nextIndex]
      
      // Reset displacement power to current state (not animating)
      if (!this.state.animating) {
        this.mat.uniforms.dispPower.value = 0.0
      }
    }
    
    // Re-render the scene
    this.render()
  }
  
  init() {
    this.setup()
    this.cameraSetup()
    this.loadTextures()
    this.createMesh()
    this.setStyles()
    this.render()
    this.listeners()

    window.addEventListener('resize', () => {
      this.handleResize()
    })
  }
}

// Toggle active link
const links = document.querySelectorAll('.js-nav a')

links.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    links.forEach(other => other.classList.remove('is-active'))
    link.classList.add('is-active')
  })
})

// Init classes
const slider = new Slider()