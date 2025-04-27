
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface WorldMapProps {
  visitedCountries: string[];
}

const WorldMap: React.FC<WorldMapProps> = ({ visitedCountries }) => {
  // The key issue was related to how MapContainer was used
  // Using a render function approach to ensure proper context handling
  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden">
      <div style={{ height: '100%', width: '100%' }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
      </div>
      <div className="mt-4 glass-panel p-4">
        <h3 className="text-xl font-bold mb-2">Visited Countries</h3>
        <div className="flex flex-wrap gap-2">
          {visitedCountries.map((country) => (
            <span
              key={country}
              className="px-3 py-1 bg-cosmic-blue/20 text-cosmic-blue rounded-full text-sm"
            >
              {country}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
