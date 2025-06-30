// src/components/GhibliHero.tsx
// src/components/GhibliHero.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Images } from 'lucide-react';
import { useImageProcessing, UseImageProcessingResult } from '@/hooks/useImageProcessing';
import { motion, Variants } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth'; // <<< NOVO: Importar useAuth
import { toast } from '@/components/ui/sonner'; // <<< NOVO: Para feedback de autenticação
import { trackEvent, trackHover, trackFeatureAdoption } from '@/lib/posthog'; // <<< NOVO: Import tracking

import { StyleExamplesModal } from './gallery/StyleExamplsModal'; // Mantido
import { TransformationStudio } from './TransformationStudio';
import StyleSelectorModal from './StyleSelectorModal';
import LoginPromptModal from './LoginPromptModal'; // <<< NOVO: Importar o modal de login

// --- Variantes de Animação para o Título (mantidas como no original) ---
const titleContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.6,
      delayChildren: 0.7,
    },
  },
};

const titleWordVariants: Variants = {
  hidden: { opacity: 0, y: -20, filter: "blur(5px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 100,
      duration: 0.5,
    },
  },
};

const GhibliHero = () => {
  const imageProcessingProps = useImageProcessing();
  const {
    isStyleModalOpen,
    selectedStyle,
    processingState,
    currentJobId,
    setIsStyleModalOpen,
    handleNewImage,
    availableStyles,
    stylesLoading,
    stylesError,
  } = imageProcessingProps;

  // --- NOVO: Estados para o fluxo de login ---
  const { userInfo, isLoading: isAuthLoading, signInWithGoogle } = useAuth();
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false); // Para feedback no botão do modal

  const [showStepZeroInStudio, setShowStepZeroInStudio] = useState(true);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const interactiveCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lógica existente para currentJobId (mantida)
    if (currentJobId && !['idle', 'uploading_image', 'creating_job'].includes(processingState)) {
      if (['processing', 'polling_status', 'completed', 'error'].includes(processingState) && !selectedStyle) {
        // console.log('[GhibliHero Effect] Job ID found, but waiting for selectedStyle to load.');
      } else {
        // console.log('[GhibliHero Effect] Job ID found, continuing process.');
      }
    }
  }, [currentJobId, processingState, selectedStyle]);

  // --- NOVO: Lógica modificada para handleTriggerStudio ---
  const handleTriggerStudio = () => {
    // 🔥 TRACKING: Feature adoption - starting transformation
    trackFeatureAdoption('transformation_studio', !userInfo, {
      trigger_location: 'hero_main_button',
      user_logged_in: !!userInfo
    });

    // 🔥 TRACKING: CTA button click
    trackEvent('cta_button_click', {
      button_type: 'main_cta',
      location: 'hero',
      user_logged_in: !!userInfo,
      button_text: 'Transforme já a sua foto!'
    });

    if (isAuthLoading) {
      toast.info("A verificar autenticação...", { duration: 2000 });
      return;
    }

    if (userInfo) {
      // 🔥 TRACKING: Studio access (logged in user)
      trackEvent('transformation_studio_enter', {
        method: 'hero_button',
        user_id: userInfo.id
      });

      // Utilizador está logado, prossegue para o estúdio
      setShowStepZeroInStudio(false);
      if (imageProcessingProps.activeStep !== 1 && processingState === 'idle') {
        handleNewImage();
      } else if (imageProcessingProps.activeStep !== 1) {
        imageProcessingProps.setActiveStep(1);
      }

      if (interactiveCardRef.current) {
        setTimeout(() => {
          interactiveCardRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
    } else {
      // 🔥 TRACKING: Login prompt shown
      trackEvent('login_prompt_shown', {
        trigger: 'studio_enter',
        button_location: 'hero'
      });

      // Utilizador não está logado, abre o pop-up de login
      setIsLoginPromptOpen(true);
    }
  };

  // --- NOVO: Função para ser chamada pelo LoginPromptModal ---
  const handleLoginRequestFromModal = async () => {
    // 🔥 TRACKING: Login attempt
    trackEvent('login_attempt', {
      method: 'google',
      trigger: 'hero_cta'
    });

    setIsSubmittingLogin(true);
    try {
      await signInWithGoogle();
      // O AuthProvider tratará da atualização do userInfo.
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleOpenExamples = () => {
    // 🔥 TRACKING: Examples button hover and click
    trackHover('examples_button', {
      location: 'hero',
      user_logged_in: !!userInfo
    });

    // 🔥 TRACKING: Examples button click
    trackEvent('examples_button_click', {
      location: 'hero',
      user_logged_in: !!userInfo
    });

    setIsExamplesOpen(true);
  };

  const resetStudioToStepZero = () => {
    handleNewImage();
    setShowStepZeroInStudio(true);
  };

  const titleParts = "Transforme as suas\nFotos em Obras\nde Arte!".split(/(\n)/g).filter(part => part !== '\n');

  // Add hover tracking to main CTA button
  const handleCTAHover = () => {
    trackHover('main_cta_button', {
      location: 'hero',
      user_logged_in: !!userInfo,
      button_text: 'Transforme já a sua foto!'
    });
  };

  const handleShopHover = () => {
    trackHover('shop_button', {
      location: 'hero',
      user_logged_in: !!userInfo
    });
  };

  return (
    <section className="relative pt-24 md:pt-28 pb-16 md:pb-24 overflow-hidden">
      {/* Elementos Decorativos Flutuantes (mantidos) */}
      <div className="leaf-decoration top-20 left-10 text-3xl">🍃</div>
      <div className="leaf-decoration bottom-28 right-16 text-2xl">🍂</div>
      <div className="star-decoration top-40 right-28 text-xl">✨</div>
      <div className="star-decoration bottom-16 left-20 text-2xl">✨</div>

      <div className="container relative mx-auto px-4">
        <motion.h1
          variants={titleContainerVariants}
          initial="hidden"
          animate="visible"
          className="text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood leading-tight mb-12 md:mb-20 text-center break-words hyphens-none"
          style={{ 
            textShadow: "0 0 5px transparent",
            wordBreak: "keep-all",
            hyphens: "none"
          }}
          whileInView={{
            textShadow: [
              "0 0 5px rgba(255, 223, 186, 0)",
              "0 0 15px rgba(236, 153, 75, 0.7)",
              "0 0 25px rgba(236, 153, 75, 0.5)",
              "0 0 15px rgba(236, 153, 75, 0.7)",
              "0 0 5px rgba(255, 223, 186, 0)"
            ],
            transition: {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: titleParts.length * 0.2 + 0.5
            }
          }}
          viewport={{ once: true, amount: 0.8 }}
        >
          {titleParts.map((part, index) => (
            <motion.span key={index} variants={titleWordVariants} className="block md:inline-block">
              {part.split("").map((char, charIndex) => (
                <motion.span
                  key={charIndex}
                  className="inline-block"
                  initial={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                    delay: index * 0.15 + charIndex * 0.03 + Math.random() * 0.1
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
              {index < titleParts.length - 1 && <span className="hidden md:inline">{"\u00A0"}</span>}
            </motion.span>
          ))}
        </motion.h1>

        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start lg:justify-center gap-8 xl:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: titleParts.length * 0.1 + 0.5 }}
            className="w-full lg:w-5/12 xl:w-4/12 mb-10 lg:mb-0 flex flex-col items-center lg:items-start order-2 lg:order-1"
          >
            {/* Subtítulo estilizado com cards animados (mantido) */}
            <div className="mb-10 w-full hidden md:block">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: titleParts.length * 0.1 + 0.7 }}
                className="mb-4 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 p-4 rounded-xl shadow-sm border border-amber-100 transform hover:scale-102 transition-all duration-300"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">🪄</span>
                  <p className="text-lg text-ghibli-earth leading-relaxed">
                    Transforme fotografias comuns em <span className="font-semibold text-ghibli-wood">arte verdadeiramente mágica</span>.
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: titleParts.length * 0.1 + 0.9 }}
                className="mb-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 p-4 rounded-xl shadow-sm border border-green-100 transform hover:scale-102 transition-all duration-300"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">👍</span>
                  <p className="text-lg text-ghibli-earth leading-relaxed">
                    O processo é <span className="font-semibold text-ghibli-wood">simples</span>: envie a foto, escolha o estilo e está feito!
                  </p>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: titleParts.length * 0.1 + 1.1 }}
                className="bg-gradient-to-r from-blue-50/80 to-sky-50/80 p-4 rounded-xl shadow-sm border border-blue-100 transform hover:scale-102 transition-all duration-300"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">🖼️</span>
                  <p className="text-lg text-ghibli-earth leading-relaxed">
                    Crie imagens <span className="font-semibold text-ghibli-wood">fantásticas</span>, perfeitas para transformar em produtos únicos!
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Botões com design aprimorado (mantidos) */}
            <div className="flex flex-col space-y-6 items-center justify-center lg:justify-start w-full">
              {/* Botão principal primeiro - desktop - mais sóbrio */}
              <motion.div
                className="w-auto relative group hidden md:block"
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-300/40 via-yellow-300/40 to-amber-300/40 rounded-xl blur opacity-50 group-hover:opacity-70 transition duration-300"></div>
                <Button
                  variant="ghost"
                  className={`relative inline-flex items-center justify-center
                                  rounded-xl border-2 border-amber-300/60 hover:border-amber-400/80 transition-all duration-300
                                  shadow-lg hover:shadow-xl bg-gradient-to-br from-amber-200 via-yellow-200 to-amber-300 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 text-amber-900 font-bold
                                  text-xl px-10 py-5 md:px-12 md:py-6 transform hover:scale-102 font-ghibli`}
                  onClick={handleTriggerStudio}
                  onMouseEnter={handleCTAHover}
                >
                  <span className="mr-3 text-2xl">🎨</span>
                  <span>Transforme já a sua foto!</span>
                </Button>
              </motion.div>
              
              {/* Botões secundários lado a lado - desktop */}
              <div className="hidden md:flex flex-row gap-4 items-center justify-center">
                {/* Botão "Veja exemplos!" */}
              <motion.div
                  className="w-auto"
                whileHover={{
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                    className="inline-flex items-center justify-center transition-all duration-300
                                  rounded-lg shadow-sm hover:shadow-md text-ghibli-earth bg-white/80 backdrop-blur-sm border-ghibli-moss/60 hover:bg-ghibli-moss/10 hover:text-ghibli-moss
                                    hover:border-ghibli-moss text-base px-5 py-2.5"
                  onClick={handleOpenExamples}
                >
                  <motion.span
                    whileHover={{ rotate: [0, -10, 10, 0], transition: {duration: 0.4}}}
                    className="bg-ghibli-moss/10 p-1.5 rounded-full mr-2"
                  >
                    <Images className="h-5 w-5 text-ghibli-moss" />
                  </motion.span>
                  Veja exemplos!
                </Button>
              </motion.div>

                {/* Botão "Visite a Nossa Loja" */}
                <motion.button
                  onClick={() => {
                    // 🔥 TRACKING: Shop button click
                    trackEvent('shop_button_click', {
                      location: 'hero_desktop',
                      user_logged_in: !!userInfo
                    });
                    window.location.href = '/shop';
                  }}
                  onMouseEnter={handleShopHover}
                  whileHover={{ 
                    scale: 1.05, 
                    y: -2,
                    boxShadow: "0 8px 25px -8px rgba(76, 175, 80, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white rounded-xl border border-emerald-400/60 inline-flex items-center transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                >
                  <motion.span 
                    className="mr-2 text-lg"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    🛍️
                  </motion.span>
                  <p className="text-sm font-bold">Visite a Nossa Loja!</p>
                </motion.button>
              </div>
              
              {/* Botões para mobile - mantém layout original */}
              <div className="md:hidden flex flex-col space-y-4 items-center w-full">
                {/* Botão "Veja exemplos!" - mobile */}
                <motion.div
                  className="w-auto"
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="inline-flex items-center justify-center transition-all duration-300
                                    rounded-lg shadow-sm hover:shadow-md text-ghibli-earth bg-white/80 backdrop-blur-sm border-ghibli-moss/60 hover:bg-ghibli-moss/10 hover:text-ghibli-moss
                                    hover:border-ghibli-moss text-sm px-4 py-2"
                    onClick={handleOpenExamples}
                  >
                    <motion.span
                      whileHover={{ rotate: [0, -10, 10, 0], transition: {duration: 0.4}}}
                      className="bg-ghibli-moss/10 p-1.5 rounded-full mr-2"
                    >
                      <Images className="h-5 w-5 text-ghibli-moss" />
                    </motion.span>
                    Veja exemplos!
                  </Button>
                </motion.div>

                {/* Botão "Visite a Nossa Loja" - mobile */}
              <motion.button
                onClick={() => {
                  trackEvent('shop_button_click', {
                    location: 'hero_mobile',
                    user_logged_in: !!userInfo
                  });
                  window.location.href = '/shop';
                }}
                onMouseEnter={handleShopHover}
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                  boxShadow: "0 6px 20px -6px rgba(76, 175, 80, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white rounded-full border border-emerald-400/60 inline-flex items-center transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                <motion.span 
                  className="mr-2 text-lg"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  🛍️
                </motion.span>
                <p className="text-sm font-bold">Visite a Nossa Loja!</p>
              </motion.button>
              </div>
            </div>

            {/* Botão principal destacado - APENAS NO MOBILE, posicionado abaixo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: [0, -4, 0],
              }}
              transition={{ 
                opacity: { delay: titleParts.length * 0.1 + 1.7, duration: 0.7 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: titleParts.length * 0.1 + 2}
              }}
              className="mt-8 w-auto relative group md:hidden flex justify-center"
              whileHover={{
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <Button
                variant="ghost"
                className="relative inline-flex items-center justify-center
                                rounded-xl border-3 border-amber-200 hover:border-amber-300 transition-all duration-300
                                shadow-lg hover:shadow-xl bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 text-ghibli-wood font-bold
                                text-lg px-6 py-3 transform hover:scale-102"
                onClick={handleTriggerStudio}
                onMouseEnter={handleCTAHover}
              >
                <motion.span
                  animate={{ 
                    rotate: [0, -2, 2, -2, 0],
                    scale: [1, 1.1, 1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  className="mr-3 text-xl"
                >
                  ✨
                </motion.span>
                Transforme já a sua foto!
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: titleParts.length * 0.1 + 0.7 }}
            ref={interactiveCardRef}
            id="hero-interactive-area"
            className="w-full md:w-10/12 lg:w-7/12 xl:w-7/12 order-1 lg:order-2"
          >
            <div className="ghibli-card p-0 h-auto min-h-[22rem] md:min-h-[28rem] flex flex-col items-center justify-center overflow-hidden">
              <TransformationStudio
                {...(imageProcessingProps as Omit<UseImageProcessingResult, 'handleNewImage' | 'currentJobId' | 'setIsStyleModalOpen' | 'isStyleModalOpen'>)}
                showStepZeroContent={showStepZeroInStudio}
                onStartClickForCarousel={handleTriggerStudio} // <<< Ação do carrossel também aqui
                onResetToStepZero={resetStudioToStepZero}
                simulatedProgress={imageProcessingProps.simulatedProgress}
                currentJobId={currentJobId}
                currentRating={imageProcessingProps.currentRating}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <StyleSelectorModal
        isOpen={isStyleModalOpen}
        onOpenChange={setIsStyleModalOpen}
        onStyleSelect={imageProcessingProps.handleStyleSelect}
        selectedStyleId={selectedStyle?.id || null}
        styles={availableStyles}
        isLoading={stylesLoading}
        error={stylesError}
      />

      <StyleExamplesModal
        isOpen={isExamplesOpen}
        onOpenChange={setIsExamplesOpen}
        onStartTransformationClick={() => {
          setIsExamplesOpen(false);
          handleTriggerStudio(); // <<< Ação do modal de exemplos também aqui
        }}
      />

      {/* --- NOVO: Renderização do LoginPromptModal --- */}
      <LoginPromptModal
        isOpen={isLoginPromptOpen}
        onOpenChange={setIsLoginPromptOpen}
        onLogin={handleLoginRequestFromModal}
        isLoggingIn={isSubmittingLogin}
        // A prop onContinueWithoutLogin foi removida conforme o plano
      />
    </section>
  );
};

export default GhibliHero;
