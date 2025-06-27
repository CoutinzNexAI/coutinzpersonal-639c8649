import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, ChevronRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';

const CeramicMugPage: React.FC = () => {
  const router = useRouter();
  const { userInfo } = useAuth();
  
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'330ml' | '450ml'>('330ml');
  const [quantity, setQuantity] = useState(1);

  // Calculate discount and prices - different from heart mug
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  // Ceramic mug pricing: 330ml = €22.50, 450ml = €27.50
  const basePrice = selectedSize === '330ml' ? 22.5 : 27.5;
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  const canPurchase = selectedImageUrl && selectedImageId && userInfo;

  const handleAddToCart = async () => {
    if (!canPurchase) {
      if (!userInfo) {
        toast.error('Faça login para adicionar ao carrinho');
        return;
      }
      if (!selectedImageUrl) {
        toast.error('Escolha uma arte primeiro!');
        return;
      }
    }

    setLoading(true);

    try {
      await CartService.addToCart({
        productId: 'ceramic_mug',
        productName: `Caneca Personalizada ${selectedSize}`,
        productCategory: 'mug',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: discountedPrice,
        quantity: quantity,
        customizations: {
          variantId: selectedSize === '330ml' ? 1001 : 1002,
          scale: 1,
          x: 0.5,
          y: 0.5,
          angle: 0,
          size: selectedSize
        },
        imageAdjustments: { x: 0.5, y: 0.5, scale: 1, rotation: 0 }
      });

      const quantityText = quantity === 1 ? 'Caneca adicionada' : `${quantity} canecas adicionadas`;
      const totalText = savings > 0 ? ` | Total: €${totalPrice.toFixed(2)} (Poupou €${savings.toFixed(2)})` : ` | Total: €${totalPrice.toFixed(2)}`;
      
      toast.success(`${quantityText} ao carrinho!${totalText}`);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => {
    if (!userInfo) {
      toast.error('🎨 Entre para personalizar a sua caneca', {
        description: 'Faça login para aceder às suas transformações AI',
        style: {
          background: 'linear-gradient(to right, #22c55e, #16a34a)',
          color: 'white',
          border: 'none'
        },
        className: 'font-medium'
      });
      return;
    }
    setIsGalleryModalOpen(true);
  };

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    toast.success('Arte selecionada! Pronta para personalizar a sua caneca.');
  };

  return (
    <>
      <Head>
        <title>Caneca Personalizada | PicTuz - Transformações AI Únicas</title>
        <meta name="description" content="Personalize a sua caneca cerâmica com arte AI única. Disponível em 330ml e 450ml. Desconto progressivo a partir de 2 unidades!" />
        <meta name="keywords" content="caneca personalizada, caneca cerâmica, arte AI, impressão personalizada, PicTuz" />
        <meta property="og:title" content="Caneca Personalizada | PicTuz" />
        <meta property="og:description" content="Personalize a sua caneca cerâmica com arte AI única. Desconto progressivo!" />
        <meta property="og:image" content="/mockupproduto/canecapersonalizada.png" />
        <meta property="og:type" content="product" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream via-ghibli-cream/95 to-ghibli-sand/30">
        <Header />
        <ProductCardDecorations />

        <main className="container mx-auto px-4 py-6 lg:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Layout */}
            <div className="block lg:hidden">
              {/* Breadcrumb Mobile */}
              <motion.nav 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="text-sm text-ghibli-earth/60">
                  <Link href="/" className="hover:text-ghibli-moss transition-colors">
                    🏠 Início
                  </Link>
                  <span className="mx-2">•</span>
                  <Link href="/shop" className="hover:text-ghibli-moss transition-colors">
                    🛍️ Loja
                  </Link>
                  <span className="mx-2">•</span>
                  <span className="text-ghibli-moss font-medium">☕ Caneca Personalizada</span>
                </div>
              </motion.nav>

              {/* Title Mobile */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <h1 className="text-3xl sm:text-4xl font-bold text-ghibli-earth mb-2">
                  <span className="bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-wood bg-clip-text text-transparent">
                    ☕ Caneca Personalizada
                  </span>
                </h1>
              </motion.div>

              {/* Mockup Mobile */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <div className="relative bg-white rounded-2xl shadow-xl border border-ghibli-sand/30 overflow-hidden">
                  <div className="h-80 relative flex items-center justify-center p-6">
                    {selectedImageUrl ? (
                      <div className="relative">
                        <img
                          src="/mockupproduto/canecapersonalizada.png"
                          alt="Caneca personalizada"
                          className="w-48 h-48 object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            src={selectedImageUrl}
                            alt="Arte selecionada"
                            className="w-20 h-24 object-cover rounded opacity-70"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-gradient-to-br from-ghibli-cream/50 to-ghibli-sand/30 rounded-lg border-2 border-dashed border-ghibli-sand flex items-center justify-center">
                        <img
                          src="/mockupproduto/canecapersonalizada.png"
                          alt="Caneca personalizada"
                          className="w-40 h-40 object-contain opacity-60"
                        />
                      </div>
                    )}
                  </div>
                  
                  {loading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="flex space-x-1 justify-center mb-2">
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-ghibli-moss font-medium text-sm">✨ A personalizar o seu produto...</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Price and Quantity Card Mobile */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40 overflow-hidden">
                  <CardContent className="p-4">
                    {/* Price and Discount */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {discount > 0 && (
                            <span className="text-lg text-ghibli-earth/60 line-through">
                              €{basePrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-4xl sm:text-5xl font-bold text-ghibli-moss">
                            €{discountedPrice.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-ghibli-earth/70">por caneca • {selectedSize}</p>
                      </div>
                      
                      {discount > 0 && (
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          -{discount}%
                        </div>
                      )}
                    </div>

                    {/* Size Selector */}
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-ghibli-moss mb-2">
                        ☕ Tamanho
                      </label>
                      <Select
                        value={selectedSize}
                        onValueChange={(value) => setSelectedSize(value as '330ml' | '450ml')}
                      >
                        <SelectTrigger className="w-full h-12 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl">
                          <SelectValue>
                            {selectedSize === '330ml' ? '330ml' : '450ml'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="330ml">330ml</SelectItem>
                          <SelectItem value="450ml">450ml</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-ghibli-earth font-medium">Quantidade:</span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="h-8 w-8 p-0 border-ghibli-sand hover:bg-ghibli-cream/50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xl font-bold text-ghibli-moss min-w-[3rem] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                          className="h-8 w-8 p-0 border-ghibli-sand hover:bg-ghibli-cream/50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Discount Highlights */}
                    <div className="space-y-2 mb-4">
                      <div className={`p-2 rounded-lg border-2 transition-all ${
                        quantity >= 2 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-ghibli-cream/30 border-ghibli-sand/40 text-ghibli-earth/70'
                      }`}>
                        <span className="text-sm font-medium">🎯 2+ canecas: 10% OFF</span>
                      </div>
                      <div className={`p-2 rounded-lg border-2 transition-all ${
                        quantity >= 3 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-ghibli-cream/30 border-ghibli-sand/40 text-ghibli-earth/70'
                      }`}>
                        <span className="text-sm font-medium">🔥 3+ canecas: 15% OFF</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-ghibli-sand/40 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-ghibli-earth">Total:</span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-ghibli-moss">
                            €{totalPrice.toFixed(2)}
                          </div>
                          {savings > 0 && (
                            <div className="text-green-600 font-medium">
                              Poupou €{savings.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Choose Art Button Mobile */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <Button
                  onClick={handleOpenGallery}
                  className="group relative w-full py-4 sm:py-5 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 bg-gradient-to-br from-ghibli-wood via-ghibli-wood-light to-ghibli-wood hover:from-ghibli-wood-light hover:via-ghibli-wood hover:to-ghibli-wood-light text-white"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                  
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🎨</span>
                    <span>Trocar Arte</span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  </span>
                </Button>
              </motion.div>

              {/* Add to Cart Button Mobile */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-8"
              >
                {loading ? (
                  <div className="w-full py-5 sm:py-6 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-ghibli-moss font-medium text-sm sm:text-base">Criando a sua caneca mágica...</span>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    disabled={!canPurchase || loading}
                    className={`group relative w-full py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 ${
                      canPurchase
                        ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white' 
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {canPurchase && (
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                    )}
                    
                    <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>A adicionar...</span>
                        </>
                      ) : !userInfo ? (
                        <span className="text-center">Faça Login para Continuar</span>
                      ) : !selectedImageUrl ? (
                        <span className="text-center">Escolha uma Arte Primeiro</span>
                      ) : (
                        <>
                          <span className="text-lg sm:text-xl">🛒</span>
                          <span className="hidden sm:inline">
                            {quantity === 1 ? 'Adicionar ao Carrinho' : `Adicionar ${quantity} Canecas`}
                          </span>
                          <span className="sm:hidden">
                            {quantity === 1 ? 'Adicionar' : `Adicionar ${quantity}`}
                          </span>
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          </div>
                        </>
                      )}
                    </span>
                  </Button>
                )}
              </motion.div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-12">
              {/* Left Column: Mockup */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="order-2 lg:order-1"
              >
                {/* Breadcrumb Desktop */}
                <motion.nav 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="text-sm text-ghibli-earth/60">
                    <Link href="/" className="hover:text-ghibli-moss transition-colors">
                      🏠 Início
                    </Link>
                    <span className="mx-2">•</span>
                    <Link href="/shop" className="hover:text-ghibli-moss transition-colors">
                      🛍️ Loja
                    </Link>
                    <span className="mx-2">•</span>
                    <span className="text-ghibli-moss font-medium">☕ Caneca Personalizada</span>
                  </div>
                </motion.nav>

                {/* Mockup Desktop */}
                <div className="relative bg-white rounded-2xl shadow-xl border border-ghibli-sand/30 overflow-hidden">
                  <div className="aspect-square relative flex items-center justify-center p-8">
                    {selectedImageUrl ? (
                      <div className="relative">
                        <img
                          src="/mockupproduto/canecapersonalizada.png"
                          alt="Caneca personalizada"
                          className="w-64 h-64 object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            src={selectedImageUrl}
                            alt="Arte selecionada"
                            className="w-24 h-32 object-cover rounded opacity-70"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-64 h-64 bg-gradient-to-br from-ghibli-cream/50 to-ghibli-sand/30 rounded-lg border-2 border-dashed border-ghibli-sand flex items-center justify-center">
                        <img
                          src="/mockupproduto/canecapersonalizada.png"
                          alt="Caneca personalizada"
                          className="w-56 h-56 object-contain opacity-60"
                        />
                      </div>
                    )}
                  </div>
                  
                  {loading && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="flex space-x-1 justify-center mb-2">
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-ghibli-moss font-medium">✨ A personalizar o seu produto...</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Right Column: Product Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="order-1 lg:order-2 space-y-6"
              >
                {/* Title Desktop */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-4xl lg:text-5xl font-bold text-ghibli-earth mb-4">
                    <span className="bg-gradient-to-r from-ghibli-moss via-ghibli-moss-light to-ghibli-wood bg-clip-text text-transparent">
                      ☕ Caneca Personalizada
                    </span>
                  </h1>
                  <p className="text-lg text-ghibli-earth/80 leading-relaxed">
                    Transforme as suas memórias em <span className="font-bold text-ghibli-moss">arte personalizada</span> numa caneca de cerâmica premium. Disponível em dois tamanhos perfeitos para qualquer momento.
                  </p>
                </motion.div>

                {/* Desktop price and controls card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/40">
                    <CardContent className="p-6">
                      {/* Size Selector */}
                      <div className="mb-6">
                        <label className="block text-sm font-bold text-ghibli-moss mb-3">
                          ☕ Tamanho da Caneca
                        </label>
                        <Select
                          value={selectedSize}
                          onValueChange={(value) => setSelectedSize(value as '330ml' | '450ml')}
                        >
                          <SelectTrigger className="w-full h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200">
                            <SelectValue>
                              {selectedSize === '330ml' ? '330ml - Tamanho clássico' : '450ml - Tamanho grande'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="330ml">330ml - Tamanho clássico</SelectItem>
                            <SelectItem value="450ml">450ml - Tamanho grande</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Prices and Discount */}
                      <div className="mb-6">
                        <div className="flex items-center gap-4 mb-2">
                          {discount > 0 && (
                            <span className="text-xl text-ghibli-earth/60 line-through">
                              €{basePrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-3xl font-bold text-ghibli-moss">
                            €{discountedPrice.toFixed(2)}
                          </span>
                          {discount > 0 && (
                            <span className="bg-gradient-to-br from-red-500 to-red-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                              -{discount}%
                            </span>
                          )}
                        </div>
                        <p className="text-ghibli-earth/70">por caneca • Tamanho {selectedSize}</p>
                      </div>

                      {/* Discount Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className={`p-3 rounded-xl border-2 text-center transition-all ${
                          quantity >= 2 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-ghibli-cream/30 border-ghibli-sand/40 text-ghibli-earth/70'
                        }`}>
                          <div className="text-lg font-bold">🎯 10% OFF</div>
                          <div className="text-sm">2+ canecas</div>
                        </div>
                        <div className={`p-3 rounded-xl border-2 text-center transition-all ${
                          quantity >= 3 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-ghibli-cream/30 border-ghibli-sand/40 text-ghibli-earth/70'
                        }`}>
                          <div className="text-lg font-bold">🔥 15% OFF</div>
                          <div className="text-sm">3+ canecas</div>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-ghibli-earth font-medium">Quantidade:</span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="h-10 w-10 p-0 border-ghibli-sand hover:bg-ghibli-cream/50"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-2xl font-bold text-ghibli-moss min-w-[4rem] text-center">
                            {quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(quantity + 1)}
                            className="h-10 w-10 p-0 border-ghibli-sand hover:bg-ghibli-cream/50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="border-t border-ghibli-sand/40 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-ghibli-earth">Total:</span>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-ghibli-moss">
                              €{totalPrice.toFixed(2)}
                            </div>
                            {savings > 0 && (
                              <div className="text-green-600 font-medium">
                                Poupou €{savings.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Choose Art Button Desktop */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleOpenGallery}
                    className="group relative w-full py-6 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 bg-gradient-to-br from-ghibli-wood via-ghibli-wood-light to-ghibli-wood hover:from-ghibli-wood-light hover:via-ghibli-wood hover:to-ghibli-wood-light text-white"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                    
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <span className="text-2xl">🎨</span>
                      <span>Trocar Arte</span>
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </span>
                  </Button>
                </motion.div>

                {/* Add to Cart Button Desktop */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {loading ? (
                    <div className="w-full py-6 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-2xl text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-ghibli-moss font-medium text-lg">Criando a sua caneca mágica...</span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAddToCart}
                      disabled={!canPurchase || loading}
                      className={`group relative w-full py-6 text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 ${
                        canPurchase
                          ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {canPurchase && (
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000"></div>
                      )}
                      
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>A adicionar...</span>
                          </>
                        ) : !userInfo ? (
                          <span>Faça Login para Continuar</span>
                        ) : !selectedImageUrl ? (
                          <span>Escolha uma Arte Primeiro</span>
                        ) : (
                          <>
                            <span className="text-xl">🛒</span>
                            <span>{quantity === 1 ? 'Adicionar ao Carrinho' : `Adicionar ${quantity} Canecas`}</span>
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </>
                        )}
                      </span>
                    </Button>
                  )}
                </motion.div>

                {/* Description Desktop */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-ghibli-sand/40">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-ghibli-moss mb-4">☕ Sobre esta Caneca</h3>
                      
                      <ul className="space-y-3 text-ghibli-earth/80">
                        <li className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full shrink-0"></div>
                          <span>Caneca de <span className="font-bold text-ghibli-moss">cerâmica premium</span> resistente</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full shrink-0"></div>
                          <span>Impressão duradoura e <span className="font-bold">resistente à lavagem</span></span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-ghibli-wood rounded-full shrink-0"></div>
                          <span className="font-bold text-ghibli-wood">Perfeita para todas as ocasiões</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full shrink-0"></div>
                          <span>Disponível em <span className="font-bold text-ghibli-moss">330ml e 450ml</span></span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Guarantees Desktop */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5 text-ghibli-moss" />
                      </div>
                      <span className="text-sm font-bold text-ghibli-earth">Cerâmica Premium</span>
                    </div>
                    
                    <div className="group p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5 text-ghibli-moss" />
                      </div>
                      <span className="text-sm font-bold text-ghibli-earth">Impressão HD</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <TransformationGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectImage={handleSelectImageFromGallery}
      />
    </>
  );
};

export default CeramicMugPage; 