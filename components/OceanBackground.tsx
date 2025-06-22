import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
// Extend Three.js objects for R3F
extend({ Water, Sky });

// Declare types for JSX elements using module augmentation
declare module '@react-three/fiber' {
  interface ThreeElements {
    water: any;
    sky: any;
  }
}

const WATER_NORMALS_TEXTURE_URL = "/textures/waternormals.jpg";

interface OceanProps {
  skyParameters: { elevation: number; azimuth: number };
  waterUniforms: { distortionScale: { value: number }, size: { value: number } };
  statsRef: React.MutableRefObject<Stats | null>;
}

function Ocean({ skyParameters, waterUniforms, statsRef }: OceanProps) {
  const waterRef = useRef<Water | null>(null);
  const skyRef = useRef<Sky | null>(null);
  const sunRef = useRef(new THREE.Vector3());
  const { scene, gl } = useThree();

  const waterNormals = useTexture(WATER_NORMALS_TEXTURE_URL, (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  });

  const updateSun = useCallback(() => {
    if (!skyRef.current || !waterRef.current) return;

    const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation);
    const theta = THREE.MathUtils.degToRad(skyParameters.azimuth);
    sunRef.current.setFromSphericalCoords(1, phi, theta);

    skyRef.current.material.uniforms['sunPosition'].value.copy(sunRef.current);
    waterRef.current.material.uniforms['sunDirection'].value.copy(sunRef.current).normalize();
    waterRef.current.material.uniforms['distortionScale'].value = waterUniforms.distortionScale.value;
    waterRef.current.material.uniforms['size'].value = waterUniforms.size.value;

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const sceneEnv = new THREE.Scene();
    sceneEnv.add(skyRef.current);
    const newRenderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.environment = newRenderTarget.texture;
    pmremGenerator.dispose();
  }, [skyParameters, waterUniforms, gl, scene]);

  useEffect(() => {
    updateSun();
  }, [skyParameters, waterUniforms, updateSun]);

  useFrame(() => {
    if (waterRef.current) {
      waterRef.current.material.uniforms['time'].value += 1.0 / 60.0;
    }
    statsRef.current?.update();
  });

  return (
    <>
      <sky ref={skyRef} scale={[10000, 10000, 10000]} />
      <water
        ref={waterRef}
        args={[new THREE.PlaneGeometry(50000, 50000), { 
          textureWidth: 512,
          textureHeight: 512,
          waterNormals: waterNormals,
          sunDirection: sunRef.current,
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          distortionScale: 3.7,
          fog: scene.fog !== undefined,
        }]}
        rotation-x={-Math.PI / 2}
      />
    </>
  );
}

interface OceanBackgroundProps {
  children?: React.ReactNode; 
}

export default function OceanBackground({ children }: OceanBackgroundProps) {

  const [waterUniforms] = useState({
    distortionScale: { value: 3.7 },
    size: { value: 1.0 }
  });

  const statsRef = useRef<Stats | null>(null);

  return (
    <div className="ocean-background-container">
      <Canvas
        className="ocean-canvas"
        camera={{ fov: 40, position: [0, 30, 200], near: 1, far: 1000 }}
        shadows
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.5,
          antialias: true
        }}
      >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <OrbitControls
          maxPolarAngle={Math.PI * 0.495}
          target={new THREE.Vector3(0, 0, 0)}
          minDistance={10.0}
          maxDistance={1000.0}
        />

        <Ocean
          skyParameters={{  elevation: 2, azimuth: 180 }}
          waterUniforms={waterUniforms}
          statsRef={statsRef}
        />
        {children}
      </Canvas>
    </div>
  );
}
