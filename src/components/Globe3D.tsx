
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  visitedCountries: string[];
}

const Globe: React.FC<GlobeProps> = ({ visitedCountries }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const globeTexture = useRef(new THREE.TextureLoader().load('/earth-texture.jpg'));
  
  // Create highlighted material for visited countries
  const materials = useMemo(() => {
    const standardMaterial = new THREE.MeshStandardMaterial({
      map: globeTexture.current,
      metalness: 0.4,
      roughness: 0.7,
    });
    
    const highlightMaterial = new THREE.MeshStandardMaterial({
      map: globeTexture.current,
      metalness: 0.6,
      roughness: 0.5,
      emissive: new THREE.Color(0x0EA5E9),
      emissiveIntensity: 0.2,
    });

    return { standardMaterial, highlightMaterial };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.001;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial 
        map={globeTexture.current}
        metalness={0.4}
        roughness={0.7}
        emissive={visitedCountries.length > 0 ? new THREE.Color(0x0EA5E9) : undefined}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};

const Globe3D: React.FC<GlobeProps> = ({ visitedCountries }) => {
  return (
    <div className="h-[500px] w-full relative">
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white p-2 rounded text-xs">
        <p className="font-bold">Países visitados: {visitedCountries.join(', ')}</p>
      </div>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Globe visitedCountries={visitedCountries} />
        <OrbitControls 
          enableZoom={true}
          minDistance={2}
          maxDistance={5}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Globe3D;
