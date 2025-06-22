import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface HealthBarProps {
  currentHealth?: number;
  maxHealth?: number;
  position?: [number, number, number];
  width?: number;
  height?: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ 
  currentHealth = 75, 
  maxHealth = 100, 
  position = [0, 0, 0],
  width = 6,
  height = 0.6,
}) => {
  const barRef = useRef<Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const healthPercentage = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  
  const healthColor = useMemo(() => {
    if (healthPercentage > 70) return '#00ff88';
    if (healthPercentage > 50) return '#ffaa00';
    if (healthPercentage > 20) return '#ff4400';
    return '#ff0044';
  }, [healthPercentage]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
    
    if (healthPercentage < 20 && barRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 8) * 0.05 + 1;
      barRef.current.scale.setY(pulse);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#333333" transparent opacity={0.8} />
      </mesh>
      
      {/* Health Fill */}
      <mesh 
        ref={barRef}
        position={[-(width/2) + (width * healthPercentage/100)/2, 0, 0]}
        scale={[healthPercentage/100, 1, 1]}
      >
        <planeGeometry args={[width, height * 0.8]} />
        <meshBasicMaterial color={healthColor} />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[width/2 - 0.05, width/2, 0, Math.PI * 2, 20]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default HealthBar;