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
    <section className="py-16 lg:py-24 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 mb-4">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-medium text-purple-700">Reviews dos Nossos Clientes</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Mais de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">10.000</span> Clientes Satisfeitos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descobre o que os nossos clientes dizem sobre as suas transformações mágicas
          </p>
        </div>

        {/* Reviews Carousel */}
        <div className="relative max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl">
            <div 
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentReview * 100}%)` }}
            >
              {reviews.map((review, index) => (
                <div key={review.id} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Review Image */}
                      <div className="relative group">
                        <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl overflow-hidden shadow-xl">
                          <img
                            src={review.image}
                            alt={`Review de ${review.author}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        {/* Product tag */}
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                          {review.product}
                        </div>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1 text-center lg:text-left">
                        {/* Rating */}
                        <div className="flex justify-center lg:justify-start gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-5 h-5 text-yellow-500 fill-current"
                            />
                          ))}
                        </div>

                        {/* Review Text */}
                        <blockquote className="text-lg lg:text-xl text-gray-700 mb-6 leading-relaxed">
                          "{review.text}"
                        </blockquote>

                        {/* Author Info */}
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{review.author}</span>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="text-sm text-gray-500">{review.location} • Cliente Verificado</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevReview}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={nextReview}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 z-10"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-3 mt-8">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToReview(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentReview
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            <Instagram className="w-5 h-5" />
            Deixar a Minha Review
          </button>
          <p className="text-sm text-gray-500 mt-3">
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