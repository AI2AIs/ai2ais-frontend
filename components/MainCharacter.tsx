import { useEffect, useState, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { Group, Mesh } from "three";
import type { MainCharacterProps } from "@/types/character";
import { EXPRESSION_MORPHS, EXPRESSION_TO_MORPHS, MOUTH_MORPHS, PHONEME_TO_MORPH } from "@/const";


export function MainCharacter({   
  lipSyncData, 
  audioUrl, 
  facialExpression, 
  laughterSoundUrl,
  enableIdleAnimations = true
}: MainCharacterProps) {
  const url = "/models/character.glb"; // Path to your GLTF model
  const gl = useThree((state) => state.gl);
  
  // ==================== STATE ====================
  const [model, setModel] = useState<Group | null>(null);
  const [faceMesh, setFaceMesh] = useState<Mesh | null>(null);
  const [isLaughing, setIsLaughing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // ==================== REFS ====================
  const animationRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const laughterAnimationRef = useRef<number | null>(null);
  const laughterAudioRef = useRef<HTMLAudioElement | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  
  // Idle animation timing refs
  const lastBlinkTime = useRef<number>(0);
  const nextBlinkDelay = useRef<number>(2000);
  const isBlinking = useRef<boolean>(false);
  const breathingPhase = useRef<number>(0);
  const lastBrowMovement = useRef<number>(0);
  const nextBrowDelay = useRef<number>(8000);

  // ==================== BLINKING SYSTEM ====================
  const triggerBlink = () => {
    if (!faceMesh?.morphTargetInfluences || isBlinking.current) return;
    
    isBlinking.current = true;
    const startTime = Date.now();
    const blinkDuration = 150;
    
    const animateBlink = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / blinkDuration;
      
      if (progress >= 1) {
        // Reset blink morphs
        isBlinking.current = false;
        const leftBlinkIndex = faceMesh.morphTargetDictionary?.['eyeBlink_L'];
        const rightBlinkIndex = faceMesh.morphTargetDictionary?.['eyeBlink_R'];
        
        if (typeof leftBlinkIndex === 'number' && faceMesh.morphTargetInfluences) {
          faceMesh.morphTargetInfluences[leftBlinkIndex] = 0;
        }
        if (typeof rightBlinkIndex === 'number' && faceMesh.morphTargetInfluences) {
          faceMesh.morphTargetInfluences[rightBlinkIndex] = 0;
        }
        
        // Set next blink timing (adaptive to speaking state)
        const baseDelay = isSpeaking ? 1500 : 2000;
        const randomDelay = isSpeaking ? 2500 : 4000;
        nextBlinkDelay.current = baseDelay + Math.random() * randomDelay;
        lastBlinkTime.current = Date.now();
        return;
      }
      
      // Smooth blink animation with ease-in-out
      const easeInOut = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      const blinkValue = Math.sin(easeInOut * Math.PI);
      
      // Apply blink to both eyes
      const leftBlinkIndex = faceMesh.morphTargetDictionary?.['eyeBlink_L'];
      const rightBlinkIndex = faceMesh.morphTargetDictionary?.['eyeBlink_R'];
      
      if (typeof leftBlinkIndex === 'number' && faceMesh.morphTargetInfluences) {
        faceMesh.morphTargetInfluences[leftBlinkIndex] = blinkValue;
      }
      if (typeof rightBlinkIndex === 'number' && faceMesh.morphTargetInfluences) {
        faceMesh.morphTargetInfluences[rightBlinkIndex] = blinkValue;
      }
      
      requestAnimationFrame(animateBlink);
    };
    
    requestAnimationFrame(animateBlink);
  };

  // ==================== IDLE ANIMATIONS ====================
  const startIdleAnimations = () => {
    if (!faceMesh?.morphTargetInfluences || !enableIdleAnimations) return;
    
    console.log(`Starting idle animations... (Speaking: ${isSpeaking ? 'yes' : 'no'})`);
    lastBlinkTime.current = Date.now();
    lastBrowMovement.current = Date.now();
    
    const animateIdle = () => {
      if (!faceMesh?.morphTargetInfluences || !enableIdleAnimations) return;
      
      const currentTime = Date.now();
      
      // 1. BLINKING SYSTEM - Continue during speech
      if (currentTime - lastBlinkTime.current > nextBlinkDelay.current && !isBlinking.current) {
        triggerBlink();
      }
      
      // 2. BREATHING ANIMATION - Continue during speech
      if (!isLaughing) {
        breathingPhase.current += 0.008;
        const breathingValue = Math.sin(breathingPhase.current) * 0.02;
        
        // Subtle nose movement for breathing
        const noseLeftIndex = faceMesh.morphTargetDictionary?.['noseSneer_L'];
        const noseRightIndex = faceMesh.morphTargetDictionary?.['noseSneer_R'];
        
        if (typeof noseLeftIndex === 'number' && faceMesh.morphTargetInfluences) {
          faceMesh.morphTargetInfluences[noseLeftIndex] = Math.max(0, breathingValue);
        }
        if (typeof noseRightIndex === 'number' && faceMesh.morphTargetInfluences) {
          faceMesh.morphTargetInfluences[noseRightIndex] = Math.max(0, breathingValue);
        }
      }
      
      // 3. BROW MOVEMENTS - Only when NOT speaking
      if (currentTime - lastBrowMovement.current > nextBrowDelay.current && 
          !isLaughing && 
          !isSpeaking && 
          facialExpression === 'neutral') {
        
        const browStartTime = currentTime;
        const browDuration = 800;
        
        const animateSubtleBrow = () => {
          const browElapsed = Date.now() - browStartTime;
          const browProgress = browElapsed / browDuration;
          
          if (browProgress >= 1) {
            // Reset brow movement
            const browInnerIndex = faceMesh.morphTargetDictionary?.['browInnerUp'];
            if (typeof browInnerIndex === 'number' && faceMesh.morphTargetInfluences) {
              faceMesh.morphTargetInfluences[browInnerIndex] = 0;
            }
            
            // Set next brow timing (8-15 seconds)
            nextBrowDelay.current = 8000 + Math.random() * 7000;
            lastBrowMovement.current = Date.now();
            return;
          }
          
          // Subtle brow movement
          const browValue = Math.sin(browProgress * Math.PI) * 0.03;
          
          const browInnerIndex = faceMesh.morphTargetDictionary?.['browInnerUp'];
          if (typeof browInnerIndex === 'number' && faceMesh.morphTargetInfluences) {
            faceMesh.morphTargetInfluences[browInnerIndex] = browValue;
          }
          
          requestAnimationFrame(animateSubtleBrow);
        };
        
        requestAnimationFrame(animateSubtleBrow);
      }
      
      idleAnimationRef.current = requestAnimationFrame(animateIdle);
    };
    
    idleAnimationRef.current = requestAnimationFrame(animateIdle);
  };

  const stopIdleAnimations = () => {
    if (idleAnimationRef.current) {
      cancelAnimationFrame(idleAnimationRef.current);
      idleAnimationRef.current = null;
    }
  };

  // ==================== LAUGHTER SYSTEM ====================
  const startLaughter = () => {
    if (!faceMesh?.morphTargetInfluences || isLaughing) return;

    console.log("Starting laughter animation!");
    setIsLaughing(true);

    // Play laughter sound
    if (laughterSoundUrl) {
      laughterAudioRef.current = new Audio(laughterSoundUrl);
      laughterAudioRef.current.play().catch(err => {
        console.log("Could not play laughter sound:", err);
      });
    }

    const originalExpression = facialExpression;
    const startTime = Date.now();
    const laughDuration = 3000;
    
    const animateLaughter = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / laughDuration;
      
      if (progress >= 1) {
        console.log("Laughter completed, returning to original expression");
        setIsLaughing(false);
        
        if (originalExpression) {
          applyFacialExpression(originalExpression);
        } else {
          resetExpressionMorphs();
        }
        return;
      }

      // Three phases of laughter
      const phase1 = elapsed < 800;
      const phase2 = elapsed >= 800 && elapsed < 2000;
      //const phase3 = elapsed >= 2000;
      
      let smileIntensity, jawIntensity, eyeSquintIntensity, cheekIntensity, browIntensity;
      
      if (phase1) {
        // Build up
        const t = elapsed / 800;
        smileIntensity = t * 0.6;
        jawIntensity = t * 0.2;
        eyeSquintIntensity = t * 0.3;
        cheekIntensity = t * 0.4;
        browIntensity = t * 0.2;
      } else if (phase2) {
        // Intense laughter with oscillation
        const oscillation = Math.sin((elapsed - 800) * 0.02) * 0.3 + 0.7;
        const jawOscillation = Math.sin((elapsed - 800) * 0.025) * 0.4 + 0.6;
        smileIntensity = oscillation;
        jawIntensity = jawOscillation;
        eyeSquintIntensity = oscillation * 0.8;
        cheekIntensity = oscillation * 0.9;
        browIntensity = 0.4;
      } else {
        // Fade out
        const t = (elapsed - 2000) / 1000;
        const fade = 1 - t;
        smileIntensity = fade * 0.5;
        jawIntensity = fade * 0.1;
        eyeSquintIntensity = fade * 0.4;
        cheekIntensity = fade * 0.5;
        browIntensity = fade * 0.2;
      }
      
      resetExpressionMorphs();
      
      // Apply laughter morphs
      const laughMorphs = {
        mouthSmile_L: smileIntensity,
        mouthSmile_R: smileIntensity,
        jawOpen: jawIntensity,
        eyeSquint_L: eyeSquintIntensity,
        eyeSquint_R: eyeSquintIntensity,
        cheekSquint_L: cheekIntensity,
        cheekSquint_R: cheekIntensity,
        browInnerUp: browIntensity,
        mouthDimple_L: smileIntensity * 0.5,
        mouthDimple_R: smileIntensity * 0.5,
      };
      
      Object.entries(laughMorphs).forEach(([morphName, value]) => {
        const morphIndex = faceMesh.morphTargetDictionary?.[morphName];
        if (typeof morphIndex === 'number' && faceMesh.morphTargetInfluences) {
          faceMesh.morphTargetInfluences[morphIndex] = value;
        }
      });

      laughterAnimationRef.current = requestAnimationFrame(animateLaughter);
    };

    laughterAnimationRef.current = requestAnimationFrame(animateLaughter);
  };

  // ==================== FACIAL EXPRESSIONS ====================
  const applyFacialExpression = (expression: string) => {
    if (!faceMesh?.morphTargetInfluences || isLaughing) return;

    console.log(`Applying facial expression: ${expression}`);
    resetExpressionMorphs();

    const morphValues = EXPRESSION_TO_MORPHS[expression as keyof typeof EXPRESSION_TO_MORPHS] || {};
    
    Object.entries(morphValues).forEach(([morphName, value]) => {
      const morphIndex = faceMesh.morphTargetDictionary?.[morphName];
      if (typeof morphIndex === 'number' && typeof value === 'number' && faceMesh.morphTargetInfluences) {
        faceMesh.morphTargetInfluences[morphIndex] = value;
      }
    });
  };

  const resetExpressionMorphs = () => {
    if (!faceMesh?.morphTargetInfluences) return;

    EXPRESSION_MORPHS.forEach(morphName => {
      const morphIndex = faceMesh.morphTargetDictionary?.[morphName];
      if (typeof morphIndex === 'number' && faceMesh.morphTargetInfluences) {
        faceMesh.morphTargetInfluences[morphIndex] = 0;
      }
    });
  };

  // ==================== LIP SYNC SYSTEM ====================
  const startLipSync = () => {
    if (!faceMesh || !lipSyncData || !audioUrl) {
      console.log("Missing data for lip sync");
      return;
    }

    console.log("Starting lip sync animation...");
    setIsSpeaking(true);

    audioRef.current = new Audio(audioUrl);
    audioRef.current.play();

    const startTime = Date.now();

    const animate = () => {
      const currentTime = (Date.now() - startTime) / 1000;

      const currentCue = lipSyncData.mouthCues.find(
        cue => currentTime >= cue.start && currentTime <= cue.end
      );

      if (currentCue && faceMesh.morphTargetInfluences && !isLaughing) {
        resetMouthMorphs();
        
        const morphValues = PHONEME_TO_MORPH[currentCue.value as keyof typeof PHONEME_TO_MORPH] || {};
        
        Object.entries(morphValues).forEach(([morphName, value]) => {
          const morphIndex = faceMesh.morphTargetDictionary?.[morphName];
          if (typeof morphIndex === 'number' && typeof value === 'number' && faceMesh.morphTargetInfluences) {
            faceMesh.morphTargetInfluences[morphIndex] = value;
          }
        });
      }

      if (currentTime < lipSyncData.metadata.duration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        console.log("Lip sync animation completed");
        setIsSpeaking(false);
        
        // Reset blink timing after speaking
        lastBlinkTime.current = Date.now();
        nextBlinkDelay.current = 1000;
        
        if (!isLaughing) {
          resetMouthMorphs();
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const resetMouthMorphs = () => {
    if (!faceMesh?.morphTargetInfluences) return;

    MOUTH_MORPHS.forEach(morphName => {
      const morphIndex = faceMesh.morphTargetDictionary?.[morphName];
      if (typeof morphIndex === 'number' && faceMesh.morphTargetInfluences) {
        faceMesh.morphTargetInfluences[morphIndex] = 0;
      }
    });
  };

  // ==================== MODEL LOADING ====================
  useEffect(() => {
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath("/basis/")
      .detectSupport(gl);

    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      url,
      (gltf) => {
        setModel(gltf.scene);
      },
      undefined,
      (err) => {
        console.error("GLTF loading error:", err);
      }
    );
  }, [gl, url]);

  // ==================== FACE MESH DETECTION ====================
  useEffect(() => {
    if (model) {
      console.log("Model loaded, searching for morph targets...");
      
      model.traverse((child) => {
        if (child instanceof Mesh) {
          const mesh = child as Mesh;
          if (mesh.morphTargetDictionary) {
            console.log("Morph targets found!");
            setFaceMesh(mesh);
          }
        }
      });
    }
  }, [model]);

  // ==================== EFFECT HOOKS ====================
  
  // Start idle animations when face mesh is ready
  useEffect(() => {
    if (faceMesh && enableIdleAnimations) {
      console.log("Starting idle animations...");
      startIdleAnimations();
    }
    
    return () => {
      stopIdleAnimations();
    };
  }, [faceMesh, enableIdleAnimations]);

  // Restart animations when speaking state changes
  useEffect(() => {
    if (faceMesh && enableIdleAnimations) {
      console.log(`Speaking state changed: ${isSpeaking ? 'started' : 'stopped'}`);
      
      stopIdleAnimations();
      
      setTimeout(() => {
        if (faceMesh && enableIdleAnimations) {
          startIdleAnimations();
        }
      }, 100);
    }
  }, [isSpeaking, faceMesh, enableIdleAnimations]);

  // Apply facial expression when it changes
  useEffect(() => {
    if (faceMesh && facialExpression && !isLaughing) {
      applyFacialExpression(facialExpression);
    }
  }, [facialExpression, faceMesh, isLaughing]);

  // Auto-start lip sync when data is ready
  useEffect(() => {
    if (faceMesh && lipSyncData && audioUrl) {
      console.log("Auto-starting lip sync...");
      setTimeout(() => {
        startLipSync();
      }, 500);
    }
  }, [lipSyncData, audioUrl, faceMesh]);

  // ==================== CLEANUP & TEST FUNCTIONS ====================
  useEffect(() => {
    // Expose test functions to window for debugging
    (window as any).startLipSync = startLipSync;
    (window as any).startLaughter = startLaughter;
    (window as any).triggerBlink = triggerBlink;
    
    return () => {
      // Cleanup all animations and audio
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (laughterAnimationRef.current) {
        cancelAnimationFrame(laughterAnimationRef.current);
      }
      if (laughterAudioRef.current) {
        laughterAudioRef.current.pause();
      }
      stopIdleAnimations();
    };
  }, [faceMesh, lipSyncData, audioUrl, laughterSoundUrl]);

  return model ? <primitive object={model} /> : null;
}