import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProduct, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import ProductCanvas from '@/components/printify/ProductCanvas';

interface ImageAdjustments {
  x: number;          // Posição X da imagem dentro da área de impressão (0-1, percentagem)
  y: number;          // Posição Y da imagem dentro da área de impressão (0-1, percentagem)
  scale: number;      // Zoom (escala, 1 = tamanho original)
  rotation?: number;  // Rotação em graus (se suportada pelo produto)
  cropArea?: {        // Área de crop da imagem original
    x: number;        // X do crop em percentagem da imagem original
    y: number;        // Y do crop em percentagem da imagem original
    width: number;    // Largura do crop em percentagem da imagem original
    height: number;   // Altura do crop em percentagem da imagem original
  };
}

const ProductDetailPage: React.FC = () => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  // NOVO: Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');

  // Carregar produto baseado no ID
  useEffect(() => {
    if (typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      setProduct(foundProduct);
      
      if (!foundProduct) {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    }
  }, [productId, router]);

  const fetchUserLatestTransformation = useCallback(async () => {
    if (!userInfo?.id || !session?.access_token) return;

    try {
      // Buscar a última transformação do utilizador
      const response = await fetch('/api/transformations/latest', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.outputUrl && data.id) {
          setSelectedImageUrl(data.outputUrl);
          setSelectedImageId(data.id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar última transformação:', error);
      // Não definir imagem padrão - deixar o utilizador escolher
    }
  }, [userInfo?.id, session?.access_token]);

  // Obter imagem transformada do utilizador (se estiver autenticado)
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

    setLoading(true);

    try {
      // Adicionar item ao carrinho usando o CartService - COM PRINTIFY IDs
      const cartItem = CartService.addToCart({
        productId: productId as string,
        productUid: product.productUid,
        productName: product.name,
        productCategory: product.category,
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId, // ✅ CRITICAL: Passar o ID da transformação
        price: product.price,
        quantity: 1,
        customizations: {
          size: `${product.gelatoPrintDimensionsMm.width}×${product.gelatoPrintDimensionsMm.height}mm`
        },
        imageAdjustments: imageAdjustments, // Passar os ajustes da imagem
        printifyImageId: printifyImageId || undefined, // ✅ NOVO: Passar Printify Image ID
        printifyProductId: printifyProductId || undefined // ✅ NOVO: Passar Printify Product ID
      });

      // Simular pequeno delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Produto adicionado ao carrinho!', {
        description: 'Continue comprando ou vá para o checkout',
        action: {
          label: 'Ver Carrinho',
          onClick: () => router.push('/checkout')
        }
      });

      // Trigger cart update event
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar produto ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDifferentImage = () => {
    if (userInfo) {
      // Se o utilizador está autenticado, abrir modal da galeria
      setIsGalleryModalOpen(true);
    } else {
      // Se não está autenticado, redirecionar para login/home
      router.push('/');
    }
  };

  const handleSelectImageFromGallery = (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId); // ✅ NOVO: Guardar o ID da transformação selecionada
    // Reset estados Printify quando nova imagem é selecionada
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setIsGalleryModalOpen(false);
    toast.success('Arte selecionada!', {
      description: 'A sua transformação foi aplicada ao produto'
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

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize o seu ${product.name} com as suas criações AI. Impressão profissional e entrega rápida.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-ghibli-cream to-ghibli-sand">
        <Header />
        
        <main className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          {/* Breadcrumb simplificado */}
          <div className="mb-8">
            <nav className="text-sm text-ghibli-earth">
              <Link href="/shop" className="hover:text-ghibli-moss transition-colors">
                ← Voltar à Loja
              </Link>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Editor Visual */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-semibold text-ghibli-wood mb-4">
                  👁️ Pré-visualização
                </h2>
                
                {/* ProductCanvas Printify */}
                {selectedImageUrl && userInfo?.id ? (
                  <ProductCanvas
                    selectedProduct={product}
                    userImageUrl={selectedImageUrl}
                    userId={userInfo.id}
                    printifyGeneratedPreviewUrls={printifyPreviewUrls}
                    onPreviewReady={handlePreviewReady}
                    imageAdjustments={imageAdjustments}
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">
                        {userInfo 
                          ? 'Selecione uma imagem para ver a pré-visualização' 
                          : 'Faça login para personalizar este produto'}
                      </p>
                      <Button 
                        onClick={handleSelectDifferentImage}
                        className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white"
                      >
                        {userInfo ? '🎨 Escolher Arte AI' : '🎨 Criar Transformação AI'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botão para Selecionar Imagem */}
                {selectedImageUrl && (
                  <div className="mt-6 space-y-3">
                    {/* Indicador de Arte Selecionada */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-green-800">
                        <span>✅</span>
                        <span>Arte AI aplicada com sucesso!</span>
                      </div>
                    </div>
                    
                    {/* Botão para trocar */}
                    <Button 
                      variant="outline"
                      onClick={handleSelectDifferentImage}
                      className="w-full"
                    >
                      🔄 Trocar Arte
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Informações do Produto */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-3xl font-bold text-ghibli-wood mb-4">
                  {product.name}
                </h1>
                
                <div className="text-2xl font-semibold text-ghibli-moss mb-6">
                  €{product.price.toFixed(2)}
                </div>

                <div className="space-y-4 text-ghibli-earth">
                  <div>
                    <h3 className="font-semibold mb-2">📏 Especificações</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Dimensões: {product.gelatoPrintDimensionsMm.width}×{product.gelatoPrintDimensionsMm.height}mm</li>
                      <li>• Categoria: {product.category}</li>
                      <li>• Impressão profissional de alta qualidade</li>
                      <li>• Entrega rápida e segura</li>
                    </ul>
                  </div>

                  {product.supportsManualAdjustment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">🎛️ Ajustes Personalizados</h4>
                      <p className="text-sm text-blue-700">
                        Este produto permite ajustar a posição, zoom e rotação da sua imagem 
                        para um resultado perfeito.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedImageUrl || loading}
                    className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white py-3 text-lg font-semibold"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        A adicionar...
                      </>
                    ) : (
                      <>🛒 Adicionar ao Carrinho</>
                    )}
                  </Button>
                  
                  {!selectedImageUrl && (
                    <p className="text-sm text-ghibli-earth mt-2 text-center">
                      Selecione uma arte AI para continuar
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* TODO: Adicionar TransformationsModal quando necessário */}
      {/* {isGalleryModalOpen && (
        <TransformationsModal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          onSelectImage={handleSelectImageFromGallery}
        />
      )} */}
    </>
  );
};

export default ProductDetailPage; 