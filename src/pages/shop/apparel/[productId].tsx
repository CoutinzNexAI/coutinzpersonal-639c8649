import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { Shield, Sparkles, Truck, Award, Check, RotateCw } from 'lucide-react';
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

interface ApparelDetailPageProps {
  product: PrintifyProductMapping;
}

const ApparelDetailPage: React.FC<ApparelDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
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

  // Estado para armazenar dados da última transformação
  const [latestTransformationData, setLatestTransformationData] = useState<{ url: string; id: string } | null>(null);

  // Fallback para carregamento dinâmico (caso não haja product das props)
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'apparel') {
        setProduct(foundProduct);
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    }
  }, [productId, initialProduct, router]);

  // Fetch da última transformação do utilizador
  const fetchUserLatestTransformation = useCallback(async () => {
    if (!userInfo?.id || !session?.access_token) return;

    try {
      const response = await fetch('/api/transformations/latest', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.outputUrl && data.id) {
          setLatestTransformationData({ url: data.outputUrl, id: data.id });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar última transformação:', error);
    }
  }, [userInfo?.id, session?.access_token]);

  useEffect(() => {
    if (userInfo && product && session?.access_token) {
      fetchUserLatestTransformation();
    }
  }, [userInfo, product, session?.access_token, fetchUserLatestTransformation]);

  // Função para lidar com os mockups gerados pelo ProductCanvas
  const handlePreviewReady = useCallback((data: {
    previewUrls: string[];
    printifyImageId: string;
    printifyProductId: string;
  }) => {
    setPrintifyPreviewUrls(data.previewUrls);
    setPrintifyImageId(data.printifyImageId);
    setPrintifyProductId(data.printifyProductId);
    console.log('✅ Printify mockups received:', data);
  }, []);

  const handleAddToCart = async () => {
    if (!product || !selectedImageUrl) {
      toast.error('Selecione uma imagem para personalizar o produto');
      return;
    }

    if (!selectedImageId) {
      toast.error('ID da transformação não encontrado. Selecione a imagem novamente.');
      return;
    }

    if (!userInfo) {
      toast.error('Faça login para adicionar ao carrinho');
      return;
    }

    if (!printifyProductId || !printifyImageId) {
      toast.error('Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.');
      return;
    }

    setLoading(true);

    try {
      const cartItem = CartService.addToCart({
        productId: productId as string,
        productUid: product.productUid,
        productName: product.name,
        productCategory: product.category,
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId,
        price: product.price,
        quantity: 1,
        customizations: {
          size: `${product.gelatoPrintDimensionsMm.width}×${product.gelatoPrintDimensionsMm.height}mm`
        },
        imageAdjustments: imageAdjustments,
        printifyImageId: printifyImageId,
        printifyProductId: printifyProductId,
        printifyVariantId: product.printifyVariantIds?.[0] || 0
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('T-shirt adicionada ao carrinho!', {
        description: 'Continue comprando ou vá para o checkout',
        action: {
          label: 'Ver Carrinho',
          onClick: () => router.push('/checkout')
        }
      });

      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGallery = () => {
    if (userInfo) {
      setIsGalleryModalOpen(true);
    } else {
      toast.error('Faça login para aceder à galeria');
    }
  };

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    setIsGalleryModalOpen(false);
    
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    
    toast.success('Arte selecionada com sucesso!');
  };

  const handleResetSelection = () => {
    setSelectedImageUrl('');
    setSelectedImageId(null);
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
  };

  const handleUseLatestArt = () => {
    if (latestTransformationData) {
      setSelectedImageUrl(latestTransformationData.url);
      setSelectedImageId(latestTransformationData.id);
      
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
      
      toast.success('Arte aplicada com sucesso!');
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto mb-4"></div>
          <p className="text-[#4A6B5B]">A carregar produto...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} - T-shirt Personalizada | PicTuz</title>
        <meta name="description" content={`Personalize a sua ${product.name} com as suas criações AI. Algodão premium, impressão de alta qualidade e entrega rápida.`} />
        <meta name="keywords" content="t-shirt personalizada, roupa personalizada, impressão digital, algodão premium" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0]">
        <Header />
        
        <main className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
            {/* Coluna Esquerda: Preview do Produto (700px altura) */}
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-[#E8E0D0] h-[700px]">
                {product && (
                  <ProductCanvas
                    selectedProduct={product}
                    userImageUrl={selectedImageUrl}
                    userId={userInfo?.id}
                    onPreviewReady={handlePreviewReady}
                    imageAdjustments={imageAdjustments}
                  />
                )}
              </div>

              {/* Botão "Escolher Arte" sempre visível */}
              <div className="mt-6">
                <Button
                  onClick={handleOpenGallery}
                  disabled={!userInfo}
                  className="w-full py-4 text-lg font-bold bg-gradient-to-r from-[#4A6B5B] to-[#2D5A27] hover:from-[#2D5A27] hover:to-[#4A6B5B] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  size="lg"
                >
                  {!userInfo ? 'Faça Login para Personalizar' : selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
              </div>
            </motion.div>

            {/* Coluna Direita: Informações do Produto em Cards */}
            <motion.div 
              className="lg:col-span-2 space-y-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Cartão: Preço e Título DESTACADO */}
              <Card className="bg-gradient-to-br from-white via-[#F5F1E8] to-[#E8E0D0] backdrop-blur-sm border-[#B8A082] shadow-xl border-2">
                <CardContent className="p-8">
                  <div className="text-center">
                    <h1 className="text-4xl font-black text-[#2D5A27] mb-4 leading-tight drop-shadow-sm">
                      {product.name}
                    </h1>
                    <div className="bg-gradient-to-r from-[#4A6B5B] to-[#2D5A27] text-white rounded-2xl py-4 px-6 mb-4 shadow-lg">
                      <span className="text-3xl font-black">
                        €{product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-ghibli-earth/70 mt-4 leading-relaxed">
                    Vista a sua arte! T-shirt em algodão premium com as suas criações AI.
                  </p>
                </CardContent>
              </Card>

              {/* Cartão: Características em Grid de Chips */}
              <Card className="bg-gradient-to-br from-white to-ghibli-moss/5 backdrop-blur-sm border-ghibli-sand/30 shadow-md">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                      <Shield className="w-7 h-7 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                      <span className="text-xs font-bold text-ghibli-earth">Algodão Premium</span>
                    </div>
                    <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                      <Sparkles className="w-7 h-7 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                      <span className="text-xs font-bold text-ghibli-earth">Impressão HD</span>
                    </div>
                    <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                      <Truck className="w-7 h-7 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                      <span className="text-xs font-bold text-ghibli-earth">Entrega Rápida</span>
                    </div>
                    <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                      <Award className="w-7 h-7 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                      <span className="text-xs font-bold text-ghibli-earth">30d Garantia</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cartão: Arte Sugerida */}
              {!selectedImageUrl && latestTransformationData && userInfo && (
                <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-blue-200/50 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-ghibli-earth mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Arte Sugerida
                    </h3>
                    <div className="flex items-center space-x-4">
                      <img
                        src={latestTransformationData.url}
                        alt="Última arte criada"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-blue-300 shadow-sm"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-ghibli-earth/80 mb-3">
                          Última transformação criada
                        </p>
                        <Button
                          onClick={handleUseLatestArt}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          Usar Esta Arte
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cartão: Arte Selecionada */}
              {selectedImageUrl && (
                <Card className="bg-gradient-to-br from-ghibli-moss/10 to-ghibli-earth/5 backdrop-blur-sm border-ghibli-moss/20 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-ghibli-earth mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-ghibli-moss" />
                      Arte Selecionada
                    </h3>
                    <div className="flex items-center space-x-4">
                      <img
                        src={selectedImageUrl}
                        alt="Arte selecionada"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-ghibli-moss shadow-sm"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-ghibli-earth/80 mb-3">
                          Transformação AI aplicada
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleResetSelection}
                            variant="destructive"
                            className="text-xs"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cartão: Botão Adicionar ao Carrinho */}
              <Card className="bg-gradient-to-br from-white to-ghibli-moss/5 backdrop-blur-sm border-ghibli-sand/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedImageUrl || loading || !printifyProductId || !printifyImageId}
                    className="w-full py-5 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-r from-ghibli-moss via-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:via-ghibli-moss hover:to-ghibli-moss text-white border-0 disabled:opacity-50 disabled:transform-none disabled:bg-gray-400"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                        A adicionar...
                      </>
                    ) : !selectedImageUrl ? (
                      'Escolha uma Arte Primeiro'
                    ) : (!printifyProductId || !printifyImageId) ? (
                      <>
                        <RotateCw className="w-5 h-5 mr-3 animate-spin" />
                        A gerar mockups...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🛒</span>
                        Adicionar ao Carrinho
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Cartão: Garantias */}
              <Card className="bg-gradient-to-br from-ghibli-moss/5 to-ghibli-earth/5 backdrop-blur-sm border-ghibli-moss/20 shadow-md">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-ghibli-earth mb-4">Garantias</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-ghibli-moss flex-shrink-0" />
                      <span className="text-sm text-ghibli-earth">Entrega gratuita &gt; €50</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-ghibli-moss flex-shrink-0" />
                      <span className="text-sm text-ghibli-earth">Envio em 3-5 dias</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-ghibli-moss flex-shrink-0" />
                      <span className="text-sm text-ghibli-earth">Garantia 30 dias</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-ghibli-moss flex-shrink-0" />
                      <span className="text-sm text-ghibli-earth">Algodão 100% premium</span>
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

// Geração estática dos paths para produtos de roupa
export const getStaticPaths: GetStaticPaths = async () => {
  const apparelProducts = getPrintifyProductsByCategory('apparel');
  const paths = Object.keys(apparelProducts).map((productId) => ({
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

  if (!product || product.category !== 'apparel') {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default ApparelDetailPage; 