import React, { useState } from 'react';
import { Map, Earth } from 'lucide-react';
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

  return (
    <section id="travel" className="section-padding bg-cosmic-black/50">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center">Travel Journal</h2>
        
        <div className="max-w-5xl mx-auto">
          {/* 3D Globe */}
          <div className="glass-panel p-6 mb-12">
            <Globe3D visitedCountries={locations.map(l => l.country)} />
          </div>
          
          {/* Travel tabs */}
          <div className="flex overflow-x-auto space-x-4 pb-4 mb-6">
            {locations.map(location => (
              <button
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
                    <h3 className="text-2xl md:text-3xl font-bold">{activeLocation.city}, {activeLocation.country}</h3>
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
                <h2 className="text-2xl font-bold mb-4">{activeLocation.city}, {activeLocation.country}</h2>
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
