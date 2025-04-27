
import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface WorldMapProps {
  visitedCountries: string[];
}

const WorldMap: React.FC<WorldMapProps> = ({ visitedCountries }) => {
  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
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
