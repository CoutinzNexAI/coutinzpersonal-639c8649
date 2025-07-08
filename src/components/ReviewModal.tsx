import React, { useEffect } from 'react';
import { X, Instagram, Heart, Camera, Sparkles, Gift } from 'lucide-react';

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
      {/* Backdrop with ghibli colors */}
      <div 
        className="absolute inset-0 bg-ghibli-wood/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal with ghibli theme */}
      <div className="relative w-full max-w-lg">
        {/* Floating decorative elements - ghibli style */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-ghibli-sunflower rounded-full opacity-70 animate-float" />
        <div className="absolute -top-2 -right-6 w-6 h-6 bg-ghibli-moss rounded-full opacity-50 animate-float animation-delay-1000" />
        <div className="absolute -bottom-6 -left-2 w-10 h-10 bg-ghibli-leaf rounded-full opacity-60 animate-float animation-delay-2000" />
        
        {/* Main Modal Content */}
        <div className="bg-ghibli-paper/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border-2 border-ghibli-moss/20 relative overflow-hidden">
          {/* Background gradient overlay - ghibli style */}
          <div className="absolute inset-0 bg-gradient-to-br from-ghibli-cream/30 via-ghibli-sand/20 to-ghibli-moss/10" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-ghibli-cream/80 border-2 border-ghibli-moss/20 rounded-full flex items-center justify-center hover:bg-ghibli-cream hover:border-ghibli-moss/40 transition-all duration-300 z-10"
          >
            <X className="w-5 h-5 text-ghibli-wood" />
          </button>

          {/* Content */}
          <div className="relative z-10">
            {/* Header with ghibli styling */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-leaf rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-xl border-2 border-ghibli-paper">
                  <Camera className="w-10 h-10 text-ghibli-paper" />
                </div>
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-ghibli-sunflower animate-spin" />
                <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-ghibli-leaf animate-pulse" />
              </div>
              
              <h3 className="text-2xl font-bold text-ghibli-wood mb-2 font-ghibli">
                📸 Partilha a Tua Experiência!
              </h3>
              <p className="text-ghibli-earth">
                Adorámos saber que gostaste do nosso trabalho mágico!
              </p>
            </div>

            {/* Discount highlight */}
            <div className="bg-gradient-to-r from-ghibli-sunflower/20 to-ghibli-moss/20 rounded-2xl p-4 mb-6 border-2 border-ghibli-sunflower/30">
              <div className="flex items-center gap-3 justify-center">
                <Gift className="w-6 h-6 text-ghibli-moss" />
                <span className="font-bold text-ghibli-wood">
                  🎁 Partilha e ganha descontos exclusivos!
                </span>
              </div>
              <p className="text-sm text-ghibli-earth text-center mt-2">
                Reviews partilhadas podem ser premiadas com ofertas especiais
              </p>
            </div>

            {/* Instructions with ghibli theme */}
            <div className="bg-ghibli-cream/60 rounded-2xl p-6 mb-6 border-2 border-ghibli-moss/20">
              <h4 className="font-semibold text-ghibli-wood mb-4 flex items-center gap-2 font-ghibli">
                <Heart className="w-5 h-5 text-ghibli-moss" />
                Como partilhar a tua experiência:
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full flex items-center justify-center text-ghibli-paper text-sm font-bold flex-shrink-0 mt-0.5 border border-ghibli-paper">
                    1
                  </div>
                  <p className="text-ghibli-wood text-sm">
                    <strong>Tira uma foto</strong> do teu produto PicTuz em ação!
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-ghibli-moss-light to-ghibli-leaf rounded-full flex items-center justify-center text-ghibli-paper text-sm font-bold flex-shrink-0 mt-0.5 border border-ghibli-paper">
                    2
                  </div>
                  <p className="text-ghibli-wood text-sm">
                    <strong>Envia por DM</strong> no nosso Instagram com a tua opinião
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-ghibli-leaf to-ghibli-sunflower rounded-full flex items-center justify-center text-ghibli-paper text-sm font-bold flex-shrink-0 mt-0.5 border border-ghibli-paper">
                    3
                  </div>
                  <p className="text-ghibli-wood text-sm">
                    <strong>Apareçe aqui!</strong> As melhores reviews ficam na nossa galeria
                  </p>
                </div>
              </div>
            </div>

            {/* Instagram CTA with ghibli styling */}
            <div className="text-center">
              <button
                onClick={handleInstagramClick}
                className="relative group w-full bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-leaf text-ghibli-paper px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-ghibli-paper"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ghibli-paper/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="relative flex items-center justify-center gap-3">
                  <Instagram className="w-6 h-6" />
                  <span>Abrir Instagram @pictuz.ai</span>
                </div>
              </button>
              
              <p className="text-xs text-ghibli-earth mt-3">
                Ao clicar, vais ser redirecionado para o Instagram
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 