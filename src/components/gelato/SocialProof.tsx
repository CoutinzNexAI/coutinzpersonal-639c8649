import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Image from 'next/image';

interface SocialProofProps {
  className?: string;
}

const SocialProof: React.FC<SocialProofProps> = ({ className = '' }) => {
  // TODO: Adicionar testimonials reais aqui
  // Estrutura para testimonials reais com fotos:
  /*
  const testimonials = [
    {
      name: "Nome Real do Cliente",
      rating: 5,
      comment: "Comentário real do cliente sobre o produto...",
      product: "Produto comprado",
      verified: true,
      photo: "/testimonials/cliente1.jpg", // Foto real do cliente ou produto
      date: "2024-01-15"
    },
    // Adicionar mais testimonials reais aqui...
  ];
  */
  
  interface Testimonial {
    name: string;
    rating: number;
    comment: string;
    product: string;
    verified: boolean;
    photo?: string;
    date?: string;
  }

  interface Stat {
    value: string;
    label: string;
  }

  const testimonials: Testimonial[] = []; // Array vazio até adicionar testimonials reais

  // Removi as estatísticas falsas - adicionar dados reais quando disponíveis
  const stats: Stat[] = [];

  return (
    <div className={`${className}`}>
      {/* TODO: Descomentar quando tiver estatísticas reais */}
      {stats.length > 0 && (
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-white/60 rounded-xl border border-ghibli-sand/20">
              <div className="text-2xl sm:text-3xl font-bold text-ghibli-wood mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-ghibli-earth">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* TODO: Descomentar e adicionar testimonials reais */}
      {testimonials.length > 0 && (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-ghibli-wood mb-4 text-center">
            ⭐ O que dizem os nossos clientes
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-xl p-4 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                {/* TODO: Adicionar foto do cliente/produto */}
                {testimonial.photo && (
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-3 relative">
                    <Image
                      src={testimonial.photo} 
                      alt={`Foto de ${testimonial.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                {/* Stars */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Comment */}
                <p className="text-sm text-ghibli-earth mb-3 leading-relaxed">
                  "{testimonial.comment}"
                </p>
                
                {/* Customer info */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ghibli-wood">
                        {testimonial.name}
                      </span>
                      {testimonial.verified && (
                        <span className="text-green-500 text-xs">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-ghibli-earth/70">
                      {testimonial.product}
                    </div>
                    {testimonial.date && (
                      <div className="text-xs text-ghibli-earth/50">
                        {testimonial.date}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Security badges */}
      <motion.div 
        className="mt-8 flex flex-wrap items-center justify-center gap-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-center gap-2 text-sm text-ghibli-earth">
          <span className="text-blue-500">🔒</span>
          <span>Pagamento seguro</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-ghibli-earth">
          <span className="text-green-500">🚚</span>
          <span>Envio protegido</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-ghibli-earth">
          <span className="text-purple-500">💎</span>
          <span>Garantia qualidade</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-ghibli-earth">
          <span className="text-orange-500">📞</span>
          <span>Suporte 24/7</span>
        </div>
      </motion.div>
    </div>
  );
};

export default SocialProof; 