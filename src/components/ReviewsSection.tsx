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
  },
  {
    id: 5,
    image: '/reviews/review5.jpg',
    text: 'Encomendei um caderno personalizado e superou todas as expectativas! A transformação da minha foto ficou incrível. Já fiz mais 3 encomendas!',
    author: 'Sofia Pereira',
    location: 'Coimbra',
    rating: 5,
    product: 'Caderno A5'
  }
];

export default function ReviewsSection() {
  const [currentReview, setCurrentReview] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 4000);

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
    <section className="py-16 lg:py-24 bg-gradient-to-br from-ghibli-paper via-ghibli-cream to-ghibli-sand/30 relative overflow-hidden">
      {/* Ghibli-style background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-64 h-64 bg-ghibli-moss/30 rounded-full mix-blend-multiply filter blur-2xl animate-float"></div>
        <div className="absolute top-20 right-16 w-48 h-48 bg-ghibli-sunflower/20 rounded-full mix-blend-multiply filter blur-xl animate-float animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-56 h-56 bg-ghibli-sky/30 rounded-full mix-blend-multiply filter blur-2xl animate-float animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header - Ghibli Style */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-ghibli-paper/80 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-ghibli-moss/20 mb-6 shadow-lg">
            <Star className="w-5 h-5 text-ghibli-sunflower fill-current" />
            <span className="text-sm font-medium text-ghibli-wood font-ghibli">Reviews dos Nossos Clientes</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-ghibli-wood mb-4 font-ghibli">
            Transformações que <span className="text-ghibli-moss">Encantam</span>
          </h2>
          <p className="text-lg text-ghibli-earth max-w-2xl mx-auto font-medium">
            Descobre o que os nossos clientes dizem sobre as suas transformações mágicas ✨
          </p>
        </div>

        {/* Reviews Carousel - Ghibli Style */}
        <div className="relative max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl">
            <div 
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentReview * 100}%)` }}
            >
              {reviews.map((review, index) => (
                <div key={review.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-ghibli-paper/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-ghibli-moss/10 hover:shadow-3xl hover:border-ghibli-moss/20 transition-all duration-500">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Review Image - MUITO MAIOR */}
                      <div className="relative group flex-shrink-0">
                        <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-ghibli-cream">
                          <img
                            src={review.image}
                            alt={`Review de ${review.author}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ghibli-wood/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        {/* Product tag - Ghibli style */}
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light text-ghibli-paper px-4 py-2 rounded-full text-sm font-bold shadow-xl border-2 border-ghibli-paper">
                          {review.product}
                        </div>
                      </div>

                      {/* Review Content - MENOR E MAIS COMPACTO */}
                      <div className="flex-1 text-center lg:text-left max-w-lg">
                        {/* Rating */}
                        <div className="flex justify-center lg:justify-start gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 text-ghibli-sunflower fill-current"
                            />
                          ))}
                        </div>

                        {/* Review Text - MENOR */}
                        <blockquote className="text-base lg:text-lg text-ghibli-wood/90 mb-6 leading-relaxed font-medium">
                          "{review.text}"
                        </blockquote>

                        {/* Author Info - COMPACTO */}
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full flex items-center justify-center text-ghibli-paper font-bold text-sm border-2 border-ghibli-paper shadow-lg">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ghibli-wood text-sm">{review.author}</span>
                              <CheckCircle className="w-3 h-3 text-ghibli-leaf" />
                            </div>
                            <div className="text-xs text-ghibli-earth">{review.location} • Cliente Verificado</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows - Ghibli Style */}
          <button
            onClick={prevReview}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-ghibli-paper/95 backdrop-blur-sm rounded-full shadow-lg border-2 border-ghibli-moss/20 flex items-center justify-center hover:bg-ghibli-paper hover:scale-110 hover:border-ghibli-moss/40 transition-all duration-300 z-10"
          >
            <ChevronLeft className="w-6 h-6 text-ghibli-wood" />
          </button>
          <button
            onClick={nextReview}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-ghibli-paper/95 backdrop-blur-sm rounded-full shadow-lg border-2 border-ghibli-moss/20 flex items-center justify-center hover:bg-ghibli-paper hover:scale-110 hover:border-ghibli-moss/40 transition-all duration-300 z-10"
          >
            <ChevronRight className="w-6 h-6 text-ghibli-wood" />
          </button>
        </div>

        {/* Dots Navigation - Ghibli Style */}
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

        {/* CTA Button - Ghibli Style */}
        <div className="text-center mt-12">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-moss text-ghibli-paper px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl border-2 border-ghibli-paper"
          >
            <Instagram className="w-5 h-5" />
            Deixar a Minha Review
          </button>
          <p className="text-sm text-ghibli-earth mt-3 font-medium">
            Partilha a tua experiência connosco! ✨
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