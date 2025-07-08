import React, { useEffect } from 'react';
import { X, Instagram, Heart, Camera, Sparkles } from 'lucide-react';

interface ReviewModalProps {
  onClose: () => void;
}

export default function ReviewModal({ onClose }: ReviewModalProps) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleInstagramClick = () => {
    window.open('https://instagram.com/pictuz.ai', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg">
        {/* Floating decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-pink-400 rounded-full opacity-70 animate-bounce" />
        <div className="absolute -top-2 -right-6 w-6 h-6 bg-purple-400 rounded-full opacity-50 animate-bounce animation-delay-1000" />
        <div className="absolute -bottom-6 -left-2 w-10 h-10 bg-yellow-400 rounded-full opacity-60 animate-bounce animation-delay-2000" />
        
        {/* Main Modal Content */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/30 relative overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 via-pink-50/50 to-yellow-100/50" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-gray-100/80 rounded-full flex items-center justify-center hover:bg-gray-200/80 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Content */}
          <div className="relative z-10">
            {/* Header with animated sparkles */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-xl">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 animate-spin" />
                <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-pink-500 animate-pulse" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Partilha a Tua Experiência! ✨
              </h3>
              <p className="text-gray-600">
                Adorámos saber que gostaste do nosso trabalho!
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-white/60 rounded-2xl p-6 mb-6 border border-white/40">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Como deixar a tua review:
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-gray-700 text-sm">
                    <strong>Tira uma foto</strong> do teu produto PicTuz em ação!
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-gray-700 text-sm">
                    <strong>Envia por DM</strong> no nosso Instagram com a tua opinião
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-gray-700 text-sm">
                    <strong>Apareçe aqui!</strong> As melhores reviews ficam na nossa galeria
                  </p>
                </div>
              </div>
            </div>

            {/* Instagram CTA */}
            <div className="text-center">
              <button
                onClick={handleInstagramClick}
                className="relative group w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="relative flex items-center justify-center gap-3">
                  <Instagram className="w-6 h-6" />
                  <span>Abrir Instagram @pictuz.ai</span>
                </div>
              </button>
              
              <p className="text-xs text-gray-500 mt-3">
                Ao clicar, vais ser redirecionado para o Instagram
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 