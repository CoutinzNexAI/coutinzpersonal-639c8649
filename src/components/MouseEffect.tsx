import React, { useEffect, useState } from 'react';

const MouseEffect = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Pequeno atraso para não mostrar o cursor no carregamento inicial da página
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

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
      clearTimeout(timer);
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('touchmove', updateTouchPosition);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="fixed pointer-events-none z-50 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cosmic-blue/20 blur-sm will-change-transform"
        style={{ 
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
          transition: 'transform 0.1s ease-out',
        }}
      />
      <div 
        className="fixed pointer-events-none z-50 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cosmic-blue will-change-transform"
        style={{ 
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
          transition: 'transform 0.1s ease-out',
        }}
      />
    </>
  );
};

export default MouseEffect;
