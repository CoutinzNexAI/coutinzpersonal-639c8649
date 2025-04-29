import React, { useState, useCallback, useEffect } from 'react';
import { Map, Earth, Globe } from 'lucide-react';
import Globe3D from './Globe3D';
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";

type Location = {
  id: number;
  country: string;
  city: string;
  description: string;
  date: string;
  image: string;
  highlights: string[];
};

const locations: Location[] = [
  {
    id: 1,
    country: "Japan",
    city: "Tokyo",
    description: "Explored the vibrant streets of Tokyo, from the traditional temples to the futuristic Akihabara district. Experienced the perfect blend of tradition and innovation.",
    date: "May 2022",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000",
    highlights: ["Visited Senso-ji Temple", "Explored Akihabara", "Tried authentic ramen"]
  },
  {
    id: 2,
    country: "Italy",
    city: "Rome",
    description: "Walked through ancient history in the streets of Rome. From the Colosseum to the Vatican, every corner had a story to tell.",
    date: "September 2021",
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1000",
    highlights: ["Toured the Colosseum", "Visited the Vatican", "Threw a coin in the Trevi Fountain"]
  },
  {
    id: 3,
    country: "Peru",
    city: "Cusco & Machu Picchu",
    description: "Hiked through the Andes to reach the ancient Incan city of Machu Picchu. Experienced the rich culture and history of the Sacred Valley.",
    date: "July 2023",
    image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=1000",
    highlights: ["Hiked the Inca Trail", "Explored Cusco", "Visited Sacred Valley"]
  },
];

const Travel = () => {
  const [activeLocation, setActiveLocation] = useState(locations[0]);
  const [isGlobeVisible, setIsGlobeVisible] = useState(true);

  const visitedCountries = locations.map(location => location.country);
  
  // Encontrar a localização pelo nome do país
  const findLocationByCountry = useCallback((country: string) => {
    const location = locations.find(loc => loc.country === country);
    if (location) {
      setActiveLocation(location);
    }
  }, []);
  
  // Manipulador para quando um país é selecionado no globo
  const handleCountrySelect = useCallback((country: string) => {
    findLocationByCountry(country);
  }, [findLocationByCountry]);
  
  // Atualizar o scroll quando uma localização é selecionada
  useEffect(() => {
    if (!isGlobeVisible) {
      const element = document.getElementById(`location-${activeLocation.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLocation, isGlobeVisible]);

  return (
    <section id="travel" className="section-padding bg-cosmic-black/50">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Travel Journal</h2>
        
        <div className="max-w-5xl mx-auto">
          {/* Botões de visualização */}
          <div className="flex justify-center mb-6 space-x-4">
            <button
              onClick={() => setIsGlobeVisible(true)}
              className={`flex items-center px-4 py-2 rounded-full transition-all ${
                isGlobeVisible 
                  ? 'bg-cosmic-blue text-white' 
                  : 'bg-cosmic-black/30 text-gray-400 hover:text-white'
              }`}
            >
              <Globe size={18} className="mr-2" />
              Mapa Global
            </button>
            <button
              onClick={() => setIsGlobeVisible(false)}
              className={`flex items-center px-4 py-2 rounded-full transition-all ${
                !isGlobeVisible 
                  ? 'bg-cosmic-blue text-white' 
                  : 'bg-cosmic-black/30 text-gray-400 hover:text-white'
              }`}
            >
              <Map size={18} className="mr-2" />
              Lista de Viagens
            </button>
          </div>
          
          {/* 3D Globe */}
          {isGlobeVisible && (
            <div className="glass-panel p-6 mb-12 animate-fade-in">
              <div className="text-center mb-4">
                <h3 className="text-xl text-cosmic-blue font-semibold mb-2">Destinos Visitados</h3>
                <p className="text-gray-300">Clique nos pins de localização para ver detalhes de cada país.</p>
              </div>
              
              <Globe3D 
                visitedCountries={visitedCountries} 
                onCountrySelect={handleCountrySelect}
              />
              
              <div className="mt-6 grid grid-cols-3 gap-2">
                {locations.map(location => (
                  <button
                    key={location.id}
                    onClick={() => setActiveLocation(location)}
                    className={`p-2 text-center text-sm rounded hover:bg-cosmic-blue/20 transition-all ${
                      activeLocation.id === location.id 
                        ? 'border border-cosmic-blue bg-cosmic-blue/10 text-white' 
                        : 'text-gray-400'
                    }`}
                  >
                    {location.country}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Travel tabs - apenas mostrado quando o globo não está visível */}
          {!isGlobeVisible && (
            <div className="flex overflow-x-auto space-x-4 pb-4 mb-6 animate-fade-in">
              {locations.map(location => (
                <button
                  id={`location-${location.id}`}
                  key={location.id}
                  onClick={() => setActiveLocation(location)}
                  className={`px-5 py-3 whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    activeLocation.id === location.id
                      ? 'bg-cosmic-blue text-white rounded-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {location.country} - {location.city}
                </button>
              ))}
            </div>
          )}
          
          {/* Selected location details */}
          <Dialog>
            <DialogTrigger asChild>
              <div className="glass-panel overflow-hidden rounded-xl animate-fade-in cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cosmic-blue/20">
                <div className="h-64 md:h-80 relative">
                  <img 
                    src={activeLocation.image} 
                    alt={`${activeLocation.city}, ${activeLocation.country}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cosmic-black to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-2xl md:text-3xl font-bold flex items-center">
                      <span className="mr-2 text-xl">📍</span>
                      {activeLocation.city}, {activeLocation.country}
                    </h3>
                    <p className="text-gray-300">{activeLocation.date}</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-300 mb-6">{activeLocation.description}</p>
                  
                  <div>
                    <h4 className="font-bold mb-2 flex items-center">
                      <Map size={16} className="mr-2 text-cosmic-purple" />
                      Highlights
                    </h4>
                    <ul className="space-y-2">
                      {activeLocation.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-center">
                          <span className="h-2 w-2 rounded-full bg-cosmic-purple mr-2"></span>
                          <span className="text-gray-400">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-cosmic-black/95 border-cosmic-blue">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className="mr-2 text-2xl">📍</span>
                  {activeLocation.city}, {activeLocation.country}
                </h2>
                <img 
                  src={activeLocation.image} 
                  alt={`${activeLocation.city}, ${activeLocation.country}`}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <p className="text-gray-300">{activeLocation.description}</p>
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Highlights</h3>
                  <ul className="space-y-2">
                    {activeLocation.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-cosmic-blue mr-2"></span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default Travel;
