import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, CheckCircle, Instagram } from 'lucide-react';
import ReviewModal from './ReviewModal';

interface Review {
  id: number;
  image: string;
  text: string;
  author: string;
  location: string;
  rating: number;
  product: string;
}

// Reduzido para 4 reviews
const reviews: Review[] = [
  {
    id: 1,
    image: '/reviews/review1.jpg',
    text: 'Fiquei absolutamente impressionada! O meu cão ficou perfeito no estilo cartoon. A qualidade da caneca é excelente e chegou super rápido. Já encomendei mais!',
    author: 'Maria Silva',
    location: 'Lisboa',
    rating: 5,
    product: 'Caneca Personalizada'
  },
  {
    id: 2,
    image: '/reviews/review2.jpg',
    text: 'Transformaram a nossa foto de casamento num quadro incrível! Parece que saiu de um filme da Pixar. Todos os nossos amigos querem saber onde fizemos.',
    author: 'João & Ana',
    location: 'Porto',
    rating: 5,
    product: 'Canvas com Moldura'
  },
  {
    id: 3,
    image: '/reviews/review3.jpg',
    text: 'O poster do meu filho ficou fantástico! A transformação foi tão realista que parece mesmo um personagem de desenho animado. Serviço 5 estrelas!',
    author: 'Carla Santos',
    location: 'Braga',
    rating: 5,
    product: 'Poster A3'
  },
  {
    id: 4,
    image: '/reviews/review4.jpg',
    text: 'Adorei a capa do telemóvel! A minha foto ficou com um estilo super criativo. A qualidade de impressão é perfeita e chegou muito bem embalada.',
    author: 'Ricardo Costa',
    location: 'Aveiro',
    rating: 5,
    product: 'Capa de Telemóvel'
  }
];

export default function ReviewsSection() {
  const [currentReview, setCurrentReview] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality - increased to 6 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
    setIsAutoPlaying(false);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
    setIsAutoPlaying(false);
  };

  const goToReview = (index: number) => {
    setCurrentReview(index);
    setIsAutoPlaying(false);
  };

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-gradient-to-br from-ghibli-paper via-ghibli-cream to-ghibli-sand/30 relative overflow-hidden">
      {/* Ghibli-style background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-ghibli-moss/30 rounded-full mix-blend-multiply filter blur-2xl animate-float"></div>
        <div className="absolute top-20 right-16 w-48 h-48 bg-ghibli-sunflower/20 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-56 h-56 bg-ghibli-sky/30 rounded-full mix-blend-multiply filter blur-2xl animate-float animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header - Updated as requested */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold text-ghibli-wood mb-4 font-ghibli leading-tight">
            Outras Realidades Imaginadas,<br />
            <span className="text-ghibli-moss">Agora Visíveis</span>
          </h2>
          <p className="text-lg text-ghibli-earth max-w-2xl mx-auto font-medium">
            Descobre o que os nossos clientes dizem sobre as suas transformações mágicas
          </p>
        </div>

        {/* Reviews Layout - Mobile vs Desktop */}
        <div className="relative max-w-7xl mx-auto">
          {/* Mobile: Single review display */}
          <div className="lg:hidden">
            <div className="relative">
              <div className="flex justify-center">
                <div className="relative cursor-pointer">
                  <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-ghibli-moss shadow-ghibli-moss/30">
                    <div className="w-72 h-72 relative">
                      <img
                        src={reviews[currentReview].image}
                        alt={`Review de ${reviews[currentReview].author}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ghibli-wood/20 to-transparent"></div>
                    </div>
                    {/* Product tag */}
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light text-ghibli-paper px-3 py-1 rounded-full text-xs font-bold shadow-xl border-2 border-ghibli-paper">
                      {reviews[currentReview].product}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows - Mobile */}
              <button
                onClick={prevReview}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-ghibli-paper/95 backdrop-blur-sm rounded-full shadow-lg border-2 border-ghibli-moss/20 flex items-center justify-center hover:bg-ghibli-paper hover:scale-110 hover:border-ghibli-moss/40 transition-all duration-300 z-20"
              >
                <ChevronLeft className="w-5 h-5 text-ghibli-wood" />
              </button>
              <button
                onClick={nextReview}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-ghibli-paper/95 backdrop-blur-sm rounded-full shadow-lg border-2 border-ghibli-moss/20 flex items-center justify-center hover:bg-ghibli-paper hover:scale-110 hover:border-ghibli-moss/40 transition-all duration-300 z-20"
              >
                <ChevronRight className="w-5 h-5 text-ghibli-wood" />
              </button>
            </div>

            {/* Mobile Review Content - smaller and more discrete */}
            <div className="mt-6">
              <div className="bg-ghibli-paper/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border-2 border-ghibli-moss/10">
                <div className="text-center">
                  {/* Rating */}
                  <div className="flex justify-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-ghibli-sunflower fill-current"
                      />
                    ))}
                  </div>

                  {/* Review Text - smaller for mobile */}
                  <blockquote className="text-sm text-ghibli-wood/80 mb-4 leading-relaxed">
                    "{reviews[currentReview].text}"
                  </blockquote>

                  {/* Author Info - compact for mobile */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full flex items-center justify-center text-ghibli-paper font-bold text-xs border border-ghibli-paper shadow-lg">
                      {reviews[currentReview].author.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-ghibli-wood text-sm">{reviews[currentReview].author}</span>
                        <CheckCircle className="w-3 h-3 text-ghibli-leaf" />
                      </div>
                      <div className="text-xs text-ghibli-earth">{reviews[currentReview].location}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Grid of 4 review images */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-4 gap-4 mb-8">
              {reviews.map((review, index) => (
                <div 
                  key={review.id} 
                  className={`relative cursor-pointer transition-all duration-500 ${
                    index === currentReview 
                      ? 'scale-110 z-10 shadow-2xl' 
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => goToReview(index)}
                >
                  <div className={`rounded-2xl overflow-hidden shadow-xl border-4 transition-all duration-500 ${
                    index === currentReview 
                      ? 'border-ghibli-moss shadow-ghibli-moss/30' 
                      : 'border-ghibli-cream'
                  }`}>
                    {/* Fixed square format for all images */}
                    <div className="aspect-square w-full h-56 relative">
                      <img
                        src={review.image}
                        alt={`Review de ${review.author}`}
                        className="w-full h-full object-cover transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ghibli-wood/20 to-transparent"></div>
                    </div>
                    {/* Product tag */}
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light text-ghibli-paper px-3 py-1 rounded-full text-xs font-bold shadow-xl border-2 border-ghibli-paper">
                      {review.product}
                    </div>
                    {/* Selection indicator */}
                    {index === currentReview && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-ghibli-moss rounded-full border-4 border-ghibli-paper shadow-lg animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows - Desktop */}
            <button
              onClick={prevReview}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-ghibli-paper/95 backdrop-blur-sm rounded-full shadow-lg border-2 border-ghibli-moss/20 flex items-center justify-center hover:bg-ghibli-paper hover:scale-110 hover:border-ghibli-moss/40 transition-all duration-300 z-20"
            >
              <ChevronLeft className="w-6 h-6 text-ghibli-wood" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-ghibli-paper/95 backdrop-blur-sm rounded-full shadow-lg border-2 border-ghibli-moss/20 flex items-center justify-center hover:bg-ghibli-paper hover:scale-110 hover:border-ghibli-moss/40 transition-all duration-300 z-20"
            >
              <ChevronRight className="w-6 h-6 text-ghibli-wood" />
            </button>

            {/* Featured Review Content - Desktop only */}
            <div className="mt-8 max-w-4xl mx-auto">
              <div className="bg-ghibli-paper/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-ghibli-moss/10 transition-all duration-500">
                <div className="text-center">
                  {/* Rating */}
                  <div className="flex justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 text-ghibli-sunflower fill-current"
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <blockquote className="text-xl lg:text-2xl text-ghibli-wood/90 mb-6 leading-relaxed font-medium italic">
                    "{reviews[currentReview].text}"
                  </blockquote>

                  {/* Author Info */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full flex items-center justify-center text-ghibli-paper font-bold text-lg border-2 border-ghibli-paper shadow-lg">
                      {reviews[currentReview].author.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ghibli-wood text-lg">{reviews[currentReview].author}</span>
                        <CheckCircle className="w-4 h-4 text-ghibli-leaf" />
                      </div>
                      <div className="text-sm text-ghibli-earth">{reviews[currentReview].location} • Cliente Verificado</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-3 mt-8">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToReview(index)}
              className={`h-3 rounded-full transition-all duration-300 border-2 ${
                index === currentReview
                  ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light w-8 border-ghibli-moss'
                  : 'bg-ghibli-sand w-3 border-ghibli-sand hover:bg-ghibli-earth hover:border-ghibli-earth'
              }`}
            />
          ))}
        </div>

        {/* CTA Button - Updated as requested */}
        <div className="text-center mt-12">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-moss text-ghibli-paper px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-ghibli-paper"
          >
            📸 Partilha a tua experiência
          </button>
          <p className="text-sm text-ghibli-earth mt-3 font-medium">
            Partilha a tua experiência connosco!
          </p>
        </div>
      </div>

      {/* Review Modal */}
      {isModalOpen && (
        <ReviewModal onClose={() => setIsModalOpen(false)} />
      )}
    </section>
  );
} 