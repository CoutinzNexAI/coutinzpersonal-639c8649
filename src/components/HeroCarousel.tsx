import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  ctaStyle: 'primary' | 'secondary' | 'accent';
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: '/hero-carousel/slide-1.svg',
    title: 'Transforme Memórias em Arte',
    subtitle: 'Canvas personalizados com suas fotos favoritas',
    ctaText: 'Criar Canvas',
    ctaLink: '/shop/canvas',
    ctaStyle: 'primary'
  },
  {
    id: 2,
    image: '/hero-carousel/slide-2.svg',
    title: 'Loja Completa PicTuz',
    subtitle: 'Canecas, Capas, Canvas, Posters e muito mais',
    ctaText: 'Explorar Loja',
    ctaLink: '/shop',
    ctaStyle: 'secondary'
  },
  {
    id: 3,
    image: '/hero-carousel/slide-3.svg',
    title: 'MEGA PROMOÇÃO!',
    subtitle: '30% de desconto em todos os produtos',
    ctaText: 'Aproveitar Oferta',
    ctaLink: '/shop',
    ctaStyle: 'accent'
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate every 7 seconds
  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
      }, 7000);

      return () => clearInterval(interval);
    }
  }, [isHovered]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const currentSlideData = heroSlides[currentSlide];

  const getCtaButtonStyles = (style: 'primary' | 'secondary' | 'accent') => {
    const baseStyles = "px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl";
    
    switch (style) {
      case 'primary':
        return `${baseStyles} bg-white text-purple-600 hover:bg-purple-50`;
      case 'secondary':
        return `${baseStyles} bg-white text-green-600 hover:bg-green-50`;
      case 'accent':
        return `${baseStyles} bg-yellow-400 text-red-600 hover:bg-yellow-300 animate-pulse`;
      default:
        return `${baseStyles} bg-white text-gray-800 hover:bg-gray-100`;
    }
  };

  return (
    <div 
      className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-2xl shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Images */}
      <div className="relative w-full h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide 
                ? 'opacity-100 transform scale-100' 
                : 'opacity-0 transform scale-110'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 
            key={`title-${currentSlide}`}
            className="text-4xl md:text-6xl font-bold mb-4 animate-fadeInUp"
          >
            {currentSlideData.title}
          </h1>
          <p 
            key={`subtitle-${currentSlide}`}
            className="text-xl md:text-2xl mb-8 opacity-90 animate-fadeInUp animation-delay-200"
          >
            {currentSlideData.subtitle}
          </p>
          <a
            href={currentSlideData.ctaLink}
            className={getCtaButtonStyles(currentSlideData.ctaStyle)}
          >
            {currentSlideData.ctaText}
          </a>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
        aria-label="Slide anterior"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
        aria-label="Próximo slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-20">
        <div 
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{
            width: isHovered ? '0%' : `${((currentSlide + 1) / heroSlides.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
} 