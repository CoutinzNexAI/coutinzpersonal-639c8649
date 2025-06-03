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
import { trackEvent } from '@/lib/posthog';

const packages = [
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
    popular: true, 
    description: 'Escolha favorita dos criadores',
    icon: Sparkles,
    gradient: 'from-purple-400 to-purple-600'
  },
  { 
    id: 'premium', 
    name: 'PREMIUM', 
    coins: 7, 
    price: 10, 
    popular: false, 
    description: 'Valor excepcional para criadores',
    icon: Zap,
    gradient: 'from-emerald-400 to-emerald-600'
  },
  { 
    id: 'mega', 
    name: 'MEGA', 
    coins: 15, 
    price: 20, 
    bestValue: true, 
    description: 'Máximo poder criativo',
    icon: Crown,
    gradient: 'from-amber-400 to-amber-600'
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
  const { userInfo, signInWithGoogle } = useAuth();
  const { balance, purchaseCoins, refetchBalance } = usePicCoins();
  const router = useRouter();

  // 🔥 TRACKING: Pricing page visit
  useEffect(() => {
    trackEvent('pricing_page_visit', {
      user_id: userInfo?.id || null,
      is_authenticated: !!userInfo,
      referrer: document.referrer || 'direct',
      total_packages: packages.length,
      current_balance: userInfo ? balance : null,
      came_from_studio: router.query.from === 'studio',
      reason: typeof router.query.reason === 'string' ? router.query.reason : null
    });
  }, [userInfo, balance, router.query.from, router.query.reason]);

  useEffect(() => {
    // Check for success message
    if (router.query.success === 'true') {
      // 🔥 TRACKING: Purchase success redirect
      trackEvent('purchase_success_redirect', {
        user_id: userInfo?.id || null,
        session_id: typeof router.query.session_id === 'string' ? router.query.session_id : null,
        package_id: typeof router.query.package_id === 'string' ? router.query.package_id : null
      });

      toast.success('✨ Compra mágica realizada!', {
        description: 'Os teus PicCoins foram adicionados à conta e estão prontos para usar.'
      });
      refetchBalance();
      // Clean URL
      router.replace('/pricing', undefined, { shallow: true });
    }

    // Check for cancel message
    if (router.query.canceled === 'true') {
      // 🔥 TRACKING: Purchase cancelled redirect
      trackEvent('purchase_cancelled_redirect', {
        user_id: userInfo?.id || null,
        package_id: typeof router.query.package_id === 'string' ? router.query.package_id : null
      });

      toast.error('Compra cancelada', {
        description: 'Podes tentar novamente quando quiseres.'
      });
      // Clean URL
      router.replace('/pricing', undefined, { shallow: true });
    }

    // Check if user came from insufficient balance (from studio)
    if (router.query.from === 'studio') {
      // 🔥 TRACKING: Insufficient balance redirect
      trackEvent('insufficient_balance_redirect', {
        user_id: userInfo?.id || null,
        reason: typeof router.query.reason === 'string' ? router.query.reason : 'insufficient_balance'
      });

      toast.info('💰 Escolhe um pacote', {
        description: 'Seleciona quantos PicCoins queres comprar para continuar.'
      });
      // Clean URL
      router.replace('/pricing', undefined, { shallow: true });
    }
  }, [router.query, refetchBalance, router, userInfo?.id]);

  const handleLogin = async () => {
    // 🔥 TRACKING: Login prompt from pricing
    trackEvent('pricing_login_prompt', {
      user_id: null,
      trigger_action: 'purchase_attempt'
    });

    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      setIsLoginModalOpen(false);

      // 🔥 TRACKING: Login success from pricing
      trackEvent('pricing_login_success', {
        user_id: userInfo?.id || null
      });
    } catch (error) {
      // 🔥 TRACKING: Login error from pricing
      trackEvent('pricing_login_error', {
        error_message: error instanceof Error ? error.message : 'Unknown login error'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePurchase = async (packageId: string) => {
    const selectedPackage = packages.find(p => p.id === packageId);

    // 🔥 TRACKING: Purchase attempt
    trackEvent('package_purchase_attempt', {
      user_id: userInfo?.id || null,
      package_id: packageId,
      package_name: selectedPackage?.name || null,
      package_price: selectedPackage?.price || null,
      package_coins: selectedPackage?.coins || null,
      is_authenticated: !!userInfo,
      current_balance: userInfo ? balance : null
    });

    if (!userInfo) {
      // 🔥 TRACKING: Login required for purchase
      trackEvent('package_purchase_login_required', {
        package_id: packageId,
        package_name: selectedPackage?.name || null,
        package_price: selectedPackage?.price || null
      });

      setIsLoginModalOpen(true);
      return;
    }

    // Compra normal sem promoções automáticas
    await executeStripeCheckout(packageId);
  };

  // Função para executar o checkout do Stripe
  const executeStripeCheckout = async (packageId: string) => {
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
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto mb-20 mt-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {packages.map((pkg) => {
              const IconComponent = pkg.icon;
              return (
                <motion.div key={pkg.id} variants={cardVariants} className="relative">
                  {/* Floating Badges - Outside and Above Cards */}
                  <AnimatePresence>
                    {pkg.popular && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20"
                      >
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                          <Sparkles className="w-4 h-4" />
                          Mais Popular
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600"></div>
                        </div>
                      </motion.div>
                    )}
                    {pkg.bestValue && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20"
                      >
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                          <Crown className="w-4 h-4" />
                          Melhor Valor
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-600"></div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Card 
                    className={`relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 overflow-hidden group ${
                      pkg.popular ? 'border-purple-300 shadow-lg scale-105' : 
                      pkg.bestValue ? 'border-amber-300 shadow-lg' : 'border-ghibli-sand/30 hover:border-ghibli-moss/50'
                    }`}
                  >
                    {/* Glowing Background Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${pkg.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                    
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
                        <div className="text-3xl font-bold text-ghibli-wood">
                          €{pkg.price}
                        </div>
                        <div className="text-sm text-ghibli-earth">
                          €{(pkg.price / pkg.coins).toFixed(2)} por PicCoin
                        </div>
                        {pkg.coins > 1 && (
                          <div className="text-sm text-emerald-600 font-medium">
                            Poupa {Math.round((1 - (pkg.price / pkg.coins) / 2) * 100)}%
                          </div>
                        )}
                      </div>
                      
                      {/* Buy Button */}
                      <Button 
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={loading === pkg.id}
                        className={`w-full relative overflow-hidden group ${
                          pkg.popular ? 'bg-purple-600 hover:bg-purple-700' : 
                          pkg.bestValue ? 'bg-amber-600 hover:bg-amber-700' :
                          'ghibli-button'
                        } ${
                          pkg.popular || pkg.bestValue ? 'py-3 px-6 text-base' : 'py-2.5 px-5 text-sm'
                        } ${
                          'max-md:py-2 max-md:px-4 max-md:text-sm'
                        }`}
                      >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                          {loading === pkg.id ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="w-4 h-4" />
                              </motion.div>
                              Processando...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Comprar Agora
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
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                  className="ghibli-card p-8 text-center group hover:shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="font-ghibli text-xl font-semibold text-ghibli-wood mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-ghibli-earth leading-relaxed">
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