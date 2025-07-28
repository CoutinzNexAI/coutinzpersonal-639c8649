import React, { useEffect, useRef } from 'react';

const MouseEffect = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const isPointerRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Don't show on mobile devices for better performance
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return;

    const updatePosition = (e: MouseEvent) => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const x = e.clientX;
        const y = e.clientY;
        const target = e.target as HTMLElement;
        const isPointer = window.getComputedStyle(target).cursor === 'pointer';
        
        if (cursorRef.current) {
          const scale = isPointer ? 1.5 : 1;
          cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        }
        
        if (cursorDotRef.current) {
          const scale = isPointer ? 1.5 : 1;
          cursorDotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
        }
        
        isPointerRef.current = isPointer;
      });
    };

    // Small delay to not show cursor during initial page load
    const timer = setTimeout(() => {
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
      if (cursorDotRef.current) {
        cursorDotRef.current.style.opacity = '1';
      }
    }, 1000);

    window.addEventListener('mousemove', updatePosition, { passive: true });

    return () => {
      clearTimeout(timer);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('mousemove', updatePosition);
    };
  }, []);

  return (
    <>
      <div 
        ref={cursorRef}
        className="fixed pointer-events-none z-50 h-7 w-7 rounded-full bg-cosmic-blue/20 blur-sm will-change-transform"
        style={{ 
          opacity: 0,
          transition: 'transform 0.1s ease-out, opacity 0.3s ease',
        }}
      />
      <div 
        ref={cursorDotRef}
        className="fixed pointer-events-none z-50 h-2 w-2 rounded-full bg-cosmic-blue will-change-transform"
        style={{ 
          opacity: 0,
          transition: 'transform 0.1s ease-out, opacity 0.3s ease',
        }}
      />
    </>
  );
};

export default MouseEffect;
