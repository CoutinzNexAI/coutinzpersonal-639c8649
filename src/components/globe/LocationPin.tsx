
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { LocationPinProps } from './types';

const LocationPin: React.FC<LocationPinProps> = ({ 
  position, 
  country, 
  onSelect, 
  isActive, 
  globeRotation 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pinSize = isActive ? 32 : 28;
  const pinColor = isActive ? "#FF4588" : "#00FFFF";
  
  // Atualizar a posição do marcador baseado na rotação do globo
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Criar uma matriz de rotação baseada na rotação atual do globo
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(globeRotation);
    
    // Aplicar a rotação à posição original
    const originalPosition = new THREE.Vector3(...position);
    const rotatedPosition = originalPosition.clone().applyMatrix4(rotationMatrix);
    
    groupRef.current.position.copy(rotatedPosition);
    groupRef.current.lookAt(0, 0, 0);
  });
  
  return (
    <group ref={groupRef}>
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Html
          distanceFactor={10}
          center
          className="pointer-events-auto cursor-pointer select-none"
          zIndexRange={[100, 0]}
        >
          <div 
            className="flex flex-col items-center transition-all duration-300 transform"
            style={{ transform: `scale(${isActive ? 1.2 : 1})` }}
            onClick={() => onSelect(country)}
          >
            <div className="relative animate-bounce-slow" style={{ animationDelay: `${Math.random() * 2}s` }}>
              <span 
                style={{ 
                  fontSize: `${pinSize}px`, 
                  color: pinColor,
                  textShadow: "0 0 10px rgba(0,0,0,0.5)",
                  filter: "drop-shadow(0 0 8px rgba(0,255,255,0.3))"
                }}
              >
                📍
              </span>
              <span 
                className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ 
                  opacity: isActive ? 1 : 0.8,
                  fontSize: isActive ? '10px' : '8px'
                }}
              >
                {country}
              </span>
            </div>
          </div>
        </Html>
      </Billboard>
    </group>
  );
};

export default LocationPin;
