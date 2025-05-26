
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RotatingGlobe from './RotatingGlobe';
import LocationPin from './LocationPin';
import { countryCoordinates, geoToPosition } from './coordinates';
import type { GlobeComponentProps } from './types';

const Globe: React.FC<GlobeComponentProps> = ({ visitedCountries, onCountrySelect }) => {
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const globeRef = useRef<THREE.Group>(null);
  const [globeRotation, setGlobeRotation] = useState(new THREE.Euler());
  
  useFrame(() => {
    if (globeRef.current) {
      setGlobeRotation(globeRef.current.rotation.clone());
    }
  });
  
  const handleCountrySelect = (country: string) => {
    setActiveCountry(country);
    if (onCountrySelect) {
      onCountrySelect(country);
    }
  };
  
  return (
    <>
      <group ref={globeRef}>
        <RotatingGlobe globeRef={globeRef} />
      </group>
      
      {/* Marcadores de países (fixos no espaço, não giram com o globo) */}
      <group>
        {visitedCountries.map((country) => {
          if (countryCoordinates[country]) {
            const [lon, lat] = countryCoordinates[country];
            const position = geoToPosition(lon, lat, 1.2); // Acima da superfície do globo
            
            return (
              <LocationPin 
                key={country}
                country={country}
                position={position}
                onSelect={handleCountrySelect}
                isActive={activeCountry === country}
                globeRotation={globeRotation}
              />
            );
          }
          return null;
        })}
      </group>
    </>
  );
};

export default Globe;
