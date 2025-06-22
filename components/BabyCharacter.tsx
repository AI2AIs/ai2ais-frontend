import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { BabyCharacterAudioParams, BabyCharacterAudioVisualizerProps } from '@/types/character';

interface EnhancedBabyCharacterProps extends BabyCharacterAudioVisualizerProps {
  externalAudioData?: {
    isAnyCharacterSpeaking: boolean;
    currentSpeaker?: string;
    audioFrequency?: number;
    audioVolume?: number;
  };
}

const BabyCharacter: React.FC<EnhancedBabyCharacterProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  autoStart = false,
  externalAudioData
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const oscillatorRefs = useRef<{
    oscillator: OscillatorNode;
    modulator: OscillatorNode;
    gainNode: GainNode;
    modulatorGain: GainNode;
  } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioParams = useMemo((): BabyCharacterAudioParams => ({
    frequency: 80,
    modulation: 0.5,
    volume: 0.3,
  }), []);

  // External audio reactive state
  const [isExternalReactive, setIsExternalReactive] = useState(false);
  const [externalFrequency, setExternalFrequency] = useState(0);

  const uniforms = useMemo(() => ({
    u_time: { value: 0.0 },
    u_frequency: { value: 0.0 },
    u_red: { value: 0.3 },
    u_green: { value: 0.8 },
    u_blue: { value: 1.0 }
  }), []);

  const vertexShader = `
    uniform float u_time;
    uniform float u_frequency;

    // Perlin noise function (same as before)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

    float pnoise(vec3 P, vec3 rep) {
      vec3 Pi0 = mod(floor(P), rep);
      vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
      Pi0 = mod289(Pi0);
      Pi1 = mod289(Pi1);
      vec3 Pf0 = fract(P);
      vec3 Pf1 = Pf0 - vec3(1.0);
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;

      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);

      vec4 gx0 = ixy0 * (1.0 / 7.0);
      vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);

      vec4 gx1 = ixy1 * (1.0 / 7.0);
      vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);

      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;

      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);

      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
    }
    
    void main() {
      float noise = 3.0 * pnoise(position + u_time * 0.5, vec3(10.0));
      float displacement = (u_frequency / 30.0) * (noise / 10.0);
      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_red;
    uniform float u_blue;
    uniform float u_green;
    uniform float u_frequency;

    void main() {
      float intensity = u_frequency / 255.0;
      vec3 color = vec3(
        u_red + intensity * 0.3,
        u_green + intensity * 0.6,
        u_blue + intensity * 0.8
      );
      gl_FragColor = vec4(color, 0.8);
    }
  `;

  // Internal audio functions (keep existing)
  const initAudio = useCallback(async () => {
    try {
      const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error('AudioContext not supported');
      }

      const audioCtx = new AudioContextCtor();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const analyser = audioCtx.createAnalyser();

      analyser.fftSize = 64;

      oscillator.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioCtx.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(audioParams.frequency, audioCtx.currentTime);

      const modulator = audioCtx.createOscillator();
      const modulatorGain = audioCtx.createGain();
      modulator.frequency.value = audioParams.modulation;
      modulatorGain.gain.value = 20;
      modulator.connect(modulatorGain);
      modulatorGain.connect(oscillator.frequency);

      gainNode.gain.value = audioParams.volume;

      oscillator.start();
      modulator.start();

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      oscillatorRefs.current = { oscillator, modulator, gainNode, modulatorGain };

      setIsPlaying(true);
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      setIsPlaying(false);
      return false;
    }
  }, [audioParams]); 

  const stopAudio = useCallback(() => {
    if (isPlaying && oscillatorRefs.current) {
      oscillatorRefs.current.oscillator.stop();
      oscillatorRefs.current.modulator.stop();
      oscillatorRefs.current.gainNode.disconnect();
      oscillatorRefs.current.modulatorGain.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    console.log("🎵 Child AI sound stop");
  }, [isPlaying]);

  const toggleAudio = useCallback(() => {
    if (isPlaying) {
      stopAudio();
    } else {
      initAudio();
    }
  }, [isPlaying, initAudio, stopAudio]);

  useEffect(() => {
    if (externalAudioData?.isAnyCharacterSpeaking) {
      setIsExternalReactive(true);
      console.log(`👶 BabyCharacter reacting to ${externalAudioData.currentSpeaker} speaking`);
      
      const speakerFrequencies = {
        claude: 60,
        gpt: 80,
        grok: 100
      };
      
      const baseFreq = speakerFrequencies[externalAudioData.currentSpeaker as keyof typeof speakerFrequencies] || 70;
      setExternalFrequency(baseFreq);
      
    } else {
      setIsExternalReactive(false);
      setExternalFrequency(0);
    }
  }, [externalAudioData?.isAnyCharacterSpeaking, externalAudioData?.currentSpeaker]);

  // Auto-start behavior
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => {
        initAudio();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, initAudio]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // ✅ ENHANCED ANIMATION LOOP
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Time update
      uniforms.u_time.value = time;

      if (isExternalReactive && externalFrequency > 0) {
        // Animate based on external character speaking
        const reactiveFrequency = externalFrequency + Math.sin(time * 4) * 30;
        const reactiveIntensity = reactiveFrequency / 255;
        
        uniforms.u_frequency.value = reactiveFrequency;
        
        // Different colors for different speakers
        if (externalAudioData?.currentSpeaker === 'claude') {
          uniforms.u_red.value = 0.8 + reactiveIntensity * 0.2;
          uniforms.u_green.value = 0.4 + reactiveIntensity * 0.4;
          uniforms.u_blue.value = 0.2 + reactiveIntensity * 0.6;
        } else if (externalAudioData?.currentSpeaker === 'gpt') {
          uniforms.u_red.value = 0.2 + reactiveIntensity * 0.4;
          uniforms.u_green.value = 0.8 + reactiveIntensity * 0.2;
          uniforms.u_blue.value = 0.6 + reactiveIntensity * 0.4;
        } else if (externalAudioData?.currentSpeaker === 'grok') {
          uniforms.u_red.value = 0.9 + reactiveIntensity * 0.1;
          uniforms.u_green.value = 0.7 + reactiveIntensity * 0.3;
          uniforms.u_blue.value = 0.2 + reactiveIntensity * 0.6;
        } else {
          // Default reactive colors
          uniforms.u_red.value = 0.5 + reactiveIntensity * 0.5;
          uniforms.u_green.value = 0.8 + reactiveIntensity * 0.2;
          uniforms.u_blue.value = 0.6 + reactiveIntensity * 0.4;
        }
        
      }
      // Priority 2: Internal audio analysis (own oscillator)
      else if (analyserRef.current && isPlaying) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        uniforms.u_frequency.value = average;
        uniforms.u_red.value = 0.3 + (average / 255) * 0.4;
        uniforms.u_green.value = 0.8 + (average / 255) * 0.2;
        uniforms.u_blue.value = 1.0 + (average / 255) * 0.1;
      } 
      // Priority 3: Idle animation
      else {
        uniforms.u_frequency.value = 20 + Math.sin(time * 0.5) * 15;
        uniforms.u_red.value = 0.3 + Math.sin(time * 0.2) * 0.1;
        uniforms.u_green.value = 0.8 + Math.sin(time * 0.3) * 0.1;
        uniforms.u_blue.value = 1.0 + Math.sin(time * 0.4) * 0.05;
      }

      // Enhanced rotation based on activity
      const rotationSpeed = isExternalReactive ? 1.5 : (isPlaying ? 1.2 : 0.8);
      meshRef.current.rotation.x += 0.008 * rotationSpeed;
      meshRef.current.rotation.y += 0.012 * rotationSpeed;
      meshRef.current.rotation.z += 0.005 * rotationSpeed;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={toggleAudio}
    >
      <icosahedronGeometry args={[2, 15]} /> 
      <shaderMaterial
        attach="material"
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        wireframe={true}
        transparent={true}
      />
    </mesh>
  );
};

export default BabyCharacter;