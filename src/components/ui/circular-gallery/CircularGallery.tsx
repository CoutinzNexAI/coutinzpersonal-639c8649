/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect } from 'react';
import {
  Renderer,
  Camera,
  Transform,
  Plane,
  Mesh,
  Program,
  Texture,
} from 'ogl';

interface GalleryItem {
  image: string;
  text: string;
}

interface CircularGalleryProps {
  items?: GalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  onItemClick?: (item: GalleryItem, index: number) => void;
}

function debounce(func: (...args: unknown[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (...args: unknown[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number) {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: object) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== 'constructor' && typeof (instance as any)[key] === 'function') {
      (instance as any)[key] = (instance as any)[key].bind(instance);
    }
  });
}

function createTextTexture(gl: any, text: string, font = "bold 32px Inter", color = "#2D5A27") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.4);
  canvas.width = textWidth + 40;
  canvas.height = textHeight + 40;
  
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Add subtle shadow for better readability
  context.shadowColor = 'rgba(0,0,0,0.3)';
  context.shadowBlur = 4;
  context.shadowOffsetY = 2;
  
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

function createWhitePlaceholder(gl: any) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#f3f4f6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return texture;
}

class Title {
  private gl: any;
  private plane: any;
  private renderer: any;
  private text: string;
  private textColor: string;
  private font: string;
  public mesh: any;

  constructor({ gl, plane, renderer, text, textColor = "#2D5A27", font = "bold 32px Inter" }: {
    gl: any;
    plane: any;
    renderer: any;
    text: string;
    textColor?: string;
    font?: string;
  }) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(
      this.gl,
      this.text,
      this.font,
      this.textColor
    );
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uAlpha;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          vUv = uv;
          vAlpha = uAlpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        varying float vAlpha;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = vec4(color.rgb, color.a * vAlpha);
        }
      `,
      uniforms: { 
        tMap: { value: texture },
        uAlpha: { value: 0.0 }
      },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.2;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.6 - textHeight * 0.3;
    this.mesh.setParent(this.plane);
  }

  setVisibility(visible: boolean, opacity: number = 1.0) {
    if (this.mesh && this.mesh.program) {
      this.mesh.program.uniforms.uAlpha.value = visible ? opacity : 0.0;
    }
  }
}

class Media {
  private extra: number = 0;
  private geometry: any;
  private gl: any;
  private image: string;
  private index: number;
  private length: number;
  private renderer: any;
  private scene: any;
  private screen: any;
  private text: string;
  private viewport: any;
  private bend: number;
  private textColor: string;
  private borderRadius: number;
  private font: string;
  private program: any;
  public plane: any;
  private title: Title;
  private speed: number = 0;
  private scale: number = 1;
  private padding: number = 2.5;
  public width: number = 0;
  private widthTotal: number = 0;
  private x: number = 0;
  private onItemClick?: (item: GalleryItem, index: number) => void;
  private distanceFromCenter: number = 0;
  private isSpotlight: boolean = false;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0.1,
    font,
    onItemClick
  }: {
    geometry: any;
    gl: any;
    image: string;
    index: number;
    length: number;
    renderer: any;
    scene: any;
    screen: any;
    text: string;
    viewport: any;
    bend: number;
    textColor: string;
    borderRadius?: number;
    font: string;
    onItemClick?: (item: GalleryItem, index: number) => void;
  }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image || '/placeholder.svg';
    this.index = index || 0;
    this.length = length || 1;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen || { width: 800, height: 600 };
    this.text = text || 'Item';
    this.viewport = viewport || { width: 800, height: 600 };
    this.bend = bend || 1;
    this.textColor = textColor || '#2D5A27';
    this.borderRadius = borderRadius || 0.1;
    this.font = font || 'bold 32px Inter';
    this.onItemClick = onItemClick;
    
    try {
      this.createShader();
      this.createMesh();
      this.createTitle();
      this.onResize();
    } catch (error) {
      console.error('Error initializing Media:', error);
    }
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: false });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uSpotlight;
        varying vec2 vUv;
        varying float vSpotlight;
        void main() {
          vUv = uv;
          vSpotlight = uSpotlight;
          vec3 p = position;
          
          // Subtle wave effect on non-spotlight items
          float waveIntensity = (1.0 - uSpotlight) * 0.05;
          p.z = (sin(p.x * 3.0 + uTime) * 0.8 + cos(p.y * 2.0 + uTime) * 0.8) * waveIntensity;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uSpotlight;
        varying vec2 vUv;
        varying float vSpotlight;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          if(d > 0.0) {
            discard;
          }
          
          // Add glow effect for spotlight
          float glow = vSpotlight * 0.3;
          vec3 finalColor = color.rgb + vec3(glow);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
        uSpotlight: { value: 0.0 }
      },
      transparent: true
    });

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    const loadFallback = () => {
      const fallbackTexture = createWhitePlaceholder(this.gl);
      this.program.uniforms.tMap.value = fallbackTexture;
      this.program.uniforms.uImageSizes.value = [800, 600];
    };

    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };

    img.onerror = () => {
      console.warn(`Failed to load image: ${this.image}, using fallback`);
      loadFallback();
    };

    // Try SVG first, then PNG fallback
    const imageUrl = this.image.includes('.svg') ? this.image : 
                    this.image.includes('.png') ? this.image : 
                    `${this.image.replace(/\.[^/.]+$/, "")}.svg`;
    img.src = imageUrl;
    
    setTimeout(() => {
      if (!img.complete) {
        loadFallback();
      }
    }, 3000);
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    const baseScale = 10.0; // Usar a mesma escala base grande desde o início
    this.plane.scale.set(baseScale, baseScale, 1);
    this.scene.addChild(this.plane);

    if (this.onItemClick) {
      this.plane.userData = {
        item: { image: this.image, text: this.text },
        index: this.index,
        onClick: this.onItemClick
      };
    }
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font
    });
  }

  update(scroll: any) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    // Calculate distance from center for spotlight effect
    this.distanceFromCenter = Math.abs(x);
    const maxDistance = this.width * 2.0; // Aumentar área de detecção para imagens grandes
    const proximityToCenter = Math.max(0, 1 - (this.distanceFromCenter / maxDistance));
    this.isSpotlight = proximityToCenter > 0.2; // Tornar mais fácil ativar spotlight

    // Enhanced curved positioning
    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    // MANTÉM TODAS AS IMAGENS SEMPRE GRANDES - spotlight só adiciona brilho
    const baseScale = 10.0; // 10x maior que antes!
    const targetScale = this.isSpotlight ? baseScale * 1.2 : baseScale; // Spotlight só 20% maior
    this.plane.scale.x = lerp(this.plane.scale.x, targetScale, 0.1);
    this.plane.scale.y = lerp(this.plane.scale.y, targetScale, 0.1);

    // Update shader uniforms
    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.02;
    this.program.uniforms.uSpeed.value = this.speed;
    this.program.uniforms.uSpotlight.value = this.isSpotlight ? 1.0 : 0.0;

    // Show title for spotlight item
    this.title.setVisibility(this.isSpotlight, proximityToCenter);

    // Infinite loop logic - only to the right
    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    const isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    
    if (isBefore) {
      this.extra -= this.widthTotal;
    }
  }

  onResize({ screen, viewport }: { screen?: any; viewport?: any } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane?.program?.uniforms?.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    
    if (!this.screen?.height || !this.viewport?.height || !this.viewport?.width) {
      console.warn('CircularGallery: Missing screen or viewport dimensions');
      return;
    }
    
    // Better mobile scaling - MASSIVELY INCREASED SIZES
    const isMobile = this.screen.width < 768;
    this.scale = isMobile ? this.screen.height / 200 : this.screen.height / 250; // MUITO mais alto!
    
    this.plane.scale.y = (this.viewport.height * (isMobile ? 8000 : 7000) * this.scale) / this.screen.height; // 5x maior!
    this.plane.scale.x = (this.viewport.width * (isMobile ? 6000 : 5500) * this.scale) / this.screen.width; // 5x maior!
    
    if (this.plane?.program?.uniforms?.uPlaneSizes) {
      this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    }
    
    this.padding = isMobile ? 20 : 18; // Aumentar muito o padding para imagens grandes
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  private container: HTMLElement;
  private scroll = { ease: 0.08, current: 0, target: 0, last: 0, position: 0 };
  private onCheckDebounce: (...args: any[]) => void;
  private renderer: any;
  private gl: any;
  private camera: any;
  private scene: any;
  private screen: any;
  private viewport: any;
  private planeGeometry: any;
  private mediasImages: GalleryItem[] = [];
  private medias: Media[] = [];
  private isDown = false;
  private start = 0;
  private raf: number = 0;
  private boundOnResize: () => void;
  private boundOnWheel: () => void;
  private boundOnTouchDown: (e: any) => void;
  private boundOnTouchMove: (e: any) => void;
  private boundOnTouchUp: () => void;
  private onItemClick?: (item: GalleryItem, index: number) => void;
  private startTime: number | null = null;
  private hasMoved = false;
  private momentum = 0;
  
  // Enhanced auto-rotation - FASTER for bigger images
  private autoRotationSpeed = 0.08; // 5x mais rápido que antes!
  private isHovered = false;
  private autoRotationEnabled = true;

  constructor(container: HTMLElement, { items, bend, textColor = "#2D5A27", borderRadius = 0.1, font = "bold 32px Inter", onItemClick }: {
    items?: GalleryItem[];
    bend?: number;
    textColor?: string;
    borderRadius?: number;
    font?: string;
    onItemClick?: (item: GalleryItem, index: number) => void;
  } = {}) {
    autoBind(this);
    this.container = container;
    this.onItemClick = onItemClick;
    this.onCheckDebounce = debounce(this.onCheck, 200);
    
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.onResize();
    this.addEventListeners();
    this.update();
  }

  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 30,
      widthSegments: 60
    });
  }

  createMedias(items?: GalleryItem[], bend = 3, textColor?: string, borderRadius?: number, font?: string) {
    if (!items || items.length === 0) {
      console.warn('No gallery items provided to CircularGallery');
      return;
    }
    
    const galleryItems = items;
    this.mediasImages = galleryItems.concat(galleryItems).concat(galleryItems); // Triple for smoother infinite loop
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend: bend || 3,
        textColor: textColor || "#2D5A27",
        borderRadius: borderRadius || 0.1,
        font: font || "bold 32px Inter",
        onItemClick: this.onItemClick
      })
    })
  }

  onTouchDown(e: any) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
    this.startTime = Date.now();
    this.hasMoved = false;
    this.autoRotationEnabled = false;
    this.momentum = 0;
  }

  onTouchMove(e: any) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * 0.04; // Slightly increased sensitivity
    this.scroll.target = this.scroll.position + distance;
    this.hasMoved = Math.abs(this.start - x) > 2;
    
    // Calculate momentum
    this.momentum = distance * 0.1;
  }

  onTouchUp() {
    this.isDown = false;
    const endTime = Date.now();
    const clickDuration = endTime - (this.startTime || 0);
    
    // Apply momentum effect
    if (this.hasMoved && Math.abs(this.momentum) > 0.01) {
      this.scroll.target += this.momentum * 8; // Momentum boost
    }
    
    this.autoRotationEnabled = true;
    
    // Enhanced click detection
    if (!this.hasMoved && clickDuration < 250) {
      if (this.medias && this.medias[0]) {
        const containerCenter = this.container.clientWidth / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        this.medias.forEach((media, index) => {
          if (index < this.mediasImages.length / 3) { // Only check original items
            const mediaScreenPosition = (media.plane.position.x / this.viewport.width) * this.screen.width + this.screen.width / 2;
            const distance = Math.abs(mediaScreenPosition - containerCenter);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          }
        });
        
        const item = this.mediasImages[closestIndex];
        if (this.onItemClick && item) {
          console.log('🎯 Gallery click detected:', { item, index: closestIndex });
          this.onItemClick(item, closestIndex);
        }
      }
    }
    
    this.onCheck();
    this.hasMoved = false;
    this.momentum = 0;
  }

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }

  onWheel(e: WheelEvent) {
    this.scroll.target += e.deltaY * 0.002;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = Math.max(0, item); // Only allow positive scroll
  }

  onResize() {
    if (!this.container) {
      console.warn('CircularGallery: Container not available for resize');
      return;
    }
    
    this.screen = {
      width: this.container.clientWidth || 800,
      height: this.container.clientHeight || 600
    };
    
    if (!this.renderer) return;
    
    this.renderer.setSize(this.screen.width, this.screen.height);
    
    if (!this.camera) return;
    
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    
    if (this.medias && Array.isArray(this.medias) && this.medias.length > 0) {
      this.medias.forEach((media) => {
        if (media && typeof media.onResize === 'function') {
          media.onResize({ screen: this.screen, viewport: this.viewport });
        }
      });
    }
  }

  update() {
    // Enhanced auto-rotation - only to the right
    if (this.autoRotationEnabled && !this.isHovered && !this.isDown) {
      this.scroll.target += this.autoRotationSpeed;
    }

    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease
    );
    
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    
    window.addEventListener('resize', this.boundOnResize);
    
    this.gl.canvas.addEventListener('wheel', this.boundOnWheel, { passive: false });
    this.gl.canvas.addEventListener('mousedown', this.boundOnTouchDown);
    this.gl.canvas.addEventListener('mousemove', this.boundOnTouchMove);
    this.gl.canvas.addEventListener('mouseup', this.boundOnTouchUp);
    this.gl.canvas.addEventListener('mouseenter', () => this.isHovered = true);
    this.gl.canvas.addEventListener('mouseleave', () => this.isHovered = false);
    this.gl.canvas.addEventListener('touchstart', this.boundOnTouchDown, { passive: false });
    this.gl.canvas.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    this.gl.canvas.addEventListener('touchend', this.boundOnTouchUp);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    
    window.removeEventListener('resize', this.boundOnResize);
    
    this.gl.canvas.removeEventListener('wheel', this.boundOnWheel);
    this.gl.canvas.removeEventListener('mousedown', this.boundOnTouchDown);
    this.gl.canvas.removeEventListener('mousemove', this.boundOnTouchMove);
    this.gl.canvas.removeEventListener('mouseup', this.boundOnTouchUp);
    this.gl.canvas.removeEventListener('touchstart', this.boundOnTouchDown);
    this.gl.canvas.removeEventListener('touchmove', this.boundOnTouchMove);
    this.gl.canvas.removeEventListener('touchend', this.boundOnTouchUp);
    
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

export default function CircularGallery({
  items,
  bend = 3,
  textColor = "#2D5A27",
  borderRadius = 0.1,
  font = "bold 32px Inter",
  onItemClick
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const app = new App(containerRef.current, { 
      items, 
      bend, 
      textColor, 
      borderRadius, 
      font,
      onItemClick 
    });
    
    return () => {
      app.destroy();
    };
  }, [items, bend, textColor, borderRadius, font, onItemClick]);
  
  return (
    <div 
      className='w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none' 
      ref={containerRef} 
    />
  );
}

export type { GalleryItem, CircularGalleryProps };
 