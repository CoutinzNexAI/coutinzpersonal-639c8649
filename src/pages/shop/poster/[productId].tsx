import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, Check, RotateCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';
import ProductCanvas from '@/components/printify/ProductCanvas';
import { ChevronLeft } from 'lucide-react';
import { getPrintifyProduct, getPrintifyProductsByCategory, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
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

interface PosterDetailPageProps {
  product: PrintifyProductMapping;
}

const PosterDetailPage: React.FC<PosterDetailPageProps> = ({ product: initialProduct }) => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(initialProduct || null);
  // Inicializar os estados como vazios/nulos
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustments | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [mockupImageUrl, setMockupImageUrl] = useState<string | null>(null);
  
  // Estados para Printify
  const [printifyPreviewUrls, setPrintifyPreviewUrls] = useState<string[]>([]);
  const [printifyImageId, setPrintifyImageId] = useState<string>('');
  const [printifyProductId, setPrintifyProductId] = useState<string>('');

  // Estado específico para seleção de variante do poster
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // Estado específico para Poster - FIXO em "mirror"
  const [selectedEdgeType] = useState<string>('mirror');

  // Estado para seleção de tamanho (para posters)
  const [selectedSizeLabel, setSelectedSizeLabel] = useState<string | null>(null);

  // Fallback para carregamento dinâmico (caso não haja product das props)
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'poster') {
        setProduct(foundProduct);
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedPrintifyVariantId(foundProduct.variants[0].id);
          // Extrair tamanho do primeiro variant
          const firstVariantTitle = foundProduct.variants[0].title;
          const sizeMatch = firstVariantTitle.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
          if (sizeMatch) {
            setSelectedSizeLabel(sizeMatch[1]);
          }
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct) {
      // Set default variant for initial product
      if (initialProduct.variants && initialProduct.variants.length > 0) {
        setSelectedPrintifyVariantId(initialProduct.variants[0].id);
        // Extrair tamanho do primeiro variant
        const firstVariantTitle = initialProduct.variants[0].title;
        const sizeMatch = firstVariantTitle.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
        if (sizeMatch) {
          setSelectedSizeLabel(sizeMatch[1]);
        }
      }
    }
  }, [productId, initialProduct, router]);

  // useEffect para encontrar selectedPrintifyVariantId com base no tamanho selecionado
  useEffect(() => {
    if (product && selectedSizeLabel && product.variants) {
      const foundVariant = product.variants.find(variant => 
        variant.title.includes(selectedSizeLabel)
      );

      if (foundVariant && foundVariant.id !== selectedPrintifyVariantId) {
        setSelectedPrintifyVariantId(foundVariant.id);
      } else if (!foundVariant && selectedPrintifyVariantId !== null) {
        setSelectedPrintifyVariantId(null);
        toast.error('Combinação de tamanho não encontrada para o Poster.');
      }
    }
  }, [selectedSizeLabel, product, selectedPrintifyVariantId]);

  // Reset estados quando a variante muda
  useEffect(() => {
    if (selectedImageUrl && selectedPrintifyVariantId) {
      // Reset mockups Printify para forçar nova geração quando variante muda
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
    }
  }, [selectedPrintifyVariantId, selectedSizeLabel]);

  // Calcular defaultScale dinâmico e atualizar imageAdjustments
  useEffect(() => {
    if (selectedImageUrl && product && selectedPrintifyVariantId) {
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (selectedVariant && product.printAreasConfig && product.printAreasConfig.length > 0) {
        const printAreaConfig = product.printAreasConfig[0]; // Assumindo apenas uma área de impressão para poster

        // Dimensões da sua arte em pixels
        const userImageWidth = 1016;
        const userImageHeight = 1016;

        // Dimensões do placeholder da variante selecionada
        const placeholderWidth = selectedVariant.placeholderWidth;
        const placeholderHeight = selectedVariant.placeholderHeight;

        // Calcular defaultScale para 'slice'
        const initialScale = Math.max(placeholderWidth / userImageWidth, placeholderHeight / userImageHeight);

        // Define os ajustes iniciais para a imagem - SEMPRE CENTRADO
        setImageAdjustments({
          x: 0.5, // SEMPRE centrado horizontalmente
          y: 0.5, // SEMPRE centrado verticalmente
          scale: initialScale, // Use o scale calculado
          rotation: 0 // Sem rotação inicial
        });
      }
    }
  }, [selectedImageUrl, product, selectedPrintifyVariantId]);

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
    // Mostrar toast se não há arte selecionada
    if (!selectedImageUrl) {
      toast.error('Escolha uma arte primeiro para personalizar o seu poster!');
      return;
    }

    if (!product) {
      toast.error('Produto não encontrado.');
      return;
    }

    if (!userInfo) {
      toast.error('Faça login para adicionar ao carrinho');
      return;
    }

    // Validação específica para poster - variante selecionada
    if (selectedPrintifyVariantId === null) {
      toast.error('Por favor, selecione um tamanho.');
      return;
    }

    // ✅ NOVO: Validação dos IDs Printify necessários
    if (!printifyProductId || !printifyImageId) {
      toast.error('Os mockups ainda estão a ser gerados. Aguarde um momento e tente novamente.');
      return;
    }

    // Usar a variante selecionada pelo usuário
    const variantIdToSend = selectedPrintifyVariantId;
    if (!variantIdToSend) {
      toast.error('ID da variante do produto não encontrado. Contacte o suporte.');
      return;
    }

    setLoading(true);

    try {
      // ✅ DEBUG: Log dos valores antes de adicionar ao carrinho
      console.log('🛒 Adicionando poster ao carrinho com valores:', {
        productId: productId as string,
        printifyProductId,
        printifyImageId,
        printifyVariantId: variantIdToSend,
        selectedImageUrl,
        selectedImageId
      });

      // Obter variante selecionada
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);

      // Adicionar item ao carrinho usando o CartService - COM PRINTIFY IDs
      const cartItem = CartService.addToCart({
        productId: productId as string,
        productName: product.name,
        productCategory: product.category || 'poster',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId, // ID da imagem já processada
        price: product.basePrice || product.price || 0,
        quantity: 1,
        customizations: {
          variant: selectedVariant?.title || 'Opção não encontrada',
          // Para Canvas sem borda (custom_canvas) E Canvas com moldura (framed_canvas) E Posters
          ...(product.id === 'custom_canvas' || product.id === 'framed_canvas' || product.id.includes('poster_') ? { canvasEdgeType: 'mirror' } : {}),
          // Para Canvas com moldura
          ...(product.id === 'framed_canvas' && { frameColor: 'N/A' }),
          // Para Posters
          ...(product.id.includes('poster_') ? { paperType: 'Semi Glossy' } : {}),
        },
        imageAdjustments: imageAdjustments,
        printifyProductId: printifyProductId,
        printifyImageId: printifyImageId,
        printifyVariantId: variantIdToSend,
      });

      console.log('✅ Item adicionado ao carrinho:', cartItem);
      toast.success(`${product.name} adicionado ao carrinho!`);
      router.push('/checkout');

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

    // --- PASSO 1: Carregar a imagem transformada para a Printify Media Library ---
    toast.loading('A carregar arte para Printify...');
    setLoading(true);

    try {
      const printifyUploadResponse = await fetch('/api/printify/uploads/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl, // URL da imagem transformada (ex: do Supabase)
          fileName: `transformed-image-${imageId || Date.now()}.png`
        }),
      });

      const uploadData = await printifyUploadResponse.json();

      if (printifyUploadResponse.ok && uploadData.success && uploadData.imageId) {
        // --- PASSO 2: Atualizar estados com o ID e URL da Printify ---
        setSelectedImageId(uploadData.imageId); // ESTE É O ID VÁLIDO DA PRINTIFY!
        setSelectedImageUrl(uploadData.previewUrl || imageUrl); // Usa o URL Printify retornado
        
        // Reset mockups para gerar novos
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

  const handleResetSelection = () => {
    setSelectedImageUrl('');
    setSelectedImageId(null);
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
  };

  const handleImageAdjustmentChange = (adjustments: Partial<ImageAdjustments>) => {
    setImageAdjustments(prev => ({
      x: prev?.x || 0.5,
      y: prev?.y || 0.5,
      scale: prev?.scale || 1,
      rotation: prev?.rotation || 0,
      ...adjustments
    }));
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2D5A27] mx-auto mb-4"></div>
          <p className="text-[#4A6B5B]">A carregar produto...</p>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
  const finalPrice = (product.basePrice || 0) + (selectedVariant?.priceAdjustment || 0);

  return (
    <>
      <Head>
        <title>{`${product.name} - Poster Personalizado | PicTuz`}</title>
        <meta name="description" content={`Personalize o seu ${product.name} com as suas criações AI. Alta qualidade e entrega rápida.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#FAF8F0] via-[#F5F1E8] to-[#E8E0D0]">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="text-sm text-[#4A6B5B] space-x-2">
              <Link href="/shop" className="hover:text-[#2D5A27] transition-colors">Loja</Link>
              <span>›</span>
              <Link href="/shop/poster" className="hover:text-[#2D5A27] transition-colors">Posters</Link>
              <span>›</span>
              <span className="text-[#2D5A27] font-medium">{product.name}</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna da Esquerda - Área Maximizada de Visualização (2 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              {/* Área Principal de Visualização OTIMIZADA - Mais Alta */}
              <div className="relative w-full h-[700px] bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-[#E8E0D0]">
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

              {/* Botão "Escolher Arte" SEMPRE VISÍVEL - CTA Principal */}
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
                      ? 'bg-gradient-to-r from-[#2D5A27] to-[#2D5A27]/90 hover:from-[#2D5A27]/90 hover:to-[#2D5A27] text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  {selectedImageUrl ? 'Trocar Arte' : 'Escolher Arte'}
                </Button>
              </motion.div>

              {/* Prompt de Login (apenas se não autenticado) */}
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
                        Faça login para personalizar este poster com as suas criações AI
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

            {/* PAINEL DE CONTROLO UNIFICADO - Coluna da Direita */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              {/* CARTÃO PRINCIPAL - Painel de Controlo Único */}
              <Card className="bg-gradient-to-br from-white to-[#F5F1E8]/30 backdrop-blur-sm border-[#E8E0D0]/30 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8 space-y-6">
                  {/* 1. TÍTULO */}
                  <div>
                    <h1 className="text-3xl font-bold text-[#2D5A27] mb-2">
                      {product.name}
                    </h1>
                  </div>

                  {/* 2. PREÇO */}
                  <div className="bg-gradient-to-r from-[#2D5A27]/10 to-[#2D5A27]/5 rounded-xl p-4 border-l-4 border-[#2D5A27]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-[#2D5A27] drop-shadow-sm">
                        €{finalPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-[#4A6B5B]/70 font-medium">
                        IVA incluído
                      </span>
                    </div>
                  </div>

                  {/* 3. INCENTIVO DE VENDA - NOVO */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        🚚 Entrega gratuita em encomendas &gt; €50
                      </span>
                    </div>
                  </div>

                  {/* 4. DESCRIÇÃO */}
                  <div>
                    <p className="text-sm text-[#4A6B5B]/80 leading-relaxed">
                      Transforme a sua arte AI num poster de alta qualidade! Impressão semi brilho premium com cores vibrantes e duradouras, perfeito para decorar qualquer espaço.
                    </p>
                  </div>

                  {/* 5. SELETOR DE TAMANHO (APENAS TAMANHO PARA POSTERS) */}
                  <div>
                    <label className="block text-sm font-bold text-[#2D5A27] mb-3 flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-[#2D5A27]" />
                      Escolha o Tamanho
                    </label>
                    <Select
                      onValueChange={(value) => {
                        // Encontrar o variant com base no título selecionado
                        const selectedVariant = product.variants?.find(v => v.title.includes(value));
                        if (selectedVariant) {
                          setSelectedSizeLabel(value);
                          setSelectedPrintifyVariantId(selectedVariant.id);
                        }
                      }}
                      value={selectedSizeLabel || ''}
                    >
                      <SelectTrigger className="w-full bg-white border-2 border-[#E8E0D0]/60 text-[#2D5A27] h-14 shadow-sm hover:border-[#2D5A27]/50 focus:border-[#2D5A27] transition-colors duration-200 font-medium">
                        <SelectValue placeholder="Selecione um tamanho">
                          {selectedSizeLabel || 'Selecione um tamanho'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-white text-[#2D5A27] border-[#E8E0D0] max-h-60 shadow-xl">
                        {/* Obter tamanhos únicos e ordenados */}
                        {Array.from(new Set(
                          product.variants?.map(v => {
                            const sizeMatch = v.title.match(/(\d+\.?\d*["″]? x \d+\.?\d*["″]? \((Horizontal|Vertical)\))/);
                            return sizeMatch ? sizeMatch[1] : null;
                          }).filter(Boolean)
                        )).sort((a, b) => {
                          // Ordenação por área (largura x altura)
                          const parseSize = (s: string) => {
                            const parts = s.replace(/["″()]/g, '').split(' x ').map(part => parseFloat(part));
                            return parts[0] * parts[1]; // área total
                          };
                          return parseSize(a || '') - parseSize(b || '');
                        }).map(size => (
                          <SelectItem key={size} value={size || ''} className="hover:bg-[#F5F1E8]/50">
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 6. BLOCO DE AÇÕES - LÓGICA CONDICIONAL */}
                  <div className="pt-4">
                    {/* BOTÃO PRINCIPAL - Estado Condicional */}
                    <Button
                      onClick={handleAddToCart}
                      disabled={!selectedImageUrl || loading || !printifyProductId || !printifyImageId || !selectedPrintifyVariantId || !userInfo}
                      className={`w-full py-5 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform ${
                        selectedImageUrl && printifyProductId && printifyImageId && selectedPrintifyVariantId && userInfo
                          ? 'hover:scale-[1.02] bg-gradient-to-r from-[#2D5A27] via-[#2D5A27] to-[#2D5A27]/90 hover:from-[#2D5A27]/90 hover:via-[#2D5A27] hover:to-[#2D5A27] text-white border-0' 
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
                        'Selecione o Tamanho'
                      ) : (!printifyProductId || !printifyImageId) ? (
                        <>
                          <RotateCw className="w-5 h-5 mr-3 animate-spin" />
                          A gerar preview...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🛒</span>
                          Adicionar ao Carrinho - €{finalPrice.toFixed(2)}
                        </>
                      )}
                    </Button>

                    {/* Informação Extra sobre Arte Selecionada */}
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
                              Transformação AI aplicada
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

                  {/* 7. BLOCO DE CONFIANÇA (Garantias) */}
                  <div className="pt-6 border-t border-[#E8E0D0]/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Shield className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">Qualidade Premium</span>
                      </div>
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Sparkles className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">Semi Brilho HD</span>
                      </div>
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Truck className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">Entrega 3-5d</span>
                      </div>
                      <div className="bg-gradient-to-br from-[#F5F1E8]/60 to-[#F5F1E8]/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                        <Award className="w-6 h-6 text-[#2D5A27] mx-auto mb-2 drop-shadow-sm" />
                        <span className="text-xs font-bold text-[#2D5A27]">30d Garantia</span>
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
  const posterProducts = getPrintifyProductsByCategory('poster');
  const productIds = Object.keys(posterProducts);
  
  const paths = productIds.map((productId) => ({
    params: { productId }
  }));

  return {
    paths,
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.productId as string;
  const product = getPrintifyProduct(productId);
  
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

export default PosterDetailPage; 