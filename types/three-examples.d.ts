declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, LoadingManager, Group, AnimationClip, Camera } from 'three';
  
  export interface GLTF {
    animations: AnimationClip[];
    scene: Group;
    scenes: Group[];
    cameras: Camera[];
    asset: object;
  }

  
  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: GLTF) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    setDRACOLoader(dracoLoader: any): GLTFLoader;
    setKTX2Loader(ktx2Loader: any): GLTFLoader;
    setMeshoptDecoder(meshoptDecoder: any): GLTFLoader;
  }
}

declare module 'three/examples/jsm/loaders/KTX2Loader' {
  import { Loader, LoadingManager, CompressedTexture, WebGLRenderer } from 'three';
  
  export class KTX2Loader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad?: (texture: CompressedTexture) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    setTranscoderPath(path: string): KTX2Loader;
    setWorkerLimit(limit: number): KTX2Loader;
    detectSupport(renderer: WebGLRenderer): KTX2Loader;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/libs/meshopt_decoder.module.js' {
  export const MeshoptDecoder: {
    ready: Promise<void>;
    supported: boolean;
    useWorkers: number;
    decodeGltfBuffer: (
      target: Uint8Array,
      count: number,
      size: number,
      source: Uint8Array,
      mode: string,
      filter?: string
    ) => void;
  };
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3 } from 'three';
  
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    object: Camera;
    domElement: HTMLElement | Document;
    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    autoRotate: boolean;
    autoRotateSpeed: number;
    keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string };
    mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
    touches: { ONE: TOUCH; TWO: TOUCH };
    update(): boolean;
    saveState(): void;
    reset(): void;
    dispose(): void;
    getPolarAngle(): number;
    getAzimuthalAngle(): number;
    getDistance(): number;
    listenToKeyEvents(domElement: HTMLElement): void;
  }
}

declare module 'three/examples/jsm/objects/Water' {
  import { Mesh, PlaneGeometry, ShaderMaterial, Texture, Vector3 } from 'three';
  
  export interface WaterOptions {
    textureWidth?: number;
    textureHeight?: number;
    waterNormals?: Texture;
    sunDirection?: Vector3;
    sunColor?: number;
    waterColor?: number;
    distortionScale?: number;
    fog?: boolean;
    clipBias?: number;
    alpha?: number;
    time?: number;
    size?: number;
  }
  
  export class Water extends Mesh {
    constructor(geometry: PlaneGeometry, options: WaterOptions);
    material: ShaderMaterial;
  }
}

declare module 'three/examples/jsm/objects/Sky' {
  import { Mesh, ShaderMaterial } from 'three';
  
  export class Sky extends Mesh {
    constructor();
    material: ShaderMaterial;
  }
}