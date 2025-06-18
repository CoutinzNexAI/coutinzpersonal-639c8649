import React, { useState, useEffect, useCallback } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Truck, Award, Check, Upload, RotateCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
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

interface PhoneCaseDetailPageProps {
  product: PrintifyProductMapping;
}

const PhoneCaseDetailPage: React.FC<PhoneCaseDetailPageProps> = ({ product: initialProduct }) => {
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

  // Estado específico para seleção de variante da capa
  const [selectedPrintifyVariantId, setSelectedPrintifyVariantId] = useState<number | null>(null);

  // Estado para armazenar dados da última transformação (sem aplicar automaticamente)
  const [latestTransformationData, setLatestTransformationData] = useState<{ url: string; id: string } | null>(null);

  // Fallback para carregamento dinâmico (caso não haja product das props)
  useEffect(() => {
    if (!initialProduct && typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      if (foundProduct && foundProduct.category === 'tecnologia') {
        setProduct(foundProduct);
        if (foundProduct.id === 'custom_phone_case' && foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedPrintifyVariantId(foundProduct.variants[0].id);
        }
      } else {
        router.push('/shop');
        toast.error('Produto não encontrado');
      }
    } else if (initialProduct) {
      // Set default variant for initial product
      if (initialProduct.id === 'custom_phone_case' && initialProduct.variants && initialProduct.variants.length > 0) {
        setSelectedPrintifyVariantId(initialProduct.variants[0].id);
      }
    }
  }, [productId, initialProduct, router]);

  // Reset estados quando a variante muda (mesmo se já há imagem selecionada)
  useEffect(() => {
    if (selectedImageUrl && selectedPrintifyVariantId) {
      // Reset mockups Printify para forçar nova geração quando variante muda
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
    }
  }, [selectedPrintifyVariantId]); // Só depende da variante

  // Calcular defaultScale dinâmico e atualizar imageAdjustments
  useEffect(() => {
    if (selectedImageUrl && product && selectedPrintifyVariantId) {
      const selectedVariant = product.variants?.find(v => v.id === selectedPrintifyVariantId);
      if (selectedVariant && product.printAreasConfig && product.printAreasConfig.length > 0) {
        const printAreaConfig = product.printAreasConfig[0]; // Assumindo apenas uma área de impressão para capas

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
  }, [selectedImageUrl, product, selectedPrintifyVariantId]); // Dependências para re-calcular

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
          // Armazenar os dados sem aplicar automaticamente
          setLatestTransformationData({ url: data.outputUrl, id: data.id });
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

    // Validação específica para capas - variante selecionada
    if (selectedPrintifyVariantId === null) {
      toast.error('Por favor, selecione um modelo de telemóvel.');
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
      console.log('🛒 Adicionando capa ao carrinho com valores:', {
        productId: productId as string,
        printifyProductId,
        printifyImageId,
        printifyVariantId: variantIdToSend,
        selectedImageUrl,
        selectedImageId
      });

      // Adicionar item ao carrinho usando o CartService - COM PRINTIFY IDs
      const cartItem = CartService.addToCart({
        productId: productId as string,
        productName: product.name,
        productCategory: product.category || 'tecnologia',
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId,
        price: product.basePrice || product.price || 0,
        quantity: 1,
        customizations: {
          phoneModel: product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Modelo não encontrado'
        },
        imageAdjustments: imageAdjustments,
        printifyProductId: printifyProductId,
        printifyImageId: printifyImageId,
        printifyVariantId: variantIdToSend,
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
    setImageAdjustments(undefined);
  };

  const handleUseLatestArt = () => {
    if (latestTransformationData) {
      setSelectedImageUrl(latestTransformationData.url);
      setSelectedImageId(latestTransformationData.id);
      
      // Reset mockups para gerar novos
      setPrintifyPreviewUrls([]);
      setPrintifyImageId('');
      setPrintifyProductId('');
      
      // Limpar dados da última transformação para não mostrar novamente
      setLatestTransformationData(null);
      
      toast.success('Última arte aplicada com sucesso!');
    }
  };

  const handleImageAdjustmentChange = (adjustments: Partial<ImageAdjustments>) => {
    if (imageAdjustments) {
      // Manter X sempre centrado (0.5) - não permitir alteração
      setImageAdjustments({ 
        ...imageAdjustments, 
        ...adjustments, 
        x: 0.5 // Forçar X sempre centrado
      });
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

  return (
    <>
      <Head>
        <title>{product.name} - Loja PicTuz</title>
        <meta name="description" content={`Personalize a sua ${product.name} com as suas criações AI. Proteção premium para o seu telemóvel com design único.`} />
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
            {/* Coluna da Esquerda - Área Maximizada de Visualização (2 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              {/* Área Principal de Visualização OTIMIZADA - Mais Alta */}
              <div className="relative w-full h-[700px] bg-white rounded-2xl shadow-xl overflow-hidden mb-6 border border-ghibli-sand/20">
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
                      ? 'bg-gradient-to-r from-ghibli-moss to-ghibli-moss/90 hover:from-ghibli-moss/90 hover:to-ghibli-moss text-white' 
                      : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-5 h-5 mr-3" />
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
                        Faça login para personalizar esta capa com as suas criações AI
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

            {/* Coluna da Direita - Informações em Cartões (1 coluna) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Cartão: Título e Preço DESTACADO */}
              <Card className="bg-gradient-to-br from-white to-ghibli-cream/30 backdrop-blur-sm border-ghibli-sand/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold text-ghibli-earth mb-4">
                    {product.name}
                  </h1>
                  <div className="bg-gradient-to-r from-ghibli-moss/10 to-ghibli-moss/5 rounded-xl p-4 border-l-4 border-ghibli-moss">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-ghibli-moss drop-shadow-sm">
                        €{(product.basePrice || product.price || 0).toFixed(2)}
                      </span>
                      <span className="text-sm text-ghibli-earth/70 font-medium">
                        IVA incluído
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-ghibli-earth/70 mt-4 leading-relaxed">
                    Proteja o seu telemóvel com estilo único! Materiais premium com as suas criações AI.
                  </p>
                </CardContent>
              </Card>

              {/* Cartão: Seleção de Modelo DESTACADO */}
              <Card className="bg-gradient-to-br from-white to-ghibli-sand/20 backdrop-blur-sm border-ghibli-sand/40 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <label className="block text-sm font-bold text-ghibli-earth mb-4 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-ghibli-moss" />
                    Modelo do Telemóvel
                  </label>
                  <Select
                    onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                    value={selectedPrintifyVariantId?.toString() || ''}
                  >
                    <SelectTrigger className="w-full bg-white border-2 border-ghibli-sand/60 text-ghibli-earth h-14 shadow-sm hover:border-ghibli-moss/50 focus:border-ghibli-moss transition-colors duration-200 font-medium">
                      <SelectValue placeholder="Selecione um modelo">
                        {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Selecione um modelo'}
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
                </CardContent>
              </Card>

              {/* Cartão: Características em Grid de Chips MELHORADO */}
              <Card className="bg-gradient-to-br from-white to-ghibli-moss/5 backdrop-blur-sm border-ghibli-sand/30 shadow-md">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-ghibli-cream/60 to-ghibli-cream/30 rounded-xl p-4 text-center hover:scale-105 transition-transform duration-200 shadow-sm">
                      <Shield className="w-7 h-7 text-ghibli-moss mx-auto mb-2 drop-shadow-sm" />
                      <span className="text-xs font-bold text-ghibli-earth">Proteção</span>
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

              {/* Cartão: Arte Sugerida - só aparece se não há arte selecionada */}
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

              {/* Cartão: Botão Adicionar ao Carrinho SUPER DESTACADO */}
              <Card className="bg-gradient-to-br from-white to-ghibli-moss/5 backdrop-blur-sm border-ghibli-sand/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedImageUrl || loading || !printifyProductId || !printifyImageId || !selectedPrintifyVariantId}
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
                    ) : !selectedPrintifyVariantId ? (
                      'Selecione o Modelo'
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
                      <span className="text-sm text-ghibli-earth">Proteção premium</span>
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

// Geração estática dos paths para produtos de tecnologia
export const getStaticPaths: GetStaticPaths = async () => {
  const tecnologiaProducts = getPrintifyProductsByCategory('tecnologia');
  const paths = Object.keys(tecnologiaProducts).map((productId) => ({
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

  if (!product || product.category !== 'tecnologia') {
    return {
      notFound: true
    };
  }

  return {
    props: { product }
  };
};

export default PhoneCaseDetailPage; 