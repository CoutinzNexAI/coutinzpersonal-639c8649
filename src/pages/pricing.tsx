import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import { usePicCoins } from '@/hooks/usePicCoins';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginPromptModal from '@/components/LoginPromptModal';
import { Star, Sparkles, Zap, Crown, Infinity as InfinityIcon } from 'lucide-react';

// Tipo para os pacotes
type Package = {
  id: string;
  name: string;
  coins: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
  firstPurchaseSpecial?: boolean;
  discountPrice?: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
};

const packages: Package[] = [
  { 
    id: 'starter', 
    name: 'STARTER', 
    coins: 1, 
    price: 2, 
    popular: false, 
    description: 'Perfeito para descobrir a magia',
    icon: Star,
    gradient: 'from-blue-400 to-blue-600'
  },
  { 
    id: 'popular', 
    name: 'POPULAR', 
    coins: 3, 
    price: 5, 
    popular: false,
    firstPurchaseSpecial: true,
    discountPrice: 2,
    description: 'Escolha favorita dos criadores',
    icon: Sparkles,
    gradient: 'from-amber-400 to-amber-600'
  },
  { 
    id: 'premium', 
    name: 'PREMIUM', 
    coins: 7, 
    price: 10, 
    popular: true,
    description: 'Valor excepcional para criadores',
    icon: Zap,
    gradient: 'from-purple-400 to-purple-600'
  },
  { 
    id: 'mega', 
    name: 'MEGA', 
    coins: 15, 
    price: 20, 
    bestValue: true, 
    description: 'Máximo poder criativo',
    icon: Crown,
    gradient: 'from-emerald-400 to-emerald-600'
  },
  { 
    id: 'ultimate', 
    name: 'ULTIMATE', 
    coins: 50, 
    price: 50, 
    popular: false, 
    description: 'Para verdadeiros artistas digitais',
    icon: InfinityIcon,
    gradient: 'from-rose-400 to-rose-600'
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { userInfo, signInWithGoogle, refreshUserInfo } = useAuth();
  const { balance, purchaseCoins, refetchBalance } = usePicCoins();
  const router = useRouter();

  useEffect(() => {
    // Check for success message
    if (router.query.success === 'true') {
      toast.success('✨ Compra mágica realizada!', {
        description: 'Os teus PicCoins foram adicionados à conta e estão prontos para usar.'
      });
      refetchBalance();
      // Refresh imediato da informação do utilizador
      refreshUserInfo();
      // Clean URL
      router.replace('/pricing', undefined, { shallow: true });
    }

    // Check for cancel message
    if (router.query.canceled === 'true') {
      toast.error('Compra cancelada', {
        description: 'Podes tentar novamente quando quiseres.'
      });
      // Clean URL
      router.replace('/pricing', undefined, { shallow: true });
    }

    // Check if user came from insufficient balance (from studio)
    if (router.query.from === 'studio') {
      toast.info('💰 Escolhe um pacote', {
        description: 'Seleciona quantos PicCoins queres comprar para continuar.'
      });
      // Clean URL
      router.replace('/pricing', undefined, { shallow: true });
    }
  }, [router.query, refetchBalance, router, refreshUserInfo]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      setIsLoginModalOpen(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!userInfo) {
      setIsLoginModalOpen(true);
      return;
    }
    
    setLoading(packageId);
    try {
      const sessionId = await purchaseCoins(packageId);
      
      // Redirect to Stripe Checkout
      const stripe = await import('@stripe/stripe-js').then(m => 
        m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      );
      
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Erro na compra', {
        description: error instanceof Error ? error.message : 'Tenta novamente'
      });
    } finally {
      setLoading(null);
    }
  };

  // Função para verificar se é elegível para desconto de primeira compra
  const isEligibleForFirstPurchase = (pkg: Package) => {
    return userInfo && !userInfo.first_purchase_used && pkg.firstPurchaseSpecial;
  };

  // Função para calcular preço final (com ou sem desconto)
  const getFinalPrice = (pkg: Package) => {
    if (isEligibleForFirstPurchase(pkg)) {
      return pkg.discountPrice || pkg.price;
    }
    return pkg.price;
  };

  // Função para calcular desconto percentual
  const getDiscountPercentage = (pkg: Package) => {
    if (isEligibleForFirstPurchase(pkg)) {
      const discountPrice = pkg.discountPrice || pkg.price;
      return Math.round((1 - discountPrice / pkg.price) * 100);
    }
    return 0;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      {/* SEO Meta Tags para Pricing */}
      <Head>
        <title>Preços PicCoins - Pacotes de Créditos AI Baratos | Pictuz</title>
        <meta name="description" content="Compre PicCoins para transformar suas fotos com AI. Pacotes a partir de €2. Créditos baratos para editor de fotos inteligência artificial." />
        <meta name="keywords" content="preços AI fotos, comprar créditos AI, pacotes PicCoins, editor fotos AI barato, transformar fotos preço" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Preços PicCoins - Pacotes de Créditos AI | Pictuz" />
        <meta property="og:description" content="Pacotes de PicCoins a partir de €2. Transforme suas fotos com AI por preços acessíveis." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pictuz.com/pricing" />
        <meta property="og:image" content="https://pictuz.com/pricing-og.jpg" />
        
        {/* SEO Técnico */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pictuz.com/pricing" />
        
        {/* Schema.org para Preços */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "PicCoins - Créditos para AI Art",
              "description": "Créditos para transformar fotografias em arte com inteligência artificial",
              "brand": {
                "@type": "Brand",
                "name": "Pictuz"
              },
              "offers": packages.map(pkg => ({
                "@type": "Offer",
                "name": `Pacote ${pkg.name}`,
                "price": pkg.price.toString(),
                "priceCurrency": "EUR",
                "description": `${pkg.coins} PicCoins - ${pkg.description}`,
                "availability": "https://schema.org/InStock",
                "url": "https://pictuz.com/pricing",
                "priceValidUntil": "2025-12-31"
              })),
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "150"
              }
            })
          }}
        />
      </Head>

    <div className="min-h-screen bg-ghibli-cream flex flex-col">
      {/* Header */}
      <Header />

      {/* Falling Elements */}
      <div className="leaf-decoration top-20 left-10 text-3xl">🍃</div>
      <div className="leaf-decoration bottom-28 right-16 text-2xl">🍂</div>
      <div className="star-decoration top-40 right-28 text-xl">✨</div>
      <div className="star-decoration bottom-16 left-20 text-2xl">⭐</div>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-ghibli font-bold text-ghibli-wood mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ⭐ Pacotes de{' '}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
                PicCoins
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-ghibli-earth mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Escolhe o pacote perfeito para as tuas{' '}
              <span className="font-semibold text-ghibli-wood">transformações mágicas</span>
            </motion.p>
            
            {userInfo && (
              <motion.div 
                className="flex items-center justify-center gap-3 mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <span className="text-ghibli-earth text-lg">Saldo atual:</span>
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                  <Star className="w-5 h-5" />
                  <span>{balance} PicCoins</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Packages Grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8 max-w-7xl mx-auto mb-20 mt-16 sm:mt-12 px-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {packages.map((pkg) => {
              const IconComponent = pkg.icon;
              return (
                <motion.div key={pkg.id} variants={cardVariants} className="relative pt-8 sm:pt-4">
                  {/* Floating Badges - Outside and Above Cards */}
                  <AnimatePresence>
                    {pkg.popular && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 z-20"
                      >
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                          Mais Popular
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600"></div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* NOVO: Badge especial para primeira compra com animação chamativa */}
                    {isEligibleForFirstPurchase(pkg) && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ 
                          scale: [1, 1.03, 1], 
                          opacity: 1, 
                          y: 0,
                          rotateZ: [-0.5, 0.5, -0.5, 0]
                        }}
                        transition={{ 
                          scale: { repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 1 },
                          rotateZ: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 }
                        }}
                        className="absolute -top-12 sm:-top-10 left-1/2 transform -translate-x-1/2 z-30"
                      >
                        <div className="relative">
                          {/* Glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-red-500 blur-lg opacity-60 scale-110"></div>
                          
                          <div className="relative bg-gradient-to-r from-pink-500 to-red-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-xl text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 whitespace-nowrap border-2 border-white">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                            >
                              🎉
                            </motion.div>
                            <span className="hidden sm:inline">PRIMEIRA COMPRA</span>
                            <span className="sm:hidden">1ª COMPRA</span>
                            -{getDiscountPercentage(pkg)}%
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {pkg.bestValue && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 z-20"
                      >
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                          <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                          Melhor Valor
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-600"></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Card 
                    className={`relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 overflow-hidden group ${
                      isEligibleForFirstPurchase(pkg) ? 'border-pink-300 shadow-pink-200/50 shadow-xl sm:shadow-2xl scale-[1.02] sm:scale-105' :
                      pkg.popular ? 'border-purple-300 shadow-lg scale-[1.01] sm:scale-105' : 
                      pkg.bestValue ? 'border-amber-300 shadow-lg' : 'border-ghibli-sand/30 hover:border-ghibli-moss/50'
                    }`}
                  >
                    {/* Glowing Background Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                      isEligibleForFirstPurchase(pkg) ? 'from-pink-100 to-red-100' : pkg.gradient
                    } ${
                      isEligibleForFirstPurchase(pkg) ? 'opacity-20 group-hover:opacity-30' : 'opacity-5 group-hover:opacity-10'
                    } transition-opacity duration-300`} />
                    
                    {/* Sparkles animation para primeira compra */}
                    {isEligibleForFirstPurchase(pkg) && (
                      <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                          className="absolute top-4 left-4 text-pink-400 text-sm sm:text-base"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.4, 0.8, 0.4]
                          }}
                          transition={{ repeat: Infinity, duration: 3, delay: 0, repeatDelay: 1 }}
                        >
                          ✨
                        </motion.div>
                        <motion.div
                          className="absolute top-6 right-6 text-red-400 text-sm sm:text-base"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.7, 0.3]
                          }}
                          transition={{ repeat: Infinity, duration: 3.5, delay: 0.8, repeatDelay: 1 }}
                        >
                          💥
                        </motion.div>
                        <motion.div
                          className="absolute bottom-8 left-6 text-pink-300 text-sm sm:text-base"
                          animate={{ 
                            scale: [1, 1.05, 1],
                            opacity: [0.4, 0.7, 0.4]
                          }}
                          transition={{ repeat: Infinity, duration: 4, delay: 1.5, repeatDelay: 1 }}
                        >
                          🎉
                        </motion.div>
                      </div>
                    )}

                    <CardHeader className="text-center pb-3 pt-6 relative z-10">
                      <div className="flex justify-center mb-3">
                        <div className={`p-3 rounded-full bg-gradient-to-br ${pkg.gradient} text-white shadow-lg`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-ghibli-wood">{pkg.name}</CardTitle>
                      <CardDescription className="text-sm text-ghibli-earth">{pkg.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="text-center space-y-4 relative z-10 pb-6">
                      {/* PicCoins Display */}
                      <div className="py-2">
                        <motion.div 
                          className="text-4xl font-bold text-amber-600 mb-1"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          ⭐ {pkg.coins}
                        </motion.div>
                        <div className="text-sm text-ghibli-earth">
                          {pkg.coins === 1 ? 'PicCoin' : 'PicCoins'}
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="space-y-2">
                        {/* Mostrar preço original cortado se há desconto */}
                        {isEligibleForFirstPurchase(pkg) && (
                          <motion.div 
                            className="text-lg text-gray-500 line-through"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            €{pkg.price}
                          </motion.div>
                        )}
                        
                        <motion.div 
                          className={`text-3xl font-bold ${
                            isEligibleForFirstPurchase(pkg) ? 'text-red-600' : 'text-ghibli-wood'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          animate={isEligibleForFirstPurchase(pkg) ? {
                            color: ['#dc2626', '#ef4444', '#dc2626']
                          } : {}}
                          transition={{ 
                            color: { repeat: Infinity, duration: 3, repeatDelay: 1 },
                            scale: { type: "spring", stiffness: 300 }
                          }}
                        >
                          €{getFinalPrice(pkg)}
                        </motion.div>
                        
                        <div className="text-sm text-ghibli-earth">
                          €{(getFinalPrice(pkg) / pkg.coins).toFixed(2)} por PicCoin
                        </div>
                        
                        {isEligibleForFirstPurchase(pkg) && (
                          <motion.div 
                            className="text-sm text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                          >
                            💰 Poupas €{pkg.price - (pkg.discountPrice || pkg.price)}!
                          </motion.div>
                        )}
                        
                        {pkg.coins > 1 && !isEligibleForFirstPurchase(pkg) && (
                          <div className="text-sm text-emerald-600 font-medium">
                            Poupa {getDiscountPercentage(pkg)}%
                          </div>
                        )}
                      </div>
                      
                      {/* Buy Button */}
                      <Button 
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={loading === pkg.id}
                        className={`w-full relative overflow-hidden group ${
                          isEligibleForFirstPurchase(pkg) ? 'bg-red-600 hover:bg-red-700' :
                          pkg.popular ? 'bg-purple-600 hover:bg-purple-700' : 
                          pkg.bestValue ? 'bg-amber-600 hover:bg-amber-700' :
                          'ghibli-button'
                        } py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-medium`}
                      >
                        <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                          {loading === pkg.id ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </motion.div>
                              <span className="hidden sm:inline">Processando...</span>
                              <span className="sm:hidden">...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">Comprar Agora</span>
                              <span className="sm:hidden">Comprar</span>
                            </>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Benefits Section */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="section-title text-ghibli-wood mb-12">
              Porquê escolher PicCoins?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
              {[
                {
                  icon: "🚀",
                  title: "Transformações Instantâneas",
                  description: "1 PicCoin = 1 transformação mágica com IA avançada"
                },
                {
                  icon: "💎",
                  title: "Sem Expiração",
                  description: "Os teus PicCoins nunca expiram - usa quando quiseres"
                },
                {
                  icon: "🎨",
                  title: "Biblioteca Completa",
                  description: "Acesso a todos os estilos e futuras atualizações"
                }
              ].map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="ghibli-card p-6 sm:p-8 text-center group hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="font-ghibli text-lg sm:text-xl font-semibold text-ghibli-wood mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-sm sm:text-base text-ghibli-earth leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Login Modal */}
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
      />
    </div>
    </>
  );
} 