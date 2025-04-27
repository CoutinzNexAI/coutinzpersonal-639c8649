
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const LeafletTest = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Leaflet Test</h2>
      <div style={{ height: '400px', width: '100%' }} className="rounded-lg overflow-hidden">
        <MapContainer
          center={[51.505, -0.09]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default LeafletTest;
