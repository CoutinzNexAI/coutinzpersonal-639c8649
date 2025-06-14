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
  // NOVO: Estados para Draft Order da Gelato
  const [gelatoPreviewUrls, setGelatoPreviewUrls] = useState<string[]>([]);
  const [draftOrderId, setDraftOrderId] = useState<string>('');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

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

  // NOVO: Gerar mockup da Gelato quando imagem e produto estão disponíveis
  // REMOVIDO: generateGelatoMockup - substituído por createDraftOrder

  // NOVO: Criar Draft Order na Gelato para produtos automáticos
  const createDraftOrder = useCallback(async () => {
    if (!selectedImageUrl || !product || !userInfo?.id || !session?.access_token) return;
    
    // Só criar draft para produtos sem ajuste manual
    if (product.supportsManualAdjustment) return;

    setIsCreatingDraft(true);
    
    try {
      const response = await fetch('/api/gelato/mockups/create-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productId: productId as string,
          userImageUrl: selectedImageUrl,
          userId: userInfo.id
        })
      });

      const data = await response.json();
      
      // 🔍 DEBUG: Logs detalhados para ver o que está a chegar do backend
      console.log('=== RESPOSTA COMPLETA DO BACKEND ===');
      console.log('Response status:', response.status);
      console.log('Data completo:', data);
      console.log('data.success:', data.success);
      console.log('data.previewUrls:', data.previewUrls);
      console.log('Type of previewUrls:', typeof data.previewUrls);
      console.log('Length of previewUrls:', data.previewUrls?.length);
      console.log('data.draftOrderId:', data.draftOrderId);
      console.log('===================================');
      
      if (data.success) {
        // 🔍 A LINHA MAIS IMPORTANTE PARA O DEBUG AGORA:
        console.log('✅ URLs dos mockups recebidos no frontend:', data.previewUrls);
        
        setGelatoPreviewUrls(data.previewUrls || []);
        setDraftOrderId(data.draftOrderId || '');
        
        console.log('🔄 Estados atualizados no frontend:');
        console.log('- gelatoPreviewUrls será:', data.previewUrls || []);
        console.log('- draftOrderId será:', data.draftOrderId || '');
      } else {
        console.error('❌ API respondeu com sucesso mas success=false:', data);
        console.error('❌ Erro recebido:', data.error);
        // Fallback para preview local se Gelato falhar
        setGelatoPreviewUrls([]);
        setDraftOrderId('');
      }
    } catch (error) {
      console.error('Error creating draft order:', error);
      // Fallback para preview local se houver erro
      setGelatoPreviewUrls([]);
      setDraftOrderId('');
    } finally {
      setIsCreatingDraft(false);
    }
  }, [selectedImageUrl, product, userInfo?.id, session?.access_token, productId]);

  // Trigger Draft Order creation quando imagem muda
  useEffect(() => {
    createDraftOrder();
  }, [createDraftOrder]);

  const handlePreviewReady = (url: string, adjustments?: ImageAdjustments) => {
    setPreviewUrl(url);
    setImageAdjustments(adjustments);
  };

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
      // Adicionar item ao carrinho usando o CartService - COM DRAFT ORDER ID
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
        draftOrderId: draftOrderId || undefined // ✅ NOVO: Passar Draft Order ID se existir
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
    // Reset estados Gelato quando nova imagem é selecionada
    setGelatoPreviewUrls([]);
    setDraftOrderId('');
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
                
                {/* TODO: Migrar ProductCanvas para Printify */}
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Preview em desenvolvimento</p>
                </div>

                {/* Loading indicator para Draft Order */}
                {isCreatingDraft && selectedImageUrl && !product.supportsManualAdjustment && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>A gerar preview profissional...</span>
                    </div>
                  </div>
                )}

                {/* Botão para Selecionar Imagem */}
                {!selectedImageUrl ? (
                  <div className="mt-6 text-center">
                    <p className="text-ghibli-earth mb-4">
                      {userInfo 
                        ? 'Escolha uma das suas transformações AI' 
                        : 'Faça login para personalizar este produto'}
                    </p>
                    <Button 
                      onClick={handleSelectDifferentImage}
                      className="bg-ghibli-moss hover:bg-ghibli-moss/90 text-white"
                    >
                      {userInfo ? '🎨 Escolher Arte AI' : '🎨 Criar Transformação AI'}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {/* Indicador de Arte Selecionada */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-green-800">
                        <span>✅</span>
                        <span>Arte AI aplicada com sucesso!</span>
                      </div>
                    </div>
                    
                    {/* Botão para trocar */}
                    <div className="text-center">
                      <Button 
                        variant="outline"
                        onClick={handleSelectDifferentImage}
                        className="border-ghibli-sand text-ghibli-earth hover:bg-ghibli-sand/30"
                      >
                        🔄 Escolher Arte Diferente
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Detalhes do Produto */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-ghibli font-bold text-ghibli-wood mb-4">
                  {product.name}
                </h1>

                {/* Preço */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-6">
                  <div className="text-2xl font-bold text-ghibli-wood">
                    {product.price ? `€${product.price}` : 'A partir de €29.99'}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-ghibli-earth">+ envio</span>
                                         <span className="text-green-600 font-medium">• Envio grátis {'>'}€50</span>
                  </div>
                </div>

                {/* Especificações */}
                <div className="bg-white/80 backdrop-blur-sm border border-ghibli-sand/30 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-ghibli-wood mb-4">📋 Especificações</h3>
                  <div className="space-y-3 text-sm text-ghibli-earth">
                    <div className="flex justify-between">
                      <span>Dimensões:</span>
                      <span>{product.gelatoPrintDimensionsMm.width}×{product.gelatoPrintDimensionsMm.height}mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolução:</span>
                      <span>{product.printFileResolution} DPI</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categoria:</span>
                      <span className="capitalize">{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bleed:</span>
                      <span>{product.printFileBleed}mm</span>
                    </div>
                  </div>
                </div>

                {/* Características do Produto */}
                <div className="space-y-3 mb-8">
                  {product.category === 'canvas' && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-ghibli-earth">
                        <span>🌳</span>
                        <span>Moldura de madeira FSC certificada</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ghibli-earth">
                        <span>🎨</span>
                        <span>Canvas de alta qualidade para cores vívidas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ghibli-earth">
                        <span>📦</span>
                        <span>Pronto a pendurar, embalagem segura</span>
                      </div>
                    </>
                  )}
                  
                  {product.category === 'apparel' && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-ghibli-earth">
                        <span>👕</span>
                        <span>100% Algodão orgânico</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ghibli-earth">
                        <span>🌱</span>
                        <span>Produção sustentável</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ghibli-earth">
                        <span>✨</span>
                        <span>Impressão durável e resistente a lavagens</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Botão Adicionar ao Carrinho */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedImageUrl || loading}
                  className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white disabled:opacity-50 disabled:bg-gray-400 py-4 text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A adicionar...
                    </div>
                  ) : (
                    '🛒 Adicionar ao Carrinho'
                  )}
                </Button>

                {/* Informação de Envio */}
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <span>🚚</span>
                    <span>Envio grátis para Portugal em compras superiores a €50</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700 mt-1">
                    <span>⏱️</span>
                    <span>Produção em 3-5 dias úteis + envio</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* TODO: Migrar SocialProof para Printify */}
        </main>
        
        <Footer />

        {/* TODO: Migrar TransformationGalleryModal para Printify */}
      </div>
    </>
  );
};

export default ProductDetailPage; 