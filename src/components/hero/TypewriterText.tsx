
import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  isLoaded: boolean;
  className?: string;
}

const TypewriterText = ({ text, isLoaded, className }: TypewriterTextProps) => {
  const [typedText, setTypedText] = useState('');
  
  useEffect(() => {
    if (!isLoaded) return;
    
    let index = 0;
    const timer = setInterval(() => {
      setTypedText(text.substring(0, index));
      index++;
      
      if (index > text.length) {
        clearInterval(timer);
      }
    }, 80);
    
    return () => clearInterval(timer);
  }, [isLoaded, text]);

  return (
    <div className={`h-[30px] md:h-[40px] mb-8 md:mb-10 flex items-center justify-center lg:justify-start ${className}`}>
      <p className="text-base md:text-xl lg:text-2xl text-gray-200 border-r-2 border-cosmic-blue animate-blink-caret overflow-hidden whitespace-nowrap font-medium tracking-wide">
        {typedText}
      </p>
    </div>
  );
};

export default TypewriterText;
