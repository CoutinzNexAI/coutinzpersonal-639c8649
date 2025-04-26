
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const Globe = ({ visitedCountries }) => {
  const meshRef = useRef();
  const globeTexture = useRef(new THREE.TextureLoader().load('/earth-texture.jpg'));

  useFrame((state) => {
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
      />
    </mesh>
  );
};

const Globe3D = ({ visitedCountries }) => {
  return (
    <div className="h-[500px] w-full">
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
