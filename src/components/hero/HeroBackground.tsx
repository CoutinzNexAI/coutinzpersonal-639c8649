
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  alpha: number;
  originalSize: number;
  pulse: number;
  pulsDirection: number;
}

interface HeroBackgroundProps {
  isLoaded: boolean;
}

const HeroBackground = ({ isLoaded }: HeroBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particles = createParticles();
    };
    
    window.addEventListener('resize', handleResize);
    canvas.width = width;
    canvas.height = height;
    
    const particleCount = Math.min(200, Math.floor(width * height / 8000));
    
    class ParticleClass implements Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      originalSize: number;
      pulse: number;
      pulsDirection: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.originalSize = Math.random() * 3 + 1;
        this.size = 0;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.alpha = 0;
        this.pulse = Math.random() * Math.PI * 2;
        this.pulsDirection = Math.random() * 0.02 + 0.01;
        
        const colors = ['#8B5CF6', '#0EA5E9', '#D946EF', '#4F46E5', '#06B6D4', '#F59E0B', '#10B981'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      update() {
        if (this.size < this.originalSize) {
          this.size += 0.05;
        }
        
        if (this.alpha < 0.8) {
          this.alpha += 0.01;
        }
        
        this.pulse += this.pulsDirection;
        const pulseFactor = Math.sin(this.pulse) * 0.5 + 0.5;
        
        this.x += this.speedX * (1 + pulseFactor * 0.5);
        this.y += this.speedY * (1 + pulseFactor * 0.5);
        
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }
      
      draw() {
        if (!ctx) return;
        const pulseFactor = Math.sin(this.pulse) * 0.3 + 0.7;
        const currentSize = this.size * pulseFactor;
        
        // Glow effect
        ctx.globalAlpha = this.alpha * 0.3;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Main particle
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
      }
    }
    
    let particles = createParticles();
    
    function createParticles() {
      const arr = [];
      for (let i = 0; i < particleCount; i++) {
        arr.push(new ParticleClass());
      }
      return arr;
    }
    
    function connectParticles() {
      if (!ctx) return;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const opacity = 0.4 - distance/120;
            
            // Create gradient line
            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
            gradient.addColorStop(1, `rgba(14, 165, 233, ${opacity})`);
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }
    
    function animate() {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      
      connectParticles();
      requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-60"
      />
      
      {/* Enhanced background effects - Mobile responsive */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
        <div className="absolute top-5 md:top-10 left-5 md:left-10 w-32 md:w-60 h-32 md:h-60 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 md:bottom-20 right-10 md:right-20 w-40 md:w-80 h-40 md:h-80 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-24 md:w-48 h-24 md:h-48 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 left-1/4 w-28 md:w-52 h-28 md:h-52 bg-gradient-to-br from-cyan-500/20 to-green-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
    </>
  );
};

export default HeroBackground;
