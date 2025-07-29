
import React, { useEffect, useState } from 'react';
import ProfileCard from './ProfileCard';
import HeroBackground from './hero/HeroBackground';
import FloatingIcons from './hero/FloatingIcons';
import HeroContent from './hero/HeroContent';
import ScrollIndicator from './hero/ScrollIndicator';
import ScannerEffect from './hero/ScannerEffect';

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = "";
  
  // Typing effect
  useEffect(() => {
    if (!isLoaded) return;
    
    let index = 0;
    const timer = setInterval(() => {
      setTypedText(fullText.substring(0, index));
      index++;
      
      if (index > fullText.length) {
        clearInterval(timer);
      }
    }, 50); // Reduzido de 80ms para 50ms
    
    return () => clearInterval(timer);
  }, [isLoaded]);
  
  // Main entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200); // Reduzido de 500ms para 200ms
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroBackground isLoaded={isLoaded} />
      <FloatingIcons />
      
      <div className="container mx-auto px-4 md:px-6 z-10">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
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
              avatarUrl="/lovable-uploads/8ab72e60-58e6-4264-81a1-fb33f8f1df20.png"
              showUserInfo={true}
              enableTilt={true}
              className="w-full max-w-md mx-auto" // Aumentado de max-w-sm para max-w-md
            />
          </div>

          {/* Content Section */}
          <HeroContent 
            isLoaded={isLoaded}
            typedText={typedText}
            fullText={fullText}
          />
        </div>
      </div>
      
      <ScrollIndicator 
        isLoaded={isLoaded}
        typedText={typedText}
        fullText={fullText}
      />
      
      <ScannerEffect isLoaded={isLoaded} />
    </section>
  );
};

export default Hero;
