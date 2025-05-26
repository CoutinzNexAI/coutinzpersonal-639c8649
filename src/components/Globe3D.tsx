
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Globe from './globe/Globe';
import type { GlobeProps } from './globe/types';

const Globe3D: React.FC<GlobeProps> = ({ visitedCountries, onCountrySelect }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const textureLoader = new THREE.TextureLoader();
    const earthDayMapUrl = "https://unpkg.com/three-globe@2.30.0/example/img/earth-blue-marble.jpg";
    
    textureLoader.load(
      earthDayMapUrl,
      () => setLoading(false),
      undefined,
      (err) => {
        console.error('Falha ao carregar textura do planeta', err);
        setError('Não foi possível carregar a textura do planeta. Verifica tua conexão de internet.');
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="h-[500px] w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="animate-spin h-12 w-12 border-4 border-cosmic-blue border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-red-500 text-center">
            <p>{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-cosmic-blue rounded-md text-white"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
      
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} />
        <Globe visitedCountries={visitedCountries} onCountrySelect={onCountrySelect} />
        <OrbitControls 
          enableZoom={true}
          minDistance={1.5}
          maxDistance={5}
          autoRotate={false}
          enablePan={false}
          minPolarAngle={Math.PI/4}
          maxPolarAngle={Math.PI/1.5}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Globe3D;
