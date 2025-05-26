
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import type { RotatingGlobeProps } from './types';

const RotatingGlobe: React.FC<RotatingGlobeProps> = ({ globeRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const earthDayMapUrl = "https://unpkg.com/three-globe@2.30.0/example/img/earth-blue-marble.jpg";
  const earthMap = useLoader(THREE.TextureLoader, earthDayMapUrl);
  
  // Criar um efeito de rotação suave
  useFrame(() => {
    if (!meshRef.current || !globeRef.current) return;
    meshRef.current.rotation.y += 0.001;
    globeRef.current.rotation.copy(meshRef.current.rotation);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial 
        map={earthMap}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
};

export default RotatingGlobe;
