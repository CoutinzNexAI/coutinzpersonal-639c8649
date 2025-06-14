
import React from 'react';
import Ballpit from './Ballpit';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10">
      {/* Ballpit Effect Section */}
      <div className="relative overflow-hidden h-[400px] md:h-[500px] w-full">
        <Ballpit
          count={150}
          gravity={0.7}
          friction={0.8}
          wallBounce={0.95}
          followCursor={true}
          colors={[0x8B5CF6, 0x0EA5E9, 0xD946EF, 0x4F46E5, 0x06B6D4]}
        />
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center z-10 bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h3 className="text-3xl md:text-4xl font-bold cosmic-gradient-text mb-4">
              Let's Connect
            </h3>
            <p className="text-gray-300 text-lg mb-6 max-w-md">
              Open to new opportunities and collaborations
            </p>
            
            {/* Social Links */}
            <div className="flex justify-center space-x-6">
              {['GitHub', 'LinkedIn', 'Twitter', 'Email'].map(platform => (
                <a 
                  key={platform}
                  href="#"
                  className="text-gray-300 hover:text-cosmic-blue transition-colors duration-300 transform hover:scale-110 pointer-events-auto"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="py-6 text-center bg-black/50">
        <p className="text-sm text-gray-500">
          © {currentYear} Diogo Coutinho — All Rights Reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
