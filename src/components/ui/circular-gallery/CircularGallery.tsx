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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTextTexture(gl: any, text: string, font = "bold 30px monospace", color = "black") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
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
  context.fillStyle = "#ffffff";
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

  constructor({ gl, plane, renderer, text, textColor = "#545050", font = "30px sans-serif" }: {
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
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.15;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }

  setVisibility(visible: boolean) {
    if (this.mesh) {
      this.mesh.visible = visible;
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
  private padding: number = 2;
  public width: number = 0;
  private widthTotal: number = 0;
  private x: number = 0;
  private isBefore: boolean = false;
  private isAfter: boolean = false;
  private onItemClick?: (item: GalleryItem, index: number) => void;

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
    borderRadius = 0,
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
    // Defensive initialization with fallbacks
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
    this.textColor = textColor || '#ffffff';
    this.borderRadius = borderRadius || 0;
    this.font = font || 'bold 30px Figtree';
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
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
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
          
          gl_FragColor = vec4(color.rgb, 1.0);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });

    // Try to load the PNG image with fallback to white placeholder
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

    // Convert to PNG extension if needed
    const imageUrl = this.image.includes('.png') ? this.image : `${this.image.replace(/\.[^/.]+$/, "")}.png`;
    img.src = imageUrl;
    
    // Set initial fallback
    setTimeout(() => {
      if (!img.complete) {
        loadFallback();
      }
    }, 5000); // 5 second timeout
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.scale.set(this.scale, this.scale, 1);
    this.scene.addChild(this.plane);
    
    // Add hover event listeners for category text display
    if (this.gl.canvas) {
      this.gl.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
      this.gl.canvas.addEventListener('mouseout', this.onMouseOut.bind(this));
    }

    // Add click detection
    if (this.onItemClick) {
      this.plane.userData = {
        item: { image: this.image, text: this.text },
        index: this.index,
        onClick: this.onItemClick
      };
    }
  }

  onMouseMove(e: MouseEvent) {
    // Simple hover detection - show text when hovering over the item
    const rect = this.gl.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Check if mouse is over this media item (simplified hit detection)
    const itemX = this.x / this.screen.width * 2;
    const itemWidth = this.width / this.screen.width * 2;
    
    if (Math.abs(x - itemX) < itemWidth / 2) {
      // Mouse is over this item - show text
      this.title.setVisibility(true);
    } else {
      // Mouse is not over this item - hide text
      this.title.setVisibility(false);
    }
  }

  onMouseOut() {
    // Hide text when mouse leaves canvas
    this.title.setVisibility(false);
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

  update(scroll: any, direction: string) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

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

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
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
    
    // Defensive checks to prevent TypeError
    if (!this.screen?.height || !this.viewport?.height || !this.viewport?.width) {
      console.warn('CircularGallery: Missing screen or viewport dimensions');
      return;
    }
    
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    
    if (this.plane?.program?.uniforms?.uPlaneSizes) {
      this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    }
    
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class App {
  private container: HTMLElement;
  private scroll = { ease: 0.05, current: 0, target: 0, last: 0, position: 0 };
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
  private boundOnMouseEnter: () => void;
  private boundOnMouseLeave: () => void;
  private onItemClick?: (item: GalleryItem, index: number) => void;
  private startTime: number | null = null;
  private hasMoved = false;
  
  // Auto-rotation properties
  private autoRotationSpeed = 0.003; // Very slow continuous rotation
  private isHovered = false; // Track if mouse is over gallery
  private autoRotationEnabled = true; // Can be disabled during interactions

  constructor(container: HTMLElement, { items, bend, textColor = "#ffffff", borderRadius = 0, font = "bold 30px Figtree", onItemClick }: {
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
    this.onCheckDebounce = debounce(this.onCheck, 300);
    
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
    this.renderer = new Renderer({ alpha: true });
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
      heightSegments: 50,
      widthSegments: 100
    });
  }

  createMedias(items?: GalleryItem[], bend = 1, textColor?: string, borderRadius?: number, font?: string) {
    // Only use items passed via props - no fallback to default placeholder images
    if (!items || items.length === 0) {
      console.warn('No gallery items provided to CircularGallery');
      return;
    }
    
    const galleryItems = items;
    this.mediasImages = galleryItems.concat(galleryItems); // Duplicate for seamless loop
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
        bend: bend || 1,
        textColor: textColor || "#ffffff",
        borderRadius: borderRadius || 0,
        font: font || "bold 30px Figtree",
        onItemClick: this.onItemClick
      })
    })
  }

  onTouchDown(e: any) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
    this.startTime = Date.now();
    this.hasMoved = false; // Reset hasMoved for each new touch/click
    this.autoRotationEnabled = false; // Disable auto-rotation during interaction
  }

  onTouchMove(e: any) {
    if (!this.isDown) return
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const distance = (this.start - x) * 0.03 // Reduced sensitivity for smoother movement
    this.scroll.target = this.scroll.position + distance
    this.hasMoved = Math.abs(this.start - x) > 3 // Reduced threshold from 5 to 3 pixels for more precise click detection
  }

  onTouchUp() {
    this.isDown = false
    this.autoRotationEnabled = true; // Re-enable auto-rotation after interaction
    const endTime = Date.now()
    const clickDuration = endTime - (this.startTime || 0)
    
    // Only trigger click if it was quick and minimal movement
    if (!this.hasMoved && clickDuration < 250) {
      // Improved click detection - find the closest item to center
      if (this.medias && this.medias[0]) {
        const containerCenter = this.container.clientWidth / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        // Find the media closest to the center of the screen
        this.medias.forEach((media, index) => {
          if (index < this.mediasImages.length / 2) { // Only check original items, not duplicates
            // Calculate the distance from media center to screen center
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
    
    this.onCheck()
    this.hasMoved = false
  }

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }

  onWheel() {
    this.scroll.target += 0.2;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    // Defensive checks to prevent errors
    if (!this.container) {
      console.warn('CircularGallery: Container not available for resize');
      return;
    }
    
    this.screen = {
      width: this.container.clientWidth || 800,
      height: this.container.clientHeight || 600
    };
    
    if (!this.renderer) {
      console.warn('CircularGallery: Renderer not available for resize');
      return;
    }
    
    this.renderer.setSize(this.screen.width, this.screen.height);
    
    if (!this.camera) {
      console.warn('CircularGallery: Camera not available for resize');
      return;
    }
    
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    
    // Only call media resize if medias exist and are properly initialized
    if (this.medias && Array.isArray(this.medias) && this.medias.length > 0) {
      this.medias.forEach((media) => {
        if (media && typeof media.onResize === 'function') {
          media.onResize({ screen: this.screen, viewport: this.viewport });
        }
      });
    }
  }

  update() {
    // Auto-rotation: only when not hovered, not interacting, and enabled
    if (this.autoRotationEnabled && !this.isHovered && !this.isDown) {
      this.scroll.target += this.autoRotationSpeed;
    }

    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease
    );
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction));
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
    this.boundOnMouseEnter = this.onMouseEnter.bind(this);
    this.boundOnMouseLeave = this.onMouseLeave.bind(this);
    
    // Only resize needs to be on window
    window.addEventListener('resize', this.boundOnResize);
    
    // All interactive events should be on canvas only to prevent global interference
    this.gl.canvas.addEventListener('wheel', this.boundOnWheel);
    this.gl.canvas.addEventListener('mousedown', this.boundOnTouchDown);
    this.gl.canvas.addEventListener('mousemove', this.boundOnTouchMove);
    this.gl.canvas.addEventListener('mouseup', this.boundOnTouchUp);
    this.gl.canvas.addEventListener('mouseenter', this.boundOnMouseEnter);
    this.gl.canvas.addEventListener('mouseleave', this.boundOnMouseLeave);
    this.gl.canvas.addEventListener('touchstart', this.boundOnTouchDown);
    this.gl.canvas.addEventListener('touchmove', this.boundOnTouchMove);
    this.gl.canvas.addEventListener('touchend', this.boundOnTouchUp);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    
    // Remove window listeners
    window.removeEventListener('resize', this.boundOnResize);
    
    // Remove canvas listeners
    this.gl.canvas.removeEventListener('wheel', this.boundOnWheel);
    this.gl.canvas.removeEventListener('mousedown', this.boundOnTouchDown);
    this.gl.canvas.removeEventListener('mousemove', this.boundOnTouchMove);
    this.gl.canvas.removeEventListener('mouseup', this.boundOnTouchUp);
    this.gl.canvas.removeEventListener('mouseenter', this.boundOnMouseEnter);
    this.gl.canvas.removeEventListener('mouseleave', this.boundOnMouseLeave);
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
  textColor = "#ffffff",
  borderRadius = 0.05,
  font = "bold 30px Figtree",
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
      className='w-full h-full overflow-hidden cursor-grab active:cursor-grabbing' 
      ref={containerRef} 
    />
  );
}

export type { GalleryItem, CircularGalleryProps };
 