import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface GalleryItem {
  id: string;
  image: string;
  name: string;
  category: string;
  url: string;
}

interface CircularGalleryProps {
  onProductSelect?: (product: GalleryItem) => void;
  autoRotationSpeed?: number;
  className?: string;
}

const PRODUCTS: GalleryItem[] = [
  { id: 'mug', image: '/circular-gallery/mug.png', name: 'Caneca Premium', category: 'mug', url: '/shop/mug' },
  { id: 'bag', image: '/circular-gallery/bag.png', name: 'Saco Personalizado', category: 'bag', url: '/shop/bag' },
  { id: 'canvas', image: '/circular-gallery/canvas.png', name: 'Tela Emoldurada', category: 'canvas', url: '/shop/canvas' },
  { id: 'poster', image: '/circular-gallery/poster.png', name: 'Poster Premium', category: 'poster', url: '/shop/poster' },
  { id: 'phone-case', image: '/circular-gallery/phone-case.png', name: 'Capa Telemóvel', category: 'roupa', url: '/shop/roupa' },
  { id: 'mousepad', image: '/circular-gallery/mousepad.png', name: 'Mousepad Gaming', category: 'escritorio', url: '/shop/escritorio' },
  { id: 'hoodie', image: '/circular-gallery/hoodie.png', name: 'Hoodie Jovem', category: 'roupa', url: '/shop/roupa' },
];

const CircularGallery: React.FC<CircularGalleryProps> = ({ 
  onProductSelect, 
  autoRotationSpeed = 0.5,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [lastDragPosition, setLastDragPosition] = useState(0);
  const [showListView, setShowListView] = useState(false);
  const animationRef = useRef<number>();
  const router = useRouter();

  // Scroll detection for list view
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowListView(scrollY > 100); // Show list after 100px scroll
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Continuous auto-rotation
  useEffect(() => {
    if (!isDragging && !isHovered) {
      const animate = () => {
        setRotation(prev => prev + autoRotationSpeed);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, isHovered, autoRotationSpeed]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(e.clientX);
    setLastDragPosition(e.clientX);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastDragPosition;
    // Only allow rightward movement (positive rotation)
    if (deltaX > 0) {
      setRotation(prev => prev + deltaX * 0.5);
    }
    setLastDragPosition(e.clientX);
  }, [isDragging, lastDragPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
    setLastDragPosition(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - lastDragPosition;
    // Only allow rightward movement (positive rotation)
    if (deltaX > 0) {
      setRotation(prev => prev + deltaX * 0.8);
    }
    setLastDragPosition(e.touches[0].clientX);
  }, [isDragging, lastDragPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Product click handler
  const handleProductClick = useCallback((product: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      router.push(product.url);
    }
  }, [onProductSelect, router]);

  // Global mouse event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const radius = 350;
  const itemAngle = 360 / PRODUCTS.length;

  return (
    <div className={`relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 ${className}`}>
      {/* Circular Gallery View */}
      <div className={`transition-transform duration-700 ${showListView ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        {/* Header */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 text-center">
          <h2 className="text-3xl md:text-6xl font-bold text-gray-800 mb-2">
            Galeria Interativa
          </h2>
          <p className="text-base md:text-xl text-gray-600">
            <span className="hidden md:inline">Arrasta para a direita • Clica para explorar</span>
            <span className="md:hidden">👆 Arrasta & Toca para descobrir</span>
          </p>
          <p className="text-sm text-purple-600 mt-2 font-medium">
            ⬇️ Scroll para ver todos os produtos
          </p>
        </div>

        {/* 3D Circular Gallery */}
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ perspective: '1200px' }}
        >
          <div 
            ref={galleryRef}
            className="relative"
            style={{
              transform: `rotateY(${rotation}deg)`,
              transformStyle: 'preserve-3d',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            {PRODUCTS.map((product, index) => {
              const angle = index * itemAngle;
              const x = Math.sin((angle * Math.PI) / 180) * radius;
              const z = Math.cos((angle * Math.PI) / 180) * radius;
              
              return (
                <div
                  key={product.id}
                  className="absolute group cursor-pointer"
                  style={{
                    transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${-angle}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                  onClick={(e) => handleProductClick(product, e)}
                >
                  {/* Product Card */}
                  <div className="relative w-44 h-60 md:w-56 md:h-72 bg-white rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 overflow-hidden">
                    {/* Product Image */}
                    <div className="relative w-full h-44 md:h-56 overflow-hidden rounded-t-2xl bg-gray-50">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 176px, 224px"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-white to-transparent">
                      <h3 className="text-xs md:text-base font-bold text-gray-800 mb-1 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600 capitalize">
                        {product.category}
                      </p>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
                      <div className="text-white bg-purple-600 px-3 py-2 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold">
                        Ver Produto
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-6 md:h-6 bg-purple-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 md:w-4 md:h-4 bg-pink-400 rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-6 md:bottom-8 left-4 right-4 z-20">
          <div className="flex justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 md:px-6 md:py-3 shadow-lg max-w-lg">
              <p className="text-xs md:text-sm text-gray-600 text-center">
                <span className="hidden md:inline">🖱️ Arrasta com o rato</span>
                <span className="md:hidden">👆 Arrasta com o dedo</span>
                {" • "}
                <span className="font-semibold">Apenas para a direita →</span>
                <br className="md:hidden" />
                <span className="text-xs md:text-sm text-purple-600 font-medium">
                  🎯 Toca nos produtos para explorar
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* List View */}
      <div className={`transition-all duration-700 ${showListView ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'} absolute inset-0 bg-white`}>
        <div className="container mx-auto px-4 py-8">
          {/* Back to Gallery Button */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Todos os Produtos
            </h2>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setShowListView(false);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              ↑ Voltar à Galeria
            </button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={(e) => handleProductClick(product, e as React.MouseEvent<HTMLDivElement>)}
              >
                <div className="relative h-48 md:h-56 overflow-hidden rounded-t-2xl bg-gray-50">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {product.category}
                  </p>
                  <div className="mt-3">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                      Ver Produto →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default CircularGallery;
export type { GalleryItem, CircularGalleryProps };
 