
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  visitedCountries: string[];
  onCountrySelect?: (country: string) => void;
}

// Coordenadas dos países (coordenadas específicas para capitais/pontos centrais)
const countryCoordinates: Record<string, [number, number]> = {
  "Japan": [139.6917, 35.6895], // Tokyo
  "Italy": [12.4964, 41.9028], // Rome
  "Peru": [-72.5450, -13.1631], // Near Machu Picchu
  "France": [2.3522, 48.8566], // Paris
  "Spain": [-3.7038, 40.4168], // Madrid
  "United Kingdom": [-0.1278, 51.5074], // London
  "Germany": [13.4050, 52.5200], // Berlin
  "China": [116.4074, 39.9042], // Beijing
  "Brazil": [-47.9292, -15.7801], // Brasilia
  "Australia": [151.2093, -33.8688], // Sydney
  "United States": [-77.0369, 38.9072], // Washington DC
  "Canada": [-75.6972, 45.4215], // Ottawa
  "Portugal": [-9.1393, 38.7223], // Lisboa
};

// Converter coordenadas geográficas para posição 3D no globo
const geoToPosition = (lon: number, lat: number, radius: number = 1): [number, number, number] => {
  // Converter para radianos
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  // Coordenadas cartesianas
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
};

// Componente Globo que roda
const RotatingGlobe: React.FC<{ globeRef: React.RefObject<THREE.Group> }> = ({ globeRef }) => {
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

// Marcador para países visitados com ícone de localização (fixo no espaço)
const LocationPin: React.FC<{ 
  position: [number, number, number]; 
  country: string;
  onSelect: (country: string) => void;
  isActive: boolean;
  globeRotation: THREE.Euler;
}> = ({ position, country, onSelect, isActive, globeRotation }) => {
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

// Componente principal que contém o globo e os marcadores
const Globe: React.FC<GlobeProps> = ({ visitedCountries, onCountrySelect }) => {
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
