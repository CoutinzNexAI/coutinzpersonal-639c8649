import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { ChevronLeft } from 'lucide-react';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { ImageAdjustments, PRODUCT_ANIMATIONS, PRODUCT_STYLES } from '@/types/product';
import ProductCardDecorations from '@/components/shared/ProductCardDecorations';

interface CanvasDetailPageProps {
  product: PrintifyProductMapping;
}

const CanvasDetailPage: React.FC<CanvasDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(initialProduct || null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // Estados específicos para Canvas com Moldura
  const [selectedFrameColor, setSelectedFrameColor] = useState<string | null>(null);
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string | null>(null);

  // ✅ EXEMPLO: Como carregar e usar as configurações de design centralizadas
  const productConfig = getPrintifyProduct(productId as string);

  // 2. ✅ INICIALIZAR ESTADOS COM OS VALORES DA "RECEITA" OFICIAL (se produto existe)
  const [scale, setScale] = useState(productConfig?.defaultDesign.scale || 1.05); // Ex: 1.05 para canvas
  const [position, setPosition] = useState({ 
    x: productConfig?.defaultDesign.x || 0.5,    // Ex: 0.5 (centro)
    y: productConfig?.defaultDesign.y || 0.5     // Ex: 0.5 (centro)
  });
  const [rotation, setRotation] = useState(productConfig?.defaultDesign.angle || 0); // Ex: 0
  const [edgeType, setEdgeType] = useState(productConfig?.defaultDesign.print_on_side || 'mirror'); // Ex: 'mirror' para canvas

  // Função utilitária: Validação consolidada
  const validatePurchase = () => {
    if (!selectedImageUrl) return 'Escolha uma arte primeiro para personalizar o seu canvas!';
    if (!selectedImageId) return 'ID da transformação não encontrado. Selecione a imagem novamente.';
    if (!userInfo) return 'Faça login para adicionar ao carrinho';
    if (selectedPrintifyVariantId === null) return 'Por favor, selecione as opções do produto.';
    if (!printifyProductId || !printifyImageId) return 'Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.';
    return null;
  };

  // Setup inicial do produto
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct?.category === 'canvas') {
        setProduct(foundProduct);
        if (foundProduct.variants?.length) {
          setSelectedPrintifyVariantId(foundProduct.variants[0].id);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct?.variants?.length) {
        setSelectedPrintifyVariantId(initialProduct.variants[0].id);
    }
  }, [productId, initialProduct, router]);

  // Setup para Canvas com Moldura - popular dropdowns
  useEffect(() => {
    if (product?.id === 'framed_canvas' && product.variants?.length) {
      const uniqueColors = new Set<string>();
      const uniqueSizes = new Set<string>();

      product.variants.forEach(variant => {
        const sizeMatch = variant.title.match(/(\d+" x \d+″|\d+" x \d+")/);
        if (sizeMatch?.[1]) uniqueSizes.add(sizeMatch[1]);

        const colorMatch = variant.title.match(/(Black|Espresso|White)/);
        if (colorMatch?.[1]) uniqueColors.add(colorMatch[1]);
      });

      const sortedColors = Array.from(uniqueColors).sort();
      const sortedSizes = Array.from(uniqueSizes).sort((a, b) => {
        const extractNum = (s: string) => parseInt(s.split('"')[0]);
        return extractNum(a) - extractNum(b);
      });

      if (sortedColors.length && !selectedFrameColor) {
        setSelectedFrameColor(sortedColors[0]);
      }
      if (sortedSizes.length && !selectedSizeLabel) {
        setSelectedSizeLabel(sortedSizes[0]);
      }
    }
  }, [product, selectedFrameColor, selectedSizeLabel]);

  // Encontrar variante com base na cor e tamanho (Canvas com Moldura)
  useEffect(() => {
    if (product?.id === 'framed_canvas' && selectedFrameColor && selectedSizeLabel) {
      const foundVariant = product.variants?.find(variant => {
        const variantSizeMatch = variant.title.match(/(\d+" x \d+″|\d+" x \d+")/);
        const variantColorMatch = variant.title.match(/(Black|Espresso|White)/);

        const extractedSize = variantSizeMatch?.[1] || '';
        const extractedColor = variantColorMatch?.[1] || '';

        const matchesSize = extractedSize === selectedSizeLabel;
        const matchesColor = selectedFrameColor === 'Castanho'
          ? extractedColor === 'Espresso' 
          : extractedColor === selectedFrameColor;

        return matchesSize && matchesColor;
      });

      if (foundVariant && foundVariant.id !== selectedPrintifyVariantId) {
        setSelectedPrintifyVariantId(foundVariant.id);
      }
    } else if (product?.id === 'custom_canvas' && !selectedPrintifyVariantId && product.variants?.length) {
      setSelectedPrintifyVariantId(product.variants[0].id);
    }
  }, [product, selectedFrameColor, selectedSizeLabel, selectedPrintifyVariantId]);

  // Calcular imageAdjustments apenas na primeira seleção
  useEffect(() => {
    if (selectedImageUrl && product && selectedPrintifyVariantId && !imageAdjustments) {
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (selectedVariant && product.printAreasConfig?.length) {
        const printAreaConfig = product.printAreasConfig[0];
        setImageAdjustments({
          x: 0.5,
          y: 0.5,
          scale: 1.0,
          rotation: printAreaConfig.defaultAngle || 0
        });
      }
    }
  }, [selectedImageUrl, product, selectedPrintifyVariantId, imageAdjustments]);

  // Estados para Quantity e Discounts (como mugs)
  const [quantity, setQuantity] = useState(1);

  // Cálculo de preços com descontos como mugs
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  const getBasePrice = () => {
    const basePrice = product?.basePrice || product?.price || 0;
    const variantAdjustment = product?.variants?.find(v => v.id === selectedPrintifyVariantId)?.priceAdjustment || 0;
    return basePrice + variantAdjustment;
  };

  const basePrice = getBasePrice();
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const savings = (basePrice - discountedPrice) * quantity;
  const totalPrice = discountedPrice * quantity;
  const canPurchase = !!selectedImageUrl && !!selectedImageId && !!userInfo && selectedPrintifyVariantId !== null && !!printifyProductId && !!printifyImageId;
  const isProcessingMockup = !printifyPreviewUrls.length && selectedImageUrl;

  // Handlers simplificados
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
  }, []);

  const handleAddToCart = async () => {
    const validationError = validatePurchase();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);
    try {
      const customizations: Record<string, string> = {};
      
      if (product!.id === 'framed_canvas') {
        customizations.frameColor = selectedFrameColor;
        customizations.size = selectedSizeLabel;
      } else {
        const variant = product!.variants?.find(v => v.id === selectedPrintifyVariantId);
        customizations.size = variant?.title;
      }

      // ✅ OS CAMPOS CRÍTICOS: A "receita" atual do produto (como números)
      // Removido pois agora vão diretamente para o objeto customizations

      CartService.addToCart({
        productId: productId as string,
        productName: product!.name,
        productCategory: product!.category || 'canvas',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId!,
        price: discountedPrice,
        quantity: quantity,
        customizations: {
          ...customizations,
          variantId: selectedPrintifyVariantId!, // Obrigatório agora
          // ✅ OS CAMPOS CRÍTICOS: A "receita" atual do produto (como números)
          scale: scale,                    // O valor atual do estado
          x: position.x,                   // A posição atual
          y: position.y,                   // A posição atual  
          angle: rotation,                 // A rotação atual
          print_on_side: edgeType,         // A configuração especial (canvas)
        },
        imageAdjustments,
      });

      toast.success('Canvas adicionado ao carrinho!', {
        description: 'Continue as compras ou vá para o checkout',
        action: {
          label: 'Ver Carrinho',
          onClick: () => router.push('/checkout'),
        },
      });

      // 4. ✅ LOGS PARA DEBUG
      console.log('🎨 Configuração de design carregada para', productId, productConfig?.defaultDesign);
      console.log('📊 Estados atuais:', { scale, position, rotation, edgeType });
      console.log('🛒 Item adicionado ao carrinho com configurações:', {
        scale, x: position.x, y: position.y, angle: rotation, print_on_side: edgeType
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => setIsGalleryModalOpen(true);

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    // Reset estados Printify para nova geração
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
    
    toast.success('Arte aplicada com sucesso!');
  };

  const handleImageAdjustmentChange = (adjustments: Partial<ImageAdjustments>) => {
    if (imageAdjustments) {
      setImageAdjustments({ 
        ...imageAdjustments, 
        ...adjustments, 
        x: 0.5 // Força X sempre centrado
      });
    }
  };

  // Condições auxiliares para botão - removidas duplicadas

  // Função para obter opções disponíveis (Canvas com Moldura)
  const getAvailableColors = () => {
    if (product?.id !== 'framed_canvas' || !product.variants) return [];
    const colors = new Set<string>();
    product.variants.forEach(variant => {
      const colorMatch = variant.title.match(/(Black|Espresso|White)/);
      if (colorMatch?.[1]) colors.add(colorMatch[1]);
    });
    return Array.from(colors).sort();
  };

  const getAvailableSizes = () => {
    if (product?.id !== 'framed_canvas' || !product.variants) return [];
    const sizes = new Set<string>();
    product.variants.forEach(variant => {
      const sizeMatch = variant.title.match(/(\d+" x \d+″|\d+" x \d+")/);
      if (sizeMatch?.[1]) sizes.add(sizeMatch[1]);
    });
    return Array.from(sizes).sort((a, b) => {
      const extractNum = (s: string) => parseInt(s.split('"')[0]);
      return extractNum(a) - extractNum(b);
    });
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ghibli-moss border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ghibli-earth">A carregar produto...</p>
        </div>
      </div>
    );
  }

  const currentPrice = (product.basePrice || product.price || 0) + (product.variants?.find(v => v.id === selectedPrintifyVariantId)?.priceAdjustment || 0);

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize o seu ${product.name} com as suas criações AI. Arte de alta qualidade em canvas premium.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4 pt-20 pb-6 sm:pt-24 sm:pb-8 lg:py-16">
          {/* 📱 MOBILE LAYOUT: Stack vertical completo */}
          <div className="lg:hidden">
            {/* Título e Preço destacados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl sm:text-3xl font-black text-ghibli-earth mb-3 drop-shadow-sm">
                🎨 {product.name}
              </h1>
              <div className="inline-block">
                <div className="text-4xl font-black text-ghibli-moss">
                  €{currentPrice.toFixed(2)}
                </div>
              </div>
            </motion.div>

            {/* Mockup Mobile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <div className="relative w-full h-[400px] bg-white rounded-2xl shadow-xl overflow-hidden border border-ghibli-sand/20">
                <ProductCanvas
                  selectedProduct={product}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={handleOpenGallery}
                  imageAdjustments={imageAdjustments}
                  onImageAdjust={setImageAdjustments}
                  selectedPrintifyVariantId={selectedPrintifyVariantId}
                  selectedImageId={selectedImageId}
                />
              </div>
            </motion.div>



            {/* Cards Mobile: Seletores e Informações */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              {/* Status Arte Mobile */}
              {selectedImageUrl && (
                <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={selectedImageUrl} className="w-12 h-12 rounded-lg object-cover border border-green-300" alt="Arte selecionada" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-800">✅ Arte Aplicada</p>
                        <p className="text-xs text-green-600">Transformação AI pronta</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleOpenGallery}
                        variant="outline"
                        className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Trocar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card Seletor de Tamanho/Opções - Mobile */}
              <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-lg">
                <CardContent className="p-4 space-y-4">
                  {product.id === 'framed_canvas' ? (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-ghibli-moss mb-2">🎨 Cor da Moldura</label>
                        <Select onValueChange={setSelectedFrameColor} value={selectedFrameColor || ''}>
                          <SelectTrigger className="w-full h-12 bg-white/80 border-2 border-ghibli-sand/40 rounded-xl">
                            <SelectValue placeholder="Escolha a cor">
                              {selectedFrameColor === 'Espresso' ? 'Castanho' : selectedFrameColor || 'Escolha a cor'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableColors().map((color) => (
                              <SelectItem key={color} value={color}>
                                {color === 'Espresso' ? 'Castanho' : color === 'Black' ? 'Preto' : color === 'White' ? 'Branco' : color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-ghibli-moss mb-2">📏 Tamanho</label>
                        <Select onValueChange={setSelectedSizeLabel} value={selectedSizeLabel || ''}>
                          <SelectTrigger className="w-full h-12 bg-white/80 border-2 border-ghibli-sand/40 rounded-xl">
                            <SelectValue placeholder="Escolha o tamanho" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableSizes().map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-ghibli-moss mb-2">📏 Tamanho do Canvas</label>
                      <Select
                        onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                        value={selectedPrintifyVariantId?.toString() || ''}
                      >
                        <SelectTrigger className="w-full h-12 bg-white/80 border-2 border-ghibli-sand/40 rounded-xl">
                          <SelectValue placeholder="Escolha o tamanho">
                            {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Escolha o tamanho'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {product.variants?.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id.toString()}>
                              {variant.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Botão Adicionar ao Carrinho - Mobile */}
              <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-lg">
                <CardContent className="p-4">
                  {isProcessingMockup ? (
                    <div className="py-6 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-ghibli-moss font-medium">Criando canvas mágico...</span>
                      </div>
                      <div className="text-xs text-ghibli-earth/70">✨ Aplicando transformação AI</div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAddToCart}
                      disabled={!canPurchase || loading}
                      className={`w-full py-6 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 ${
                        canPurchase
                          ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white transform hover:scale-[1.02]'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>A adicionar...</span>
                        </div>
                      ) : !userInfo ? (
                        'Faça Login para Continuar'
                      ) : !selectedImageUrl ? (
                        'Escolha uma Arte Primeiro'
                      ) : !selectedPrintifyVariantId ? (
                        'Selecione as Opções'
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>🛒</span>
                          <span>Adicionar ao Carrinho</span>
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Informações e Garantias - Mobile */}
              <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-lg">
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold text-ghibli-wood mb-3 text-center">
                    ✨ Canvas Premium
                  </h3>
                  <div className="space-y-3 text-sm text-ghibli-earth">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                      <span>Canvas de qualidade premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                      <span>Impressão de máxima qualidade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full"></div>
                      <span>Cores vibrantes e duradouras</span>
                    </div>
                    {product.id === 'framed_canvas' && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                        <span className="font-medium text-amber-700">Moldura elegante incluída 🖼️</span>
                      </div>
                    )}

                  </div>
                </CardContent>
              </Card>

              {/* Prompt de Login - Mobile */}
              {!userInfo && (
                <Card className="bg-blue-50/80 border-blue-200 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-blue-800 mb-3">
                      Faça login para personalizar este canvas com as suas criações AI
                    </p>
                    <Button
                      onClick={() => router.push('/')}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    >
                      Fazer Login
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>

          {/* 🖥️ DESKTOP LAYOUT: Layout Original */}
          <div className="hidden lg:block">


            <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {/* Left: Área de Visualização (2 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
                className="lg:col-span-2"
            >
                <div className="relative w-full h-[500px] lg:h-[700px] bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-ghibli-sand/20">
                <ProductCanvas
                  selectedProduct={product}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={handleOpenGallery}
                  imageAdjustments={imageAdjustments}
                  onImageAdjust={setImageAdjustments}
                  selectedPrintifyVariantId={selectedPrintifyVariantId}
                  selectedImageId={selectedImageId}
                />
              </div>

                {/* Controles de Arte - Desktop lado-a-lado */}
                <div className="flex justify-center gap-4">
                <Button
                  onClick={handleOpenGallery}
                  disabled={!userInfo}
                    className={`px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl ${
                    userInfo 
                      ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                    <Upload className="w-5 h-5 mr-3" />
                  {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
                </div>

                {/* Prompt de Login Desktop */}
              {!userInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                    className="mt-6 flex justify-center"
                  >
                    <Card className="bg-blue-50/80 border-blue-200 backdrop-blur-sm max-w-md">
                      <CardContent className="p-6 text-center">
                        <p className="text-blue-800 mb-4">
                        Faça login para personalizar este canvas com as suas criações AI
                      </p>
                      <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        Fazer Login
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

              {/* Right: Painel de Controlo Sticky (1 coluna) */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="lg:col-span-1"
              >
                <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-xl hover:shadow-2xl transition-shadow duration-300 sticky top-8">
                
                <ProductCardDecorations />
                
                  <CardContent className="relative z-10 p-6 space-y-4">
                  {/* Título + Preço + Quantidade */}
                  <div className="pb-3 sm:pb-4 border-b border-ghibli-sand/30 space-y-4">
                    <div className="text-center">
                      <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-ghibli-earth to-ghibli-wood bg-clip-text text-transparent leading-tight mb-2">
                        🎨 {product.name}
                    </h1>
                  </div>

                    {/* Preço e Quantidade */}
                    <div className="space-y-3">
                      {/* Preço Principal */}
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2 mb-1">
                          <span className="text-3xl sm:text-4xl font-black text-ghibli-moss">€{discountedPrice.toFixed(2)}</span>
                          {discount > 0 && (
                            <span className="text-lg text-gray-500 line-through">€{basePrice.toFixed(2)}</span>
                          )}
                          {discount > 0 && (
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              -{discount}%
                      </div>
                          )}
                        </div>
                        {discount > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            Poupa €{savings.toFixed(2)} com {discount}% desconto!
                          </p>
                        )}
                      </div>

                      {/* Seletor de Quantidade */}
                      <div className="bg-ghibli-cream/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-ghibli-earth">Quantidade:</span>
                          <div className="flex items-center gap-2 bg-white/80 rounded-lg p-1">
                            <Button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-md hover:bg-ghibli-moss/10 disabled:opacity-50"
                            >
                              <span className="w-4 h-4">-</span>
                            </Button>
                            
                            <span className="min-w-[2.5rem] text-center font-bold text-ghibli-earth">
                              {quantity}
                            </span>
                            
                            <Button
                              onClick={() => setQuantity(quantity + 1)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-md hover:bg-ghibli-moss/10"
                            >
                              <span className="w-4 h-4">+</span>
                            </Button>
                          </div>
                        </div>

                        {/* Mini destaques de desconto */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`text-center p-2 rounded-md transition-all ${
                            quantity >= 2 
                              ? 'bg-green-100 border border-green-300 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <div className="font-bold">2+ canvas</div>
                            <div>10% OFF</div>
                          </div>
                          <div className={`text-center p-2 rounded-md transition-all ${
                            quantity >= 3 
                              ? 'bg-green-100 border border-green-300 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <div className="font-bold">3+ canvas</div>
                            <div>15% OFF</div>
                          </div>
                        </div>

                        {/* Total */}
                        {quantity > 1 && (
                          <div className="border-t border-ghibli-sand/30 pt-2 mt-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-ghibli-earth">Total:</span>
                              <div className="text-right">
                                <div className="text-xl font-black text-ghibli-moss">€{totalPrice.toFixed(2)}</div>
                                <div className="text-xs text-ghibli-earth/70">
                                  {quantity} × €{discountedPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Arte */}
                  {selectedImageUrl && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <img src={selectedImageUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-green-300" alt="Arte selecionada" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-green-800 text-sm">✅ Arte Aplicada</p>
                        <p className="text-xs text-green-600 truncate">Transformação AI pronta</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleOpenGallery}
                        variant="outline"
                        className="text-xs px-3 py-1 border-green-300 text-green-700 hover:bg-green-100 shrink-0"
                      >
                        Trocar
                      </Button>
                    </div>
                  )}

                  {/* Descrição em Tópicos */}
                  <div className="space-y-2">
                    <ul className="text-sm space-y-1 text-ghibli-earth/80">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                        <span>Canvas de <span className="font-bold text-ghibli-moss">qualidade premium</span> {product.id === 'framed_canvas' ? 'com moldura elegante' : 'esticado'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-ghibli-moss rounded-full shrink-0"></div>
                        <span>Impressão de <span className="font-bold">alta definição</span> resistente ao desbotamento</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-ghibli-wood rounded-full shrink-0"></div>
                        <span className="font-bold text-ghibli-wood">Perfeito para decorar qualquer espaço</span>
                      </li>
                    </ul>
                  </div>

                  {/* Seletores específicos para Canvas com Moldura */}
                  {product.id === 'framed_canvas' && (
                    <>
                      {/* Seletor de Cor da Moldura */}
                      <div className="relative">
                        <Select
                          onValueChange={setSelectedFrameColor}
                          value={selectedFrameColor || ''}
                        >
                          <SelectTrigger className="w-full h-12 sm:h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md pl-3 sm:pl-4 pr-8 sm:pr-10">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-2 h-2 rounded-full bg-ghibli-moss shrink-0"></div>
                              <SelectValue placeholder="Escolha a cor da moldura">
                                <span className="truncate">
                                  {selectedFrameColor === 'Espresso' ? 'Castanho' : selectedFrameColor || 'Escolha a cor da moldura'}
                                </span>
                            </SelectValue>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60 shadow-xl">
                            {getAvailableColors().map((color) => (
                              <SelectItem key={color} value={color} className="hover:bg-ghibli-cream/50">
                                {color === 'Espresso' ? 'Castanho' : color === 'Black' ? 'Preto' : color === 'White' ? 'Branco' : color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <label className="absolute -top-2 left-2 sm:left-3 px-2 bg-white text-xs font-bold text-ghibli-moss">
                          🎨 Cor da Moldura
                        </label>
                      </div>

                      {/* Seletor de Tamanho */}
                      <div className="relative">
                        <Select
                          onValueChange={setSelectedSizeLabel}
                          value={selectedSizeLabel || ''}
                        >
                          <SelectTrigger className="w-full h-12 sm:h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md pl-3 sm:pl-4 pr-8 sm:pr-10">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-2 h-2 rounded-full bg-ghibli-moss shrink-0"></div>
                              <SelectValue placeholder="Escolha o tamanho">
                                <span className="truncate">
                                  {selectedSizeLabel || 'Escolha o tamanho'}
                                </span>
                            </SelectValue>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60 shadow-xl">
                            {getAvailableSizes().map((size) => (
                              <SelectItem key={size} value={size} className="hover:bg-ghibli-cream/50">
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <label className="absolute -top-2 left-2 sm:left-3 px-2 bg-white text-xs font-bold text-ghibli-moss">
                          📏 Tamanho
                        </label>
                      </div>
                    </>
                  )}

                  {/* Seletor para Canvas Sem Moldura */}
                  {product.id === 'custom_canvas' && (
                    <div className="relative">
                      <Select
                        onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                        value={selectedPrintifyVariantId?.toString() || ''}
                      >
                        <SelectTrigger className="w-full h-12 sm:h-14 bg-white/80 backdrop-blur-sm border-2 border-ghibli-sand/40 rounded-xl text-ghibli-earth font-medium hover:border-ghibli-moss/60 focus:border-ghibli-moss transition-all duration-200 shadow-sm hover:shadow-md pl-3 sm:pl-4 pr-8 sm:pr-10">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-2 h-2 rounded-full bg-ghibli-moss shrink-0"></div>
                            <SelectValue placeholder="Escolha o tamanho">
                              <span className="truncate">
                                {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Escolha o tamanho'}
                              </span>
                            </SelectValue>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60 shadow-xl">
                          {product.variants?.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id.toString()} className="hover:bg-ghibli-cream/50">
                              {variant.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <label className="absolute -top-2 left-2 sm:left-3 px-2 bg-white text-xs font-bold text-ghibli-moss">
                        📏 Tamanho
                      </label>
                    </div>
                  )}

                  {/* Botão Principal */}
                  <div className="pt-3">
                    {isProcessingMockup ? (
                      <div className="w-full py-5 sm:py-6 bg-gradient-to-r from-ghibli-moss/50 to-ghibli-moss-light/50 rounded-xl lg:rounded-2xl text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-ghibli-moss rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-ghibli-moss font-medium text-sm sm:text-base">Criando o seu canvas mágico...</span>
                        </div>
                        <div className="mt-2 text-xs text-ghibli-earth/70">✨ Aplicando transformação AI</div>
                      </div>
                    ) : (
                    <Button
                      onClick={handleAddToCart}
                      disabled={!canPurchase || loading}
                        className={`group relative w-full py-5 sm:py-6 text-base sm:text-lg font-bold rounded-xl lg:rounded-2xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] border-0 ${
                        canPurchase
                            ? 'bg-gradient-to-br from-ghibli-moss via-ghibli-moss-light to-ghibli-moss hover:from-ghibli-moss-light hover:via-ghibli-moss hover:to-ghibli-moss-light text-white' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                      }`}
                      >
                        {/* Shimmer effect */}
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
                      ) : !selectedPrintifyVariantId ? (
                            <span className="text-center">Selecione as Opções</span>
                      ) : (
                        <>
                              <span className="text-lg sm:text-xl">🛒</span>
                              <span className="hidden sm:inline">Adicionar ao Carrinho</span>
                              <span className="sm:hidden">Adicionar</span>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                              </div>
                        </>
                      )}
                        </span>
                          </Button>
                    )}
                  </div>

                  {/* Grid de Garantias */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">Canvas Premium</span>
                    </div>
                    
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">Impressão HD</span>
                    </div>
                    
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">~1 semana</span>
                    </div>
                    
                    <div className="group p-3 sm:p-4 bg-gradient-to-br from-ghibli-cream/40 to-ghibli-cream/20 rounded-lg sm:rounded-xl hover:from-ghibli-cream/60 hover:to-ghibli-cream/30 transition-all duration-300 text-center border border-ghibli-sand/30">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-full bg-ghibli-moss/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4 text-ghibli-moss" />
                      </div>
                      <span className="text-xs font-bold text-ghibli-earth">Garantia Total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

// Geração estática dos paths para produtos de canvas
export const getStaticPaths: GetStaticPaths = async () => {
  const canvasProducts = getPrintifyProductsByCategory('canvas');
  const paths = Object.keys(canvasProducts).map((productId) => ({
    params: { productId }
  }));

  return {
    paths,
    fallback: false
  };
};

// Geração estática das props
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);
  
  if (!product || product.category !== 'canvas') {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default CanvasDetailPage; 