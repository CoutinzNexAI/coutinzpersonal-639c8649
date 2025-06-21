import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { Shield, Sparkles, Truck, Award, Upload, RotateCw, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import { toast } from '@/components/ui/sonner';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';

interface ImageAdjustments {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  cropArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AllImageAdjustments {
  logo: ImageAdjustments;
  customer: ImageAdjustments;
  phrase: ImageAdjustments;
}

interface RoupaDetailPageProps {
  product: PrintifyProductMapping;
}

const RoupaDetailPage: React.FC<RoupaDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(initialProduct || null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [allImageAdjustments, setAllImageAdjustments] = useState<AllImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [customerPrintifyImageId, setCustomerPrintifyImageId] = useState<string>('');
  const [dynamicPhrasePrintifyImageId, setDynamicPhrasePrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');
  const [displayedMockupUrl, setDisplayedMockupUrl] = useState<string>('');

  // Estados específicos para sweat
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);
  const [selectedPhraseText, setSelectedPhraseText] = useState<string>('Sem frase');

  // Fallback para carregamento dinâmico
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'roupa') {
        setProduct(foundProduct);
        setDisplayedMockupUrl(foundProduct.mockupInitialPath); // Set initial mockup URL
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedPrintifyVariantId(foundProduct.variants[0].id);
        }
        // Set default phrase
        if (foundProduct.printAreasConfig && foundProduct.printAreasConfig[1]?.dynamicTextOptions) {
          setSelectedPhraseText(foundProduct.printAreasConfig[1].dynamicTextOptions[0].text);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct) {
      setDisplayedMockupUrl(initialProduct.mockupInitialPath); // Set initial mockup URL
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        setSelectedPrintifyVariantId(initialProduct.variants[0].id);
      }
      if (initialProduct.printAreasConfig && initialProduct.printAreasConfig[1]?.dynamicTextOptions) {
        setSelectedPhraseText(initialProduct.printAreasConfig[1].dynamicTextOptions[0].text);
      }
    }
  }, [productId, initialProduct, router]);

  // Reset estados quando a variante ou frase muda
  useEffect(() => {
    if ((selectedImageUrl && selectedPrintifyVariantId) || selectedPhraseText) {
      // Reset mockups Printify para forçar nova geração
      setPrintifyPreviewUrls([]);
      setCustomerPrintifyImageId('');
      setDynamicPhrasePrintifyImageId('');
      setPrintifyProductId('');
      setDisplayedMockupUrl(product?.mockupInitialPath || ''); // Reset para mockup inicial
    }
  }, [selectedPrintifyVariantId, selectedPhraseText, product]);

  // Calcular posicionamento para múltiplas imagens
  useEffect(() => {
    if (product && product.printAreasConfig) {
      const logoConfig = product.printAreasConfig.find(area => area.position === 'front');
      const backConfig = product.printAreasConfig.find(area => area.position === 'back');
      
      if (logoConfig && backConfig) {
        setAllImageAdjustments({
          logo: {
            x: logoConfig.defaultX,
            y: logoConfig.defaultY,
            scale: logoConfig.defaultScale,
            rotation: logoConfig.defaultAngle
          },
          customer: {
            x: backConfig.defaultX,
            y: backConfig.defaultY,
            scale: backConfig.defaultScale,
            rotation: backConfig.defaultAngle
          },
          phrase: {
            x: 0.5,
            y: 0.85, // Posição da frase (mais em baixo)
            scale: 1.0,
            rotation: 0
          }
        });
      }
    }
  }, [product, selectedImageUrl, selectedPrintifyVariantId]);

  // Função para lidar com os mockups gerados
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    customerPrintifyImageId: string;
    dynamicPhrasePrintifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setCustomerPrintifyImageId(data.customerPrintifyImageId);
    setDynamicPhrasePrintifyImageId(data.dynamicPhrasePrintifyImageId);
    setPrintifyProductId(data.printifyProductId);
    
    // Atualizar a URL do mockup exibido para o primeiro preview da Printify
    if (data.previewUrls && data.previewUrls.length > 0) {
      setDisplayedMockupUrl(data.previewUrls[0]);
      console.log('✅ Mockup URL atualizada para:', data.previewUrls[0]);
    }
    
    console.log('✅ Printify mockups received:', data);
  }, []);

  const handleAddToCart = async () => {
    if (!selectedImageUrl) {
      toast.error('Escolha uma arte primeiro para personalizar a sua sweat!');
      return;
    }

    if (!product || !selectedImageId) {
      toast.error('ID da transformação não encontrado. Selecione a imagem novamente.');
      return;
    }

    if (!userInfo) {
      toast.error('Faça login para adicionar ao carrinho');
      return;
    }

    if (selectedPrintifyVariantId === null) {
      toast.error('Por favor, selecione uma cor e tamanho.');
      return;
    }

    if (!printifyProductId || !customerPrintifyImageId || !dynamicPhrasePrintifyImageId) {
      toast.error('Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.');
      return;
    }

    setLoading(true);

    try {
      console.log('🛒 Adicionando sweat ao carrinho com valores:', {
        productId: productId as string,
        printifyProductId,
        customerPrintifyImageId,
        dynamicPhrasePrintifyImageId,
        printifyVariantId: selectedPrintifyVariantId,
        selectedPhraseText,
        selectedImageUrl,
        selectedImageId
      });

      const cartItem = CartService.addToCart({
        productId: productId as string,
        productName: product.name,
        productCategory: product.category || 'roupa',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId,
        price: product.basePrice || product.price || 0,
        quantity: 1,
        customizations: {
          variant: product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Variante não encontrada',
          selectedPhraseText: selectedPhraseText
        },
        imageAdjustments: allImageAdjustments?.customer,
        printifyProductId: printifyProductId,
        printifyImageId: customerPrintifyImageId,
        printifyVariantId: selectedPrintifyVariantId,
        // Novos campos para sweat
        selectedPhraseText: selectedPhraseText,
        dynamicPhrasePrintifyImageId: dynamicPhrasePrintifyImageId,
      });

      console.log('✅ Item adicionado ao carrinho:', cartItem);
      toast.success(`${product.name} adicionada ao carrinho!`);
      router.push('/checkout');

    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho. Tente novamente.');
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
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    // Reset mockups para gerar novos
    setPrintifyPreviewUrls([]);
    setCustomerPrintifyImageId('');
    setDynamicPhrasePrintifyImageId('');
    setPrintifyProductId('');
    setDisplayedMockupUrl(product?.mockupInitialPath || ''); // Reset para mockup inicial
    
    toast.success('Arte selecionada com sucesso!');
  };

  const handleResetSelection = () => {
    setSelectedImageUrl('');
    setSelectedImageId(null);
    setPrintifyPreviewUrls([]);
    setCustomerPrintifyImageId('');
    setDynamicPhrasePrintifyImageId('');
    setPrintifyProductId('');
    setDisplayedMockupUrl(product?.mockupInitialPath || ''); // Reset para mockup inicial
    setAllImageAdjustments(undefined);
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

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize a sua ${product.name} com as suas criações AI. Qualidade premium com design único.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-ghibli-earth">
              <li><Link href="/shop" className="hover:text-ghibli-moss transition-colors">Loja</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li><Link href={`/shop/${product.category}`} className="hover:text-ghibli-moss transition-colors capitalize">{product.category}</Link></li>
              <li className="text-ghibli-earth/50">/</li>
              <li className="text-ghibli-moss font-medium">{product.name}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna da Esquerda - Visualização */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="relative w-full h-[700px] bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-ghibli-sand/20">
                <ProductCanvas
                  selectedProduct={product}
                  userImageUrl={selectedImageUrl}
                  userId={userInfo?.id}
                  printifyGeneratedPreviewUrls={printifyPreviewUrls}
                  onPreviewReady={handlePreviewReady}
                  onSelectImage={handleOpenGallery}
                  allImageAdjustments={allImageAdjustments}
                  selectedPrintifyVariantId={selectedPrintifyVariantId}
                  selectedPhraseText={selectedPhraseText}
                  mockupUrl={displayedMockupUrl}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex justify-center"
              >
                <Button
                  onClick={handleOpenGallery}
                  size="lg"
                  disabled={!userInfo}
                  className={`px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                    userInfo 
                      ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-5 h-5 mr-3" />
                  {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
              </motion.div>

              {!userInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="mt-4 flex justify-center"
                >
                  <Card className="bg-blue-50/80 border-blue-200 backdrop-blur-sm max-w-md">
                    <CardContent className="p-4 text-center">
                      <p className="text-blue-800 text-sm mb-3">
                        Faça login para personalizar esta sweat com as suas criações AI
                      </p>
                      <Button
                        onClick={() => router.push('/')}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        Fazer Login
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>

            {/* Painel de Controlo - Coluna da Direita */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 space-y-6">
                  {/* Título */}
                  <div>
                    <h1 className="text-3xl font-bold text-ghibli-earth mb-2">
                      Sweat de Criança Personalizada
                    </h1>
                  </div>

                  {/* Preço */}
                  <div className="bg-gradient-to-r from-ghibli-moss/10 to-ghibli-moss/5 rounded-xl p-4 border-l-4 border-ghibli-moss">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-ghibli-moss drop-shadow-sm">
                        €40.00
                      </span>
                      <span className="text-sm text-ghibli-earth/70 font-medium">
                        IVA incluído
                      </span>
                    </div>
                  </div>

                  {/* Incentivo de venda */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        🚚 Entrega gratuita em encomendas &gt; €50
                      </span>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <p className="text-sm text-ghibli-earth/80 leading-relaxed">
                      Sweat premium para criança com o teu logo na frente e a arte AI personalizada nas costas. Material confortável e durável, perfeita para o dia-a-dia!
                    </p>
                  </div>

                  {/* Seletor de Cor/Tamanho */}
                  <div>
                    <label className="block text-sm font-bold text-ghibli-earth mb-3 flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-ghibli-moss" />
                      Cor e Tamanho
                    </label>
                    <Select
                      onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                      value={selectedPrintifyVariantId?.toString() || ''}
                    >
                      <SelectTrigger className="w-full bg-white border-2 border-ghibli-sand/60 text-ghibli-earth h-14 shadow-sm hover:border-ghibli-moss/50 focus:border-ghibli-moss transition-colors duration-200 font-medium">
                        <SelectValue placeholder="Selecione cor e tamanho">
                          {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Selecione cor e tamanho'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60 shadow-xl">
                        {product.variants?.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id.toString()} className="hover:bg-ghibli-cream/50">
                            {variant.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seletor de Frase */}
                  <div>
                    <label className="block text-sm font-bold text-ghibli-earth mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-ghibli-moss" />
                      Frase nas Costas
                    </label>
                    <Select
                      onValueChange={(value) => setSelectedPhraseText(value)}
                      value={selectedPhraseText}
                    >
                      <SelectTrigger className="w-full bg-white border-2 border-ghibli-sand/60 text-ghibli-earth h-14 shadow-sm hover:border-ghibli-moss/50 focus:border-ghibli-moss transition-colors duration-200 font-medium">
                        <SelectValue placeholder="Escolha uma frase">
                          {selectedPhraseText}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60 shadow-xl">
                        {product.printAreasConfig?.[1]?.dynamicTextOptions?.map((option) => (
                          <SelectItem key={option.id} value={option.text} className="hover:bg-ghibli-cream/50">
                            {option.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão Principal */}
                  <div className="pt-4">
                    <Button
                      onClick={handleAddToCart}
                      disabled={!selectedImageUrl || loading || !printifyProductId || !customerPrintifyImageId || !selectedPrintifyVariantId || !userInfo}
                      className={`w-full py-5 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform ${
                        selectedImageUrl && printifyProductId && customerPrintifyImageId && selectedPrintifyVariantId && userInfo
                          ? 'hover:scale-[1.02] bg-gradient-to-r from-ghibli-moss via-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:via-ghibli-moss hover:to-ghibli-moss text-white border-0' 
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                      }`}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                          A adicionar...
                        </>
                      ) : !userInfo ? (
                        'Faça Login para Continuar'
                      ) : !selectedImageUrl ? (
                        'Escolha uma Arte Primeiro'
                      ) : !selectedPrintifyVariantId ? (
                        'Selecione Cor e Tamanho'
                      ) : (!printifyProductId || !customerPrintifyImageId) ? (
                        <>
                          <RotateCw className="w-5 h-5 mr-3 animate-spin" />
                          A gerar preview...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🛒</span>
                          Adicionar ao Carrinho
                        </>
                      )}
                    </Button>

                    {selectedImageUrl && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedImageUrl}
                            alt="Arte selecionada"
                            className="w-12 h-12 rounded-lg object-cover border border-green-300"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-800">
                              ✅ Arte selecionada
                            </p>
                            <p className="text-xs text-green-600">
                              Frase: {selectedPhraseText}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleResetSelection}
                            variant="outline"
                            className="text-xs border-green-300 text-green-700 hover:bg-green-100"
                          >
                            Trocar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bloco de Confiança */}
                  <div className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Shield className="w-6 h-6 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-ghibli-earth">Qualidade Premium</span>
                      </div>
                      <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Sparkles className="w-6 h-6 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-ghibli-earth">Impressão HD</span>
                      </div>
                      <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Truck className="w-6 h-6 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-ghibli-earth">Entrega 5-7d</span>
                      </div>
                      <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Award className="w-6 h-6 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-ghibli-earth">30d Garantia</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Modal de Galeria de Transformações */}
      <TransformationGalleryModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelectImage={handleSelectImageFromGallery}
      />
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const productsRecord = getPrintifyProductsByCategory('roupa');
  const products = Object.values(productsRecord);
  const paths = products.map((product) => ({
    params: { productId: product.id },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<RoupaDetailPageProps> = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);

  if (!product || product.category !== 'roupa') {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      product,
    },
    revalidate: 86400, // 24 hours
  };
};

export default RoupaDetailPage; 