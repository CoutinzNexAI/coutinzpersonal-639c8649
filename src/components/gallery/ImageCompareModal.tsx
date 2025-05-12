import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';
import { Button } from '@/components/ui/button';

export interface GalleryItem {
  id: number;
  title: string;
  style: string;
  before: string;
  after: string;
}

interface ImageCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  initialIndex: number;
}

const ImageCompareModal: React.FC<ImageCompareModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const currentItem = items[currentIndex];
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Handle Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm pt-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
        
        {/* Fullscreen toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-16 text-white hover:bg-white/20 z-10"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize className="h-6 w-6" />
          ) : (
            <Maximize className="h-6 w-6" />
          )}
        </Button>
        
        {/* Previous button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        
        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20 z-10"
          onClick={goToNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
        
        {/* Main content */}
        <motion.div 
          className="w-[90vw] max-w-4xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Image info */}
          <div className="mb-4 text-white">
            <h2 className="text-2xl font-bold">{currentItem.title}</h2>
            <p className="text-white/70">Estilo: {currentItem.style}</p>
          </div>
          
          {/* Image comparison slider */}
          <div className="relative rounded-lg overflow-hidden shadow-2xl">
            <ReactCompareSlider
              itemOne={
                <ReactCompareSliderImage
                  src={currentItem.before}
                  alt="Imagem original"
                  className="w-full"
                />
              }
              itemTwo={
                <ReactCompareSliderImage
                  src={currentItem.after}
                  alt="Imagem transformada"
                  className="w-full"
                />
              }
              handle={
                <ReactCompareSliderHandle
                  buttonStyle={{
                    backdropFilter: 'blur(4px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    border: 0,
                    color: '#fff',
                  }}
                  linesStyle={{ color: '#fff', width: 2 }}
                />
              }
              style={{
                height: 'min(calc(100vw - 20vw), calc(100vh - 200px))',
                width: 'min(calc(100vw - 20vw), calc(100vh - 200px))',
                margin: '0 auto',
                aspectRatio: '1/1',
              }}
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex justify-between text-white">
                <span>Original</span>
                <span>Transformada</span>
              </div>
              <p className="text-white/70 text-sm mt-1 text-center">
                Arraste o slider para comparar as imagens
              </p>
            </div>
          </div>
          
          {/* Navigation indicator */}
          <div className="mt-4 flex justify-center gap-1">
            {items.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageCompareModal; 