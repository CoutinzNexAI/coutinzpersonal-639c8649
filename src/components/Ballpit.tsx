
import { useRef, useEffect } from 'react';
import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Vector3,
  MeshPhysicalMaterial,
  ShaderChunk,
  Color,
  Object3D,
  InstancedMesh,
  PMREMGenerator,
  SphereGeometry,
  AmbientLight,
  PointLight,
  ACESFilmicToneMapping,
  Raycaster,
  Plane,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

class ThreeApp {
  private options: any;
  canvas: HTMLCanvasElement;
  camera: PerspectiveCamera;
  cameraMinAspect?: number;
  cameraMaxAspect?: number;
  cameraFov: number;
  maxPixelRatio?: number;
  minPixelRatio?: number;
  scene: Scene;
  renderer: WebGLRenderer;
  private postprocessingInstance?: any;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.renderDefault;
  onBeforeRender = () => { };
  onAfterRender = () => { };
  onAfterResize = () => { };
  private isVisible = false;
  private isAnimating = false;
  isDisposed = false;
  private intersectionObserver?: IntersectionObserver;
  private resizeObserver?: ResizeObserver;
  private resizeTimeout?: number;
  private clock = new Clock();
  private time = { elapsed: 0, delta: 0 };
  private animationId?: number;

  constructor(options: any) {
    this.options = { ...options };
    this.initCamera();
    this.initScene();
    this.initRenderer();
    this.resize();
    this.initEventListeners();
  }

  private initCamera() {
    this.camera = new PerspectiveCamera();
    this.cameraFov = this.camera.fov;
  }

  private initScene() {
    this.scene = new Scene();
  }

  private initRenderer() {
    if (this.options.canvas) {
      this.canvas = this.options.canvas;
    } else if (this.options.id) {
      this.canvas = document.getElementById(this.options.id) as HTMLCanvasElement;
    } else {
      console.error("Three: Missing canvas or id parameter");
      return;
    }
    this.canvas.style.display = "block";
    const rendererOptions = {
      canvas: this.canvas,
      powerPreference: "high-performance",
      ...(this.options.rendererOptions ?? {}),
    };
    this.renderer = new WebGLRenderer(rendererOptions);
    this.renderer.outputColorSpace = SRGBColorSpace;
  }

  private initEventListeners() {
    if (!(this.options.size instanceof Object)) {
      window.addEventListener("resize", this.handleResize.bind(this));
      if (this.options.size === "parent" && this.canvas.parentNode) {
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        this.resizeObserver.observe(this.canvas.parentNode as Element);
      }
    }
    this.intersectionObserver = new IntersectionObserver(this.handleVisibilityChange.bind(this), {
      root: null,
      rootMargin: "0px",
      threshold: 0,
    });
    this.intersectionObserver.observe(this.canvas);
    document.addEventListener("visibilitychange", this.handleDocumentVisibilityChange.bind(this));
  }

  private removeEventListeners() {
    window.removeEventListener("resize", this.handleResize.bind(this));
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this.handleDocumentVisibilityChange.bind(this));
  }

  private handleVisibilityChange(entries: IntersectionObserverEntry[]) {
    this.isVisible = entries[0].isIntersecting;
    this.isVisible ? this.startAnimation() : this.stopAnimation();
  }

  private handleDocumentVisibilityChange() {
    if (this.isVisible) {
      document.hidden ? this.stopAnimation() : this.startAnimation();
    }
  }

  private handleResize() {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(this.resize.bind(this), 100);
  }

  resize() {
    let width: number, height: number;
    if (this.options.size instanceof Object) {
      width = this.options.size.width;
      height = this.options.size.height;
    } else if (this.options.size === "parent" && this.canvas.parentNode) {
      const parent = this.canvas.parentNode as HTMLElement;
      width = parent.offsetWidth;
      height = parent.offsetHeight;
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
    }
    this.size.width = width;
    this.size.height = height;
    this.size.ratio = width / height;
    this.updateCamera();
    this.updateRenderer();
    this.onAfterResize(this.size);
  }

  private updateCamera() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.adjustCameraFov(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.adjustCameraFov(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }

  private adjustCameraFov(targetAspect: number) {
    const ratio = Math.tan(MathUtils.degToRad(this.cameraFov / 2)) / (this.camera.aspect / targetAspect);
    this.camera.fov = 2 * MathUtils.radToDeg(Math.atan(ratio));
  }

  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fov = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fov / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    }
  }

  private updateRenderer() {
    this.renderer.setSize(this.size.width, this.size.height);
    this.postprocessingInstance?.setSize(this.size.width, this.size.height);
    let pixelRatio = window.devicePixelRatio;
    if (this.maxPixelRatio && pixelRatio > this.maxPixelRatio) {
      pixelRatio = this.maxPixelRatio;
    } else if (this.minPixelRatio && pixelRatio < this.minPixelRatio) {
      pixelRatio = this.minPixelRatio;
    }
    this.renderer.setPixelRatio(pixelRatio);
    this.size.pixelRatio = pixelRatio;
  }

  get postprocessing() {
    return this.postprocessingInstance;
  }

  set postprocessing(value: any) {
    this.postprocessingInstance = value;
    this.render = value.render.bind(value);
  }

  private startAnimation() {
    if (this.isAnimating) return;
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.time.delta = this.clock.getDelta();
      this.time.elapsed += this.time.delta;
      this.onBeforeRender(this.time);
      this.render();
      this.onAfterRender(this.time);
    };
    this.isAnimating = true;
    this.clock.start();
    animate();
  }

  private stopAnimation() {
    if (this.isAnimating && this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.isAnimating = false;
      this.clock.stop();
    }
  }

  private renderDefault() {
    this.renderer.render(this.scene, this.camera);
  }

  clear() {
    this.scene.traverse((object) => {
      if (object instanceof Object3D && 'material' in object && 'geometry' in object) {
        const mesh = object as any;
        if (mesh.material && typeof mesh.material === "object") {
          Object.keys(mesh.material).forEach((key) => {
            const value = mesh.material[key];
            if (value !== null && typeof value === "object" && typeof value.dispose === "function") {
              value.dispose();
            }
          });
          mesh.material.dispose();
          mesh.geometry.dispose();
        }
      }
    });
    this.scene.clear();
  }

  dispose() {
    this.removeEventListeners();
    this.stopAnimation();
    this.clear();
    this.postprocessingInstance?.dispose();
    this.renderer.dispose();
    this.isDisposed = true;
  }
}

// Mouse/Pointer tracking
const pointerElements = new Map();
const pointerPosition = new Vector2();
let isPointerListening = false;

function createPointerTracker(options: any) {
  const tracker = {
    position: new Vector2(),
    nPosition: new Vector2(),
    hover: false,
    onEnter() { },
    onMove() { },
    onClick() { },
    onLeave() { },
    ...options,
  };

  if (!pointerElements.has(options.domElement)) {
    pointerElements.set(options.domElement, tracker);
    if (!isPointerListening) {
      document.body.addEventListener("pointermove", handlePointerMove);
      document.body.addEventListener("pointerleave", handlePointerLeave);
      document.body.addEventListener("click", handlePointerClick);
      isPointerListening = true;
    }
  }

  tracker.dispose = () => {
    const element = options.domElement;
    pointerElements.delete(element);
    if (pointerElements.size === 0) {
      document.body.removeEventListener("pointermove", handlePointerMove);
      document.body.removeEventListener("pointerleave", handlePointerLeave);
      isPointerListening = false;
    }
  };

  return tracker;
}

function handlePointerMove(event: PointerEvent) {
  pointerPosition.x = event.clientX;
  pointerPosition.y = event.clientY;
  for (const [element, tracker] of pointerElements) {
    const rect = element.getBoundingClientRect();
    if (isInsideElement(rect)) {
      updateTrackerPosition(tracker, rect);
      if (!tracker.hover) {
        tracker.hover = true;
        tracker.onEnter(tracker);
      }
      tracker.onMove(tracker);
    } else if (tracker.hover) {
      tracker.hover = false;
      tracker.onLeave(tracker);
    }
  }
}

function handlePointerClick(event: PointerEvent) {
  pointerPosition.x = event.clientX;
  pointerPosition.y = event.clientY;
  for (const [element, tracker] of pointerElements) {
    const rect = element.getBoundingClientRect();
    updateTrackerPosition(tracker, rect);
    if (isInsideElement(rect)) tracker.onClick(tracker);
  }
}

function handlePointerLeave() {
  for (const tracker of pointerElements.values()) {
    if (tracker.hover) {
      tracker.hover = false;
      tracker.onLeave(tracker);
    }
  }
}

function updateTrackerPosition(tracker: any, rect: DOMRect) {
  const { position, nPosition } = tracker;
  position.x = pointerPosition.x - rect.left;
  position.y = pointerPosition.y - rect.top;
  nPosition.x = (position.x / rect.width) * 2 - 1;
  nPosition.y = (-position.y / rect.height) * 2 + 1;
}

function isInsideElement(rect: DOMRect) {
  const { x, y } = pointerPosition;
  const { left, top, width, height } = rect;
  return x >= left && x <= left + width && y >= top && y <= top + height;
}

// Physics
const { randFloat, randFloatSpread } = MathUtils;

class PhysicsSimulation {
  config: any;
  positionData: Float32Array;
  velocityData: Float32Array;
  sizeData: Float32Array;
  center: Vector3;

  constructor(config: any) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.center = new Vector3();
    this.initPositions();
    this.setSizes();
  }

  private initPositions() {
    const { config, positionData } = this;
    this.center.toArray(positionData, 0);
    for (let i = 1; i < config.count; i++) {
      const base = 3 * i;
      positionData[base] = randFloatSpread(2 * config.maxX);
      positionData[base + 1] = randFloatSpread(2 * config.maxY);
      positionData[base + 2] = randFloatSpread(2 * config.maxZ);
    }
  }

  setSizes() {
    const { config, sizeData } = this;
    sizeData[0] = config.size0;
    for (let i = 1; i < config.count; i++) {
      sizeData[i] = randFloat(config.minSize, config.maxSize);
    }
  }

  update(time: any) {
    // Simplified physics update
    const { config, positionData, velocityData, sizeData } = this;
    
    for (let i = 0; i < config.count; i++) {
      const base = 3 * i;
      const pos = new Vector3().fromArray(positionData, base);
      const vel = new Vector3().fromArray(velocityData, base);
      
      vel.y -= time.delta * config.gravity * sizeData[i];
      vel.multiplyScalar(config.friction);
      pos.add(vel);
      
      // Wall collisions
      if (Math.abs(pos.x) + sizeData[i] > config.maxX) {
        pos.x = Math.sign(pos.x) * (config.maxX - sizeData[i]);
        vel.x = -vel.x * config.wallBounce;
      }
      if (pos.y - sizeData[i] < -config.maxY) {
        pos.y = -config.maxY + sizeData[i];
        vel.y = -vel.y * config.wallBounce;
      }
      
      pos.toArray(positionData, base);
      vel.toArray(velocityData, base);
    }
  }
}

// Material
class SubsurfaceMaterial extends MeshPhysicalMaterial {
  uniforms: any;

  constructor(options: any) {
    super(options);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 },
    };
    this.defines.USE_UV = "";
    this.onBeforeCompile = (shader: any) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader = `
        uniform float thicknessPower;
        uniform float thicknessScale;
        uniform float thicknessDistortion;
        uniform float thicknessAmbient;
        uniform float thicknessAttenuation;
      ` + shader.fragmentShader;
      
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
          vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
        }

        void main() {
        `
      );
      
      const modifiedLightsFragment = ShaderChunk.lights_fragment_begin.replace(
        /RE_Direct\( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight \);/g,
        `
        RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
        RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_begin>", modifiedLightsFragment);
    };
  }
}

const defaultConfig = {
  count: 200,
  colors: [0x8B5CF6, 0x0EA5E9, 0xD946EF],
  ambientColor: 0xffffff,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true
};

const matrixHelper = new Object3D();

class BallpitMesh extends InstancedMesh {
  config: any;
  physics: PhysicsSimulation;
  ambientLight: AmbientLight;
  light: PointLight;

  constructor(renderer: WebGLRenderer, config: any = {}) {
    const finalConfig = { ...defaultConfig, ...config };
    const roomEnvironment = new RoomEnvironment();
    const envMap = new PMREMGenerator(renderer).fromScene(roomEnvironment).texture;
    const geometry = new SphereGeometry();
    const material = new SubsurfaceMaterial({ envMap, ...finalConfig.materialParams });
    material.envMapRotation.x = -Math.PI / 2;
    
    super(geometry, material, finalConfig.count);
    
    this.config = finalConfig;
    this.physics = new PhysicsSimulation(finalConfig);
    this.initLights();
    this.setColors(finalConfig.colors);
  }

  private initLights() {
    this.ambientLight = new AmbientLight(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.light = new PointLight(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
  }

  setColors(colors: number[]) {
    if (Array.isArray(colors) && colors.length > 1) {
      const colorGradient = createColorGradient(colors);
      for (let i = 0; i < this.count; i++) {
        this.setColorAt(i, colorGradient.getColorAt(i / this.count));
        if (i === 0) {
          this.light.color.copy(colorGradient.getColorAt(i / this.count));
        }
      }
      this.instanceColor!.needsUpdate = true;
    }
  }

  update(time: any) {
    this.physics.update(time);
    for (let i = 0; i < this.count; i++) {
      matrixHelper.position.fromArray(this.physics.positionData, 3 * i);
      if (i === 0 && this.config.followCursor === false) {
        matrixHelper.scale.setScalar(0);
      } else {
        matrixHelper.scale.setScalar(this.physics.sizeData[i]);
      }
      matrixHelper.updateMatrix();
      this.setMatrixAt(i, matrixHelper.matrix);
      if (i === 0) this.light.position.copy(matrixHelper.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createColorGradient(colors: number[]) {
  let colorArray: number[];
  let colorObjects: Color[];
  
  function setColors(newColors: number[]) {
    colorArray = newColors;
    colorObjects = [];
    colorArray.forEach((col) => {
      colorObjects.push(new Color(col));
    });
  }
  
  setColors(colors);
  
  return {
    setColors,
    getColorAt: function (ratio: number, out = new Color()) {
      const scaled = Math.max(0, Math.min(1, ratio)) * (colorArray.length - 1);
      const idx = Math.floor(scaled);
      const start = colorObjects[idx];
      if (idx >= colorArray.length - 1) return start.clone();
      const alpha = scaled - idx;
      const end = colorObjects[idx + 1];
      out.r = start.r + alpha * (end.r - start.r);
      out.g = start.g + alpha * (end.g - start.g);
      out.b = start.b + alpha * (end.b - start.b);
      return out;
    },
  };
}

function createBallpit(canvas: HTMLCanvasElement, config: any = {}) {
  const app = new ThreeApp({
    canvas,
    size: "parent",
    rendererOptions: { antialias: true, alpha: true },
  });
  
  let ballpitMesh: BallpitMesh;
  app.renderer.toneMapping = ACESFilmicToneMapping;
  app.camera.position.set(0, 0, 20);
  app.camera.lookAt(0, 0, 0);
  app.cameraMaxAspect = 1.5;
  app.resize();
  
  initialize(config);
  
  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const intersection = new Vector3();
  let isPaused = false;
  
  const pointer = createPointerTracker({
    domElement: canvas,
    onMove() {
      raycaster.setFromCamera(pointer.nPosition, app.camera);
      app.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, intersection);
      ballpitMesh.physics.center.copy(intersection);
      ballpitMesh.config.controlSphere0 = true;
    },
    onLeave() {
      ballpitMesh.config.controlSphere0 = false;
    },
  });
  
  function initialize(newConfig: any) {
    if (ballpitMesh) {
      app.clear();
      app.scene.remove(ballpitMesh);
    }
    ballpitMesh = new BallpitMesh(app.renderer, newConfig);
    app.scene.add(ballpitMesh);
  }
  
  app.onBeforeRender = (time) => {
    if (!isPaused) ballpitMesh.update(time);
  };
  
  app.onAfterResize = (size) => {
    ballpitMesh.config.maxX = size.wWidth / 2;
    ballpitMesh.config.maxY = size.wHeight / 2;
  };
  
  return {
    three: app,
    get spheres() {
      return ballpitMesh;
    },
    setCount(count: number) {
      initialize({ ...ballpitMesh.config, count });
    },
    togglePause() {
      isPaused = !isPaused;
    },
    dispose() {
      pointer.dispose();
      app.dispose();
    },
  };
}

interface BallpitProps {
  className?: string;
  followCursor?: boolean;
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  colors?: number[];
}

const Ballpit: React.FC<BallpitProps> = ({ 
  className = '', 
  followCursor = true, 
  ...props 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballpitInstanceRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ballpitInstanceRef.current = createBallpit(canvas, { followCursor, ...props });

    return () => {
      if (ballpitInstanceRef.current) {
        ballpitInstanceRef.current.dispose();
      }
    };
  }, [followCursor, props]);

  return (
    <canvas
      className={className}
      ref={canvasRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Ballpit;
