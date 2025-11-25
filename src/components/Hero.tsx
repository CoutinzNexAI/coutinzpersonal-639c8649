
import React, { useEffect, useState } from 'react';
import ProfileCard from './ProfileCard';
import HeroBackground from './hero/HeroBackground';
import FloatingIcons from './hero/FloatingIcons';
import HeroContent from './hero/HeroContent';
import ScrollIndicator from './hero/ScrollIndicator';
import ScannerEffect from './hero/ScannerEffect';

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Main entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroBackground isLoaded={isLoaded} />
      <FloatingIcons />
      
      <div className="container mx-auto px-4 md:px-6 z-10 pt-24 sm:pt-28 md:pt-0">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-20 sm:gap-24 lg:gap-20">
          {/* Profile Card Section */}
          <div 
            className={`transition-all duration-1000 ${
              isLoaded 
                ? "opacity-100 translate-y-0 scale-100" 
                : "opacity-0 translate-y-24 scale-95"
            }`}
          >
            <ProfileCard
              name="Diogo Coutinho"
              title="AI Developer • Data Scientist"
              handle="DiogoCoutinho"
              status="Online"
              contactText="Contact Me"
                              avatarUrl="/8ab72e60-58e6-4264-81a1-fb33f8f1df20.png"
              showUserInfo={true}
              enableTilt={true}
              className="w-full max-w-md mx-auto" // Aumentado de max-w-sm para max-w-md
            />
          </div>

          {/* Content Section */}
          <HeroContent 
            isLoaded={isLoaded}
          />
        </div>
      </div>
      
      <ScrollIndicator 
        isLoaded={isLoaded}
      />
      
      <ScannerEffect isLoaded={isLoaded} />
    </section>
  );
};

export default Hero;
