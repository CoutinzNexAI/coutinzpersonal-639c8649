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
      
      {/* Modal with ghibli theme - smaller size */}
      <div className="relative w-full max-w-md">
        {/* Floating decorative elements - smaller */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-ghibli-sunflower rounded-full opacity-70 animate-float" />
        <div className="absolute -top-1 -right-4 w-4 h-4 bg-ghibli-moss rounded-full opacity-50 animate-float animation-delay-1000" />
        <div className="absolute -bottom-4 -left-1 w-7 h-7 bg-ghibli-leaf rounded-full opacity-60 animate-float animation-delay-2000" />
        
        {/* Main Modal Content - compact */}
        <div className="bg-ghibli-paper/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl border-2 border-ghibli-moss/20 relative overflow-hidden max-h-[85vh]">
          {/* Background gradient overlay - ghibli style */}
          <div className="absolute inset-0 bg-gradient-to-br from-ghibli-cream/30 via-ghibli-sand/20 to-ghibli-moss/10" />
          
          {/* Close button - smaller */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-ghibli-cream/80 border border-ghibli-moss/20 rounded-full flex items-center justify-center hover:bg-ghibli-cream hover:border-ghibli-moss/40 transition-all duration-300 z-10"
          >
            <X className="w-4 h-4 text-ghibli-wood" />
          </button>

          {/* Scrollable content */}
          <div className="relative z-10 overflow-y-auto max-h-[75vh]">
            {/* Header with ghibli styling - compact */}
            <div className="text-center mb-4">
              <div className="relative inline-block">
                <div className="w-14 h-14 bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-leaf rounded-xl flex items-center justify-center mb-3 mx-auto shadow-lg border border-ghibli-paper">
                  <Camera className="w-7 h-7 text-ghibli-paper" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-ghibli-sunflower animate-spin" />
                <Sparkles className="absolute -bottom-1 -left-1 w-3 h-3 text-ghibli-leaf animate-pulse" />
              </div>
              
              <h3 className="text-lg font-bold text-ghibli-wood mb-1 font-ghibli">
                📸 Partilha a Tua Experiência!
              </h3>
              <p className="text-sm text-ghibli-earth">
                Adorámos saber a tua opinião sobre o nosso trabalho
              </p>
            </div>

            {/* Discount highlight - compact */}
            <div className="bg-gradient-to-r from-ghibli-sunflower/20 to-ghibli-moss/20 rounded-xl p-3 mb-4 border border-ghibli-sunflower/30">
              <div className="flex items-center gap-2 justify-center">
                <Gift className="w-4 h-4 text-ghibli-moss" />
                <span className="font-semibold text-ghibli-wood text-sm">
                  🎁 Partilha e ganha descontos exclusivos!
                </span>
              </div>
              <p className="text-xs text-ghibli-earth text-center mt-1">
                Reviews partilhadas podem ser premiadas com ofertas especiais
              </p>
            </div>

            {/* Instructions with ghibli theme - compact */}
            <div className="bg-ghibli-cream/60 rounded-xl p-4 mb-4 border border-ghibli-moss/20">
              <h4 className="font-semibold text-ghibli-wood mb-3 flex items-center gap-2 font-ghibli text-sm">
                <Heart className="w-4 h-4 text-ghibli-moss" />
                Como partilhar a tua experiência:
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-ghibli-moss to-ghibli-moss-light rounded-full flex items-center justify-center text-ghibli-paper text-xs font-bold flex-shrink-0 mt-0.5 border border-ghibli-paper">
                    1
                  </div>
                  <p className="text-ghibli-wood text-xs">
                    <strong>Tira uma foto</strong> do teu produto PicTuz em ação!
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-ghibli-moss-light to-ghibli-leaf rounded-full flex items-center justify-center text-ghibli-paper text-xs font-bold flex-shrink-0 mt-0.5 border border-ghibli-paper">
                    2
                  </div>
                  <p className="text-ghibli-wood text-xs">
                    <strong>Envia por DM</strong> no nosso Instagram com a tua opinião
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-ghibli-leaf to-ghibli-sunflower rounded-full flex items-center justify-center text-ghibli-paper text-xs font-bold flex-shrink-0 mt-0.5 border border-ghibli-paper">
                    3
                  </div>
                  <p className="text-ghibli-wood text-xs">
                    <strong>Apareçe aqui!</strong> As melhores reviews ficam na nossa galeria
                  </p>
                </div>
              </div>
            </div>

            {/* Instagram CTA with ghibli styling - compact */}
            <div className="text-center">
              <button
                onClick={handleInstagramClick}
                className="relative group w-full bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-leaf text-ghibli-paper px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:scale-105 transition-all duration-300 overflow-hidden border border-ghibli-paper"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ghibli-paper/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="relative flex items-center justify-center gap-2">
                  <Instagram className="w-4 h-4" />
                  <span>Abrir Instagram @pictuz.ai</span>
                </div>
              </button>
              
              <p className="text-xs text-ghibli-earth mt-2">
                Ao clicar, vais ser redirecionado para o Instagram
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 