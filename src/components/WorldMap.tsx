import React from 'react';
import { Map, Earth } from 'lucide-react';

type Country = {
  name: string;
  visited: boolean;
  code: string;
};

const countries: Country[] = [
  { name: "Japan", visited: true, code: "JP" },
  { name: "Italy", visited: true, code: "IT" },
  { name: "Peru", visited: true, code: "PE" },
  { name: "France", visited: false, code: "FR" },
  { name: "Germany", visited: false, code: "DE" },
  { name: "United States", visited: true, code: "US" },
  { name: "Australia", visited: false, code: "AU" },
  { name: "Brazil", visited: false, code: "BR" },
  { name: "Canada", visited: true, code: "CA" },
  { name: "China", visited: false, code: "CN" },
  { name: "India", visited: false, code: "IN" },
];

const WorldMap = () => {
  return (
    <div className="w-full relative">
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Earth className="text-cosmic-blue" />
            <h3 className="text-xl font-bold">World Travels</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-cosmic-purple rounded-full"></span>
              <span className="text-sm">Visited</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-gray-600 rounded-full"></span>
              <span className="text-sm">To Visit</span>
            </div>
          </div>
        </div>
        
        <div className="w-full aspect-[2/1] relative bg-cosmic-black/20 rounded-lg overflow-hidden">
          <svg 
            viewBox="0 0 1000 500" 
            className="w-full h-full"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Simple world map with highlighted countries */}
            <path d="M200,100 L300,150 L400,100 L500,150 L600,100 L700,150 L800,100" 
                  stroke="#333" strokeWidth="1" fill="none" />
            
            {/* US */}
            <path d="M150,120 L250,120 L250,150 L150,150 Z" 
                  fill="#8B5CF6" stroke="#444" strokeWidth="0.5" />
            
            {/* Canada */}
            <path d="M150,80 L250,80 L250,110 L150,110 Z" 
                  fill="#8B5CF6" stroke="#444" strokeWidth="0.5" />
            
            {/* Japan */}
            <path d="M800,150 L820,150 L820,170 L800,170 Z" 
                  fill="#8B5CF6" stroke="#444" strokeWidth="0.5" />
            
            {/* Italy */}
            <path d="M500,130 L510,130 L510,140 L500,140 Z" 
                  fill="#8B5CF6" stroke="#444" strokeWidth="0.5" />
            
            {/* Peru */}
            <path d="M230,230 L250,230 L250,250 L230,250 Z" 
                  fill="#8B5CF6" stroke="#444" strokeWidth="0.5" />
            
            {/* Other countries - outlines only */}
            <path d="M500,80 L600,80 L600,120 L500,120 Z" 
                  fill="#222" stroke="#444" strokeWidth="0.5" />
            <path d="M400,200 L450,200 L450,250 L400,250 Z" 
                  fill="#222" stroke="#444" strokeWidth="0.5" />
            <path d="M700,250 L750,250 L750,300 L700,300 Z" 
                  fill="#222" stroke="#444" strokeWidth="0.5" />
                  
            {/* Animated pulse on visited countries */}
            <circle cx="200" cy="135" r="10" fill="#8B5CF6" opacity="0.3">
              <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="805" cy="160" r="8" fill="#8B5CF6" opacity="0.3">
              <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="505" cy="135" r="6" fill="#8B5CF6" opacity="0.3">
              <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </svg>
          
          <div className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-md">
            <span className="text-xs text-gray-300">Simple visualization - 5 countries visited</span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
          {countries.map((country) => (
            <div 
              key={country.code} 
              className={`p-2 rounded-md text-sm flex items-center gap-2 ${
                country.visited ? 'bg-cosmic-purple/20' : 'bg-gray-800'
              }`}
            >
              <span 
                className={`w-2 h-2 rounded-full ${
                  country.visited ? 'bg-cosmic-purple' : 'bg-gray-600'
                }`}
              />
              {country.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
