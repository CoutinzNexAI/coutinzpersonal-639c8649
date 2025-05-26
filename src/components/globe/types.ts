
export interface GlobeProps {
  visitedCountries: string[];
  onCountrySelect?: (country: string) => void;
}

export interface LocationPinProps {
  position: [number, number, number];
  country: string;
  onSelect: (country: string) => void;
  isActive: boolean;
  globeRotation: THREE.Euler;
}

export interface RotatingGlobeProps {
  globeRef: React.RefObject<THREE.Group>;
}

export interface GlobeComponentProps extends GlobeProps {
  // No additional props needed
}
