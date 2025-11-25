
import { ArrowDown } from 'lucide-react';

interface ScrollIndicatorProps {
  isLoaded: boolean;
}

const ScrollIndicator = ({ isLoaded }: ScrollIndicatorProps) => {
  return (
    <div 
      className={`absolute bottom-5 md:bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center transition-all duration-1000 ${
        isLoaded 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8"
      }`}
    >
      <div className="relative">
        <ArrowDown className="h-8 md:h-10 w-8 md:w-10 text-cosmic-blue animate-bounce drop-shadow-lg" />
        <div className="absolute inset-0 bg-cosmic-blue/30 rounded-full blur-lg animate-pulse"></div>
      </div>
      <span className="text-xs md:text-sm text-gray-400 mt-2 animate-pulse">Scroll to explore</span>
    </div>
  );
};

export default ScrollIndicator;
