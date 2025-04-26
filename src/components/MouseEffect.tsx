
import React, { useEffect, useState } from 'react';

const MouseEffect = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };

    const updateTouchPosition = (e: TouchEvent) => {
      setPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    window.addEventListener('mousemove', updatePosition);
    window.addEventListener('touchmove', updateTouchPosition);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('touchmove', updateTouchPosition);
    };
  }, []);

  return (
    <>
      <div 
        className="fixed pointer-events-none z-50 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cosmic-blue/30 blur-sm transition-transform duration-200 ease-out"
        style={{ 
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
        }}
      />
      <div 
        className="fixed pointer-events-none z-50 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cosmic-blue transition-transform duration-200 ease-out"
        style={{ 
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
        }}
      />
    </>
  );
};

export default MouseEffect;
