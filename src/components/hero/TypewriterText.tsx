
import React from 'react';

interface TypewriterTextProps {
  text: string;
  isLoaded: boolean;
}

const TypewriterText = ({ text, isLoaded }: TypewriterTextProps) => {
  return (
    <div 
      className={`mb-6 md:mb-8 transition-all duration-500 ${
        isLoaded 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8"
      }`}
    >
      <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-cosmic-blue mb-2">
        {text}
        <span className="animate-blink-caret border-r-2 border-cosmic-blue ml-1"></span>
      </h2>
    </div>
  );
};

export default TypewriterText;
