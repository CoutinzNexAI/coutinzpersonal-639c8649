import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Code, 
  Zap, 
  Users, 
  ShoppingCart, 
  Palette, 
  Brain, 
  TrendingUp, 
  ExternalLink,
  Rocket,
  Database,
  Cpu,
  Globe,
  CreditCard,
  BarChart3,
  Shield,
  Layers,
  Star,
  Clock,
  Target
} from 'lucide-react';

interface PictuzShowcaseProps {
  className?: string;
}

const PictuzShowcase: React.FC<PictuzShowcaseProps> = ({ className }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false); // Começa pausado
  const [isVisible, setIsVisible] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para detectar visibilidade
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
        setIsAutoPlaying(entry.isIntersecting); // Só ativa autoplay quando visível
      },
      {
        threshold: 0.3, // Considera visível quando 30% do componente estiver na tela
        rootMargin: '0px 0px -50px 0px' // Pequena margem para não ativar muito cedo
      }
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, []);

  // Auto-play functionality - só funciona quando visível
  useEffect(() => {
    if (!isAutoPlaying || !api || !isVisible) return;
    
    const interval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % 5;
      setCurrentSlide(nextSlide);
      api.scrollTo(nextSlide);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, api, currentSlide, isVisible]);

  // Sync carousel with currentSlide changes
  useEffect(() => {
    if (!api) return;
    
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  const slideData = [
         {
       id: 'overview',
       title: 'PICTUZ',
               subtitle: 'Turn Your Photos Into Art, Then Into Products! 🎨 Built with Visual Studio Code',
       description: '',
       icon: <Sparkles className="w-12 h-12" />,
       gradient: 'from-purple-600 via-pink-600 to-red-600',
       demo: [
         { step: 1, label: 'Your Photo', image: '/maiaantes.jpg', description: 'Upload any photo' },
         { step: 2, label: 'AI Magic', image: '/maiatransformada.png', description: 'AI transforms to art' },
         { step: 3, label: 'Buy Products', image: '/produto.jpg', description: 'Order on physical products' }
       ]
     },
    {
      id: 'tech',
      title: 'BUILT WITH POWER 💪',
      subtitle: 'Modern Tech Stack',
      description: 'Professional tools for a professional platform',
      icon: <Rocket className="w-12 h-12" />,
      gradient: 'from-blue-600 via-cyan-600 to-teal-600',
      technologies: [
        { name: 'OpenAI gpt-image-1', category: 'AI photo', icon: '🧠' },
        { name: 'Next.js 15', category: 'Frontend', icon: '⚛️' },
        { name: 'Stripe', category: 'Payments', icon: '💳' },
        { name: 'Printify', category: 'Products', icon: '🛍️' },
        { name: 'Supabase', category: 'Database', icon: '💾' },
        { name: 'PostHog', category: 'Analytics', icon: '🔍' },
      ]
    },
    {
      id: 'features',
      title: 'WHAT MAKES IT SPECIAL ✨',
      subtitle: 'More Than Just AI Art',
      description: 'A complete platform with everything you need',
      icon: <Star className="w-12 h-12" />,
      gradient: 'from-emerald-600 via-green-600 to-lime-600',
      features: [
        { name: '🎨 20+ Art Styles', desc: 'Studio Ghibli, LEGO, Greek God, Portuguese Emperor & more!', icon: <Palette /> },
        { name: '🛒 Full E-commerce', desc: 'Buy on mugs, canvas, posters, phone cases, notebooks', icon: <ShoppingCart /> },
        { name: '📊 Live Dashboard', desc: 'Track your orders, see your art gallery, manage everything', icon: <BarChart3 /> },
        { name: '👥 Community', desc: 'Share your creations, explore and discover others\' art', icon: <Users /> }
      ]
    },
    {
      id: 'highlights',
      title: 'WHY THIS MATTERS 💎',
      subtitle: 'Innovation That Works',
      description: 'This isn\'t just another project - it\'s something completely new',
      icon: <Target className="w-12 h-12" />,
      gradient: 'from-indigo-600 via-purple-600 to-pink-600',
      innovations: [
        { title: '🌟 World\'s First', desc: 'AI art + print-on-demand combined. Nobody else is doing this!' },
        { title: '🚀 Fully Functional', desc: 'Real users, real payments, real products. This actually works in production.' },  
        { title: '💡 Smart Engineering', desc: 'Built scalable systems that handle growth. Professional-grade architecture.' },
        { title: '🎯 Complete Solution', desc: 'From AI transformation to doorstep delivery. End-to-end platform.' }
      ]
    }
  ];

  const currentSlideData = slideData[currentSlide];

  return (
    <div ref={containerRef} className={`relative w-full max-w-7xl mx-auto px-2 md:px-4 ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient} opacity-10 transition-all duration-1000`} />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Main Carousel */}
      <Carousel 
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="ml-0">
          {slideData.map((slide, index) => (
            <CarouselItem key={slide.id} className="pl-0">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-[750px] sm:h-[520px] md:h-[520px] relative flex flex-col"
              >
                <Card className="glass-panel border-2 border-white/20 shadow-2xl overflow-hidden h-full flex flex-col">
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Compact Header */}
                    <div className={`relative bg-gradient-to-r ${slide.gradient} p-2 sm:p-3 md:p-4 text-white overflow-visible`}>
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="relative z-10">
                        {/* Centered Title Section */}
                        <div className="text-center mb-1 sm:mb-2">
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="inline-block p-3 bg-white/20 rounded-lg backdrop-blur-md mb-2"
                          >
                            {slide.icon}
                          </motion.div>
                          
                          <motion.h2 
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2"
                          >
                            {slide.title}
                          </motion.h2>
                          <motion.p 
                            initial={{ y: -15, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90"
                          >
                            {slide.subtitle}
                          </motion.p>
                        </div>
                        
                        {/* Live Badge - Now positioned absolutely in top right */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: "spring" }}
                          className="absolute top-4 right-4 bg-green-500/90 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          🚀 LIVE
                        </motion.div>
                      </div>
                      
                      {slide.description && (
                        <motion.p 
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mt-3 md:mt-4 text-sm md:text-base opacity-90 max-w-3xl"
                        >
                          {slide.description}
                        </motion.p>
                      )}
                    </div>

                    {/* Compact Content */}
                    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-br from-cosmic-black/90 to-cosmic-darkblue/90 flex-1 flex flex-col justify-center">
                                             {/* Overview Slide - Demo */}
                       {slide.id === 'overview' && (
                         <div className="space-y-3 sm:space-y-4">
                           {/* Process Demo */}
                           <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-2 lg:gap-4">
                             {slide.demo?.map((step, idx) => (
                               <motion.div
                                 key={step.step}
                                 initial={{ scale: 0.8, opacity: 0, y: 50 }}
                                 animate={{ scale: 1, opacity: 1, y: 0 }}
                                 transition={{ delay: 0.6 + idx * 0.3, type: "spring" }}
                                                                  className={`relative group flex-shrink-0 ${
                                   idx === 1
                                     ? 'w-32 sm:w-40 md:w-52 lg:w-56 scale-105 sm:scale-110 md:scale-105 z-10'
                                     : 'w-28 sm:w-32 md:w-44 lg:w-48'
                                 } transition-all duration-500`}
                               >
                                 {/* Image Container */}
                                 <div className="glass-panel p-2 sm:p-3 border border-white/20 rounded-xl overflow-hidden bg-cosmic-black/60 backdrop-blur-md hover:border-cosmic-purple/50 transition-all duration-300">
                                   <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                                     <img 
                                       src={step.image} 
                                       alt={step.label}
                                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                     />
                                     
                                     {/* Overlay with step number */}
                                     <div className="absolute top-2 left-2 w-8 h-8 bg-cosmic-purple rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                       {step.step}
                                     </div>
                                     
                                     {/* Magic sparkles for AI step */}
                                     {idx === 1 && (
                                       <div className="absolute inset-0 pointer-events-none">
                                         <Sparkles className="absolute top-4 right-4 text-yellow-400 animate-pulse" size={20} />
                                         <Sparkles className="absolute bottom-4 left-4 text-pink-400 animate-pulse" size={16} style={{animationDelay: '0.5s'}} />
                                         <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400 animate-pulse" size={18} style={{animationDelay: '1s'}} />
                                       </div>
                                     )}
                                   </div>
                                   
                                   {/* Text */}
                                                                            <div className="text-center">
                                           <h3 className="text-white font-bold text-xs sm:text-sm md:text-base mb-1">{step.label}</h3>
                                           <p className="text-gray-300 text-xs sm:text-xs md:text-sm">{step.description}</p>
                                         </div>
                                 </div>
                                 
                               </motion.div>
                             ))}
                             

                           </div>
                           
                           {/* Call to Action */}
                           <motion.div 
                             initial={{ y: 30, opacity: 0 }}
                             animate={{ y: 0, opacity: 1 }}
                             transition={{ delay: 2.2 }}
                             className="text-center pt-2"
                           >
                             <button
                               onClick={() => window.open('https://pictuz.com', '_blank')}
                               className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-cosmic-purple/20 to-cosmic-pink/20 rounded-full border border-cosmic-purple/30 hover:from-cosmic-purple/40 hover:to-cosmic-pink/40 hover:border-cosmic-purple/60 transition-all duration-300 cursor-pointer transform hover:scale-105"
                             >
                               <Zap className="text-yellow-400 animate-pulse" size={14} />
                               <span className="text-white font-medium text-xs sm:text-sm">Try it yourself - Upload any photo!</span>
                               <Sparkles className="text-pink-400 animate-pulse" size={12} />
                               <ExternalLink className="text-gray-300 ml-1" size={10} />
                             </button>
                           </motion.div>
                         </div>
                                              )}

                      {/* Tech Stack Slide */}
                      {slide.id === 'tech' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                          {slide.technologies?.map((tech, idx) => (
                            <motion.div
                              key={tech.name}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.6 + idx * 0.08, type: "spring" }}
                              className="glass-panel p-3 border border-white/10 hover:border-cosmic-purple/50 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{tech.icon}</span>
                                <div>
                                  <div className="text-white font-semibold text-sm">{tech.name}</div>
                                  <div className="text-gray-400 text-xs">{tech.category}</div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Features Slide */}
                      {slide.id === 'features' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {slide.features?.map((feature, idx) => (
                            <motion.div
                              key={feature.name}
                              initial={{ x: idx % 2 === 0 ? -30 : 30, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.6 + idx * 0.1 }}
                              className="glass-panel p-4 border border-white/10 hover:border-cosmic-pink/50 transition-all group"
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-cosmic-pink group-hover:text-cosmic-purple transition-colors">
                                  {feature.icon}
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold mb-1 text-sm">{feature.name}</h3>
                                  <p className="text-gray-300 text-xs">{feature.desc}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Highlights Slide */}
                      {slide.id === 'highlights' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {slide.innovations?.map((innovation, idx) => (
                            <motion.div
                              key={innovation.title}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.6 + idx * 0.1 }}
                              className="glass-panel p-4 border border-white/10 hover:border-cosmic-purple/50 transition-all h-full flex flex-col"
                            >
                              <h3 className="text-cosmic-purple font-bold text-sm mb-2 flex-shrink-0">{innovation.title}</h3>
                              <p className="text-gray-300 text-xs leading-relaxed flex-1">{innovation.desc}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 md:p-6 bg-gradient-to-r from-cosmic-black/95 to-cosmic-darkblue/95 border-t border-white/10 mt-auto">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex justify-center"
                      >
                        <Button 
                          asChild
                          className="bg-gradient-to-r from-cosmic-purple to-cosmic-pink hover:from-cosmic-pink hover:to-cosmic-purple transition-all duration-300 text-white font-semibold px-4 md:px-6 py-2 md:py-2.5 text-sm md:text-base"
                        >
                          <a href="https://pictuz.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <ExternalLink size={16} />
                            View Live Production
                          </a>
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Custom Navigation */}
        <button
          onClick={() => {
            // Pausa temporariamente por 10 segundos, depois reativa se ainda visível
            setIsAutoPlaying(false);
            if (api) {
              api.scrollPrev();
            }
            setTimeout(() => {
              if (isVisible) setIsAutoPlaying(true);
            }, 10000);
          }}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => {
            // Pausa temporariamente por 10 segundos, depois reativa se ainda visível
            setIsAutoPlaying(false);
            if (api) {
              api.scrollNext();
            }
            setTimeout(() => {
              if (isVisible) setIsAutoPlaying(true);
            }, 10000);
          }}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </Carousel>


    </div>
  );
};

export default PictuzShowcase;