import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { getPrintifyProduct, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { ImageAdjustments } from '@/types/product';

interface PosterHorizontalPageProps {
  product: PrintifyProductMapping;
}

const PosterHorizontalPage: React.FC<PosterHorizontalPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
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
  const [currentMockupUrls, setCurrentMockupUrls] = useState<string[]>([]);
  const [activeMockupIndex, setActiveMockupIndex] = useState<number>(0);

  // ✅ QUANTIDADE: Estado para a quantidade de posters
  const [quantity, setQuantity] = useState(1);

  // Calculate discount and prices
  const calculateDiscount = (qty: number) => {
    if (qty >= 3) return 15;
    if (qty >= 2) return 10;
    return 0;
  };

  const basePrice = product?.basePrice || 20;
  const discount = calculateDiscount(quantity);
  const discountedPrice = basePrice * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const savings = (basePrice * quantity) - totalPrice;

  const canPurchase = selectedImageUrl && selectedImageId && userInfo && selectedPrintifyVariantId && printifyProductId && printifyImageId;

  // Setup inicial do produto - Forçar poster horizontal
  useEffect(() => {
    const foundProduct = getPrintifyProduct('poster_horizontal_semi_glossy');
    if (foundProduct && foundProduct.category === 'poster') {
      setProduct(foundProduct);
      if (foundProduct.variants && foundProduct.variants.length > 0) {
        setSelectedPrintifyVariantId(foundProduct.variants[0].id);
      }
    } else {
      router.push('/shop');
      toast.error('Produto não encontrado');
    }
  }, [router]);

  // Calcular defaultScale dinâmico
  useEffect(() => {
    if (selectedImageUrl && product && selectedPrintifyVariantId) {
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (!selectedVariant) return;

      const { placeholderWidth, placeholderHeight } = selectedVariant;
      const scaleToCover = Math.max(
        placeholderWidth / 1016,
        placeholderHeight / 1016
      );
      const finalImageWidth = 1016 * scaleToCover;
      const printifyScale = finalImageWidth / placeholderWidth;
      
      setImageAdjustments({
        x: 0.5,
        y: 0.5,
        scale: printifyScale,
        rotation: 0
      });
    }
  }, [selectedImageUrl, product, selectedPrintifyVariantId]);

  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
    
    if (data.previewUrls.length > 0 && currentMockupUrls.length === 0) {
      setCurrentMockupUrls(data.previewUrls);
      setActiveMockupIndex(0);
    }
  }, [currentMockupUrls]);

  const handleAddToCart = async () => {
    if (!canPurchase) {
      toast.error('Complete a configuração do produto primeiro');
      return;
    }

    setLoading(true);

    try {
      const selectedVariant = product!.variants?.find(v => v.id === selectedPrintifyVariantId);

      CartService.addToCart({
        productId: 'poster_horizontal_semi_glossy',
        productName: 'Poster Horizontal',
        productCategory: 'poster',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId,
        price: selectedVariant?.priceAdjustment || 20,
        quantity: quantity,
        customizations: {
          variantId: selectedPrintifyVariantId!,
          size: selectedVariant?.title || 'Tamanho não encontrado',
          scale: imageAdjustments?.scale || 1.05,
          x: imageAdjustments?.x || 0.5,
          y: imageAdjustments?.y || 0.5,
          angle: imageAdjustments?.rotation || 0,
          print_on_side: 'mirror',
        },
        imageAdjustments: imageAdjustments,
      });

      toast.success(`${quantity}x Poster Horizontal adicionado ao carrinho!`);
      
    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => {
    if (!userInfo) {
      toast.error('Faça login para aceder à sua galeria de transformações');
      return;
    }
    setIsGalleryModalOpen(true);
  };

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setIsGalleryModalOpen(false);
    
    if (!imageUrl) {
      toast.error('URL da imagem transformada não encontrado.');
      return;
    }

    toast.loading('A carregar arte para Printify...');
    setLoading(true);

    try {
      const printifyUploadResponse = await fetch('/api/printify/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl,
          fileName: `transformed-image-${imageId || Date.now()}.png`
        }),
      });

      const uploadData = await printifyUploadResponse.json();

      if (printifyUploadResponse.ok && uploadData.success && uploadData.imageId) {
        setSelectedImageId(uploadData.imageId);
        setSelectedImageUrl(uploadData.previewUrl || imageUrl);
        
        setPrintifyPreviewUrls([]);
        setPrintifyImageId('');
        setPrintifyProductId('');
        
        toast.dismiss();
        toast.success('Arte carregada para Printify com sucesso!');
      } else {
        toast.dismiss();
        toast.error(uploadData.error || 'Erro ao carregar arte para Printify. Tente novamente.');
        setSelectedImageId(null);
        setSelectedImageUrl('');
      }
    } catch (error) {
      console.error('❌ Erro no upload da arte para Printify:', error);
      toast.dismiss();
      toast.error('Erro na comunicação ao carregar arte para Printify.');
      setSelectedImageId(null);
      setSelectedImageUrl('');
    } finally {
      setLoading(false);
    }
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

  const currentPrice = product.basePrice || product.price || 0;

  return (
    <>
      <Head>
        <title>Poster Horizontal Personalizado - Loja PicTuz</title>
        <meta name="description" content="Personalize o seu Poster Horizontal com as suas criações AI. Impressão de máxima qualidade." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-2 sm:px-4 pt-20 pb-6 sm:pt-12 sm:pb-8 lg:py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
              <li><Link href="/shop" className="hover:text-ghibli-moss transition-colors">Loja</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li><Link href="/shop/poster" className="hover:text-ghibli-moss transition-colors">Posters</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li className="text-ghibli-moss font-medium">Poster Horizontal</li>
            </ol>
          </nav>

          {/* 📱 MOBILE LAYOUT */}
          <div className="block lg:hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6 px-4"
            >
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent leading-tight mb-4 tracking-tight">
                Poster Horizontal 🖼️
              </h1>
              <div className="text-4xl sm:text-5xl font-black text-ghibli-moss drop-shadow-lg tracking-tight">
                €{currentPrice.toFixed(2)}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6"
            >
              <div className="relative w-full h-[250px] bg-white rounded-2xl shadow-xl overflow-hidden mb-4 border border-ghibli-sand/20">
                <ProductCanvas
                  selectedProduct={product}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={currentMockupUrls.length > 0 ? currentMockupUrls : printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={handleOpenGallery}
                  imageAdjustments={imageAdjustments}
                  onImageAdjust={setImageAdjustments}
                  selectedPrintifyVariantId={selectedPrintifyVariantId}
                  selectedImageId={selectedImageId}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="px-4 mb-6"
            >
              {userInfo ? (
                <div className="text-center">
                  <Button
                    onClick={handleOpenGallery}
                    className="px-6 py-3 text-base font-semibold shadow-lg transition-all duration-300 rounded-xl bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Escolher Arte
                  </Button>
                </div>
              ) : (
                <Card className="bg-ghibli-moss/10 border-ghibli-moss/30 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-ghibli-earth text-sm mb-3 font-medium">
                      🎨 Entre para personalizar o seu poster
                    </p>
                    <Button className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white border-0">
                      Fazer Login
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="px-4 mb-6"
            >
              <Card className="bg-white/90 backdrop-blur-sm border-ghibli-sand/30 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-ghibli-wood">Quantidade:</span>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-8 w-8 p-0 border-ghibli-moss/30 hover:bg-ghibli-moss/10"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-bold text-lg min-w-[2rem] text-center text-ghibli-wood">{quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-8 w-8 p-0 border-ghibli-moss/30 hover:bg-ghibli-moss/10"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ghibli-earth">Preço unitário:</span>
                      <span className="font-medium">€{basePrice.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Desconto ({discount}%):</span>
                          <span className="font-medium">-€{savings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ghibli-earth">Preço com desconto:</span>
                          <span className="font-medium">€{discountedPrice.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold text-ghibli-moss border-t border-ghibli-sand/30 pt-2">
                      <span>Total:</span>
                      <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="px-4"
            >
              <Button
                onClick={handleAddToCart}
                disabled={!canPurchase || loading}
                className={`w-full py-4 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 ${
                  canPurchase 
                    ? 'bg-gradient-to-r from-ghibli-moss via-ghibli-wood to-ghibli-moss text-white hover:scale-[1.02]' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canPurchase 
                  ? `Adicionar ao Carrinho • €${totalPrice.toFixed(2)}` 
                  : 'Escolha uma arte primeiro'
                }
              </Button>
            </motion.div>
          </div>

          {/* 💻 DESKTOP LAYOUT */}
          <div className="hidden lg:grid lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-ghibli-sand/20 aspect-[4/3]">
                  <ProductCanvas
                    selectedProduct={product}
                    userImageUrl={selectedImageUrl}
                    userId={userInfo?.id}
                    printifyGeneratedPreviewUrls={currentMockupUrls.length > 0 ? currentMockupUrls : printifyPreviewUrls}
                    onPreviewReady={handlePreviewReady}
                    onSelectImage={handleOpenGallery}
                    imageAdjustments={imageAdjustments}
                    onImageAdjust={setImageAdjustments}
                    selectedPrintifyVariantId={selectedPrintifyVariantId}
                    selectedImageId={selectedImageId}
                  />
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="sticky top-8"
              >
                <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-2xl">
                  <CardContent className="p-8 space-y-8">
                    <div className="text-center pb-6 border-b border-ghibli-sand/30">
                      <h1 className="text-3xl font-black bg-gradient-to-r from-ghibli-earth via-ghibli-wood to-ghibli-moss bg-clip-text text-transparent mb-3">
                        Poster Horizontal 🖼️
                      </h1>
                      <div className="text-5xl font-black text-ghibli-moss mb-2">
                        €{currentPrice.toFixed(2)}
                      </div>
                      <p className="text-ghibli-earth">Impressão de máxima qualidade</p>
                    </div>

                    <div>
                      {userInfo ? (
                        <div className="text-center">
                          <Button
                            onClick={handleOpenGallery}
                            className="px-8 py-4 text-lg font-bold shadow-lg transition-all duration-300 rounded-xl bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 text-white hover:scale-105"
                          >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Escolher Arte
                          </Button>
                        </div>
                      ) : (
                        <Card className="bg-ghibli-moss/10 border-ghibli-moss/30">
                          <CardContent className="p-6 text-center">
                            <p className="text-ghibli-earth mb-4 font-medium">
                              🎨 Entre para personalizar o seu poster
                            </p>
                            <Button className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white">
                              Fazer Login
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-ghibli-wood">Quantidade:</span>
                        <div className="flex items-center gap-4">
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="h-10 w-10 p-0 border-ghibli-moss/30 hover:bg-ghibli-moss/10"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-2xl min-w-[3rem] text-center text-ghibli-wood">{quantity}</span>
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setQuantity(quantity + 1)}
                            className="h-10 w-10 p-0 border-ghibli-moss/30 hover:bg-ghibli-moss/10"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {quantity < 2 ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800 text-sm">
                            💡 <strong>Dica:</strong> Compre 2+ posters e poupe 10% | 3+ posters e poupe 15%
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800 text-sm font-medium">
                            🎉 Está a poupar {discount}% nesta compra!
                          </p>
                        </div>
                      )}

                      <div className="space-y-3 text-base">
                        <div className="flex justify-between">
                          <span className="text-ghibli-earth">Preço unitário:</span>
                          <span className="font-medium">€{basePrice.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                          <>
                            <div className="flex justify-between text-green-600">
                              <span>Desconto ({discount}%):</span>
                              <span className="font-medium">-€{savings.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ghibli-earth">Preço com desconto:</span>
                              <span className="font-medium">€{discountedPrice.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between text-xl font-bold text-ghibli-moss border-t border-ghibli-sand/30 pt-3">
                          <span>Total:</span>
                          <span>€{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-6 border-t border-ghibli-sand/30">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Shield className="w-6 h-6 text-ghibli-moss" />
                        </div>
                        <p className="text-xs text-ghibli-earth font-medium">Qualidade Garantida</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Truck className="w-6 h-6 text-ghibli-moss" />
                        </div>
                        <p className="text-xs text-ghibli-earth font-medium">Envio Rápido</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-ghibli-moss/10 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Award className="w-6 h-6 text-ghibli-moss" />
                        </div>
                        <p className="text-xs text-ghibli-earth font-medium">Impressão Premium</p>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={!canPurchase || loading}
                      className={`w-full py-4 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 transform ${
                        canPurchase 
                          ? 'bg-gradient-to-r from-ghibli-moss via-ghibli-wood to-ghibli-moss hover:shadow-2xl hover:scale-[1.02] text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canPurchase 
                        ? `Adicionar ao Carrinho • €${totalPrice.toFixed(2)}` 
                        : 'Escolha uma arte primeiro'
                      }
                    </Button>
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

export const getStaticProps: GetStaticProps = async () => {
  const product = getPrintifyProduct('poster_horizontal_semi_glossy');
  
  if (!product || product.category !== 'poster') {
    return {
      notFound: true
    };
  }

  return {
    props: {
      product
    }
  };
};

export default PosterHorizontalPage; 