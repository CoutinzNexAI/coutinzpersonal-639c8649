import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPrintifyProduct, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { useAuth } from '@/hooks/useAuth';
import { CartService } from '@/lib/cart/cartService';
import ProductCanvas from '@/components/printify/ProductCanvas';
import TransformationGalleryModal from '@/components/shared/TransformationGalleryModal';

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

const PhoneCaseDetailPage: React.FC = () => {
  const router = useRouter();
  const { productId } = router.query;
  const { userInfo, session } = useAuth();
  
  const [product, setProduct] = useState<PrintifyProductMapping | null>(null);
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

  // Carregar produto baseado no ID
  useEffect(() => {
    if (typeof productId === 'string') {
      const foundProduct = getPrintifyProduct(productId);
      setProduct(foundProduct);
      
      if (!foundProduct) {
        router.push('/shop');
        toast.error('Produto não encontrado');
      } else if (foundProduct.id === 'custom_phone_case' && foundProduct.variants && foundProduct.variants.length > 0) {
        // Define a primeira variante como selecionada por padrão para capas
        setSelectedPrintifyVariantId(foundProduct.variants[0].id);
      }
    }
  }, [productId, router]);

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

        // Define os ajustes iniciais para a imagem
        setImageAdjustments({
          x: printAreaConfig.defaultX,
          y: printAreaConfig.defaultY,
          scale: initialScale, // Use o scale calculado
          rotation: printAreaConfig.defaultAngle // Ou 0 se não houver rotação inicial
        });
        // Reset mockups Printify para forçar nova geração com novos ajustes
        setPrintifyPreviewUrls([]);
        setPrintifyImageId('');
        setPrintifyProductId('');
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
        productUid: product.productUid,
        productName: product.name,
        productCategory: product.category,
        userImageUrl: selectedImageUrl,
        userImageId: selectedImageId, // ✅ CRITICAL: Passar o ID da transformação
        price: product.basePrice || product.price,
        quantity: 1,
        customizations: {
          phoneModel: product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Modelo não encontrado'
        },
        imageAdjustments: imageAdjustments, // Passar os ajustes da imagem
        printifyImageId: printifyImageId, // ✅ GARANTIDO: Não é undefined
        printifyProductId: printifyProductId, // ✅ GARANTIDO: Não é undefined
        printifyVariantId: variantIdToSend // ✅ GARANTIDO: Não é undefined
      });

      // ✅ DEBUG: Log do item adicionado ao carrinho
      console.log('✅ Capa adicionada ao carrinho:', cartItem);

      // ✅ DEBUG: Log do carrinho completo após adição
      const currentCart = CartService.getCart();
      console.log('🛒 Carrinho completo após adição:', currentCart);

      // Simular pequeno delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Capa adicionada ao carrinho!', {
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

  const handleOpenGallery = () => {
    if (userInfo) {
      setIsGalleryModalOpen(true);
    } else {
      // Se não está autenticado, redirecionar para login/home
      toast.error('Faça login para aceder às suas transformações');
      router.push('/');
    }
  };

  const handleSelectImageFromGallery = async (imageUrl: string, imageId: string) => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageId(imageId);
    // Reset estados Printify quando nova imagem é selecionada
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setIsGalleryModalOpen(false);
    toast.success('Arte selecionada!', {
      description: 'A gerar mockups automaticamente...'
    });
    
    // Disparar geração de mockups automaticamente após seleção
    // O ProductCanvas irá detectar a mudança da userImageUrl e gerar automaticamente
  };

  const handleResetSelection = () => {
    setSelectedImageUrl('');
    setSelectedImageId(null);
    setPrintifyPreviewUrls([]);
    setPrintifyImageId('');
    setPrintifyProductId('');
    setImageAdjustments(undefined);
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
            {/* Coluna da Esquerda - ProductCanvas (2 colunas de largura) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
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
            </motion.div>

            {/* Coluna da Direita - Informações do Produto (1 coluna de largura) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 space-y-4"
            >
              {/* Título e Preço */}
              <div>
                <h1 className="text-3xl font-bold text-ghibli-earth mb-2">
                  {product.name}
                </h1>
                <p className="text-2xl font-semibold text-ghibli-moss">
                  €{(product.basePrice || product.price || 0).toFixed(2)}
                </p>
              </div>

              {/* Descrição */}
              <div className="prose prose-sm text-ghibli-earth/80">
                <p>
                  Proteja o seu telemóvel com estilo único! Esta capa personalizada é feita com 
                  materiais de alta qualidade e impressão duradoura. Transforme as suas criações AI 
                  numa proteção premium para o seu dispositivo.
                </p>
              </div>

              {/* Seleção de Modelo de Telemóvel */}
              <div className="mb-4">
                <label htmlFor="phone-model-select" className="block text-sm font-medium text-ghibli-earth mb-2">
                  Escolha o Modelo do Telemóvel:
                </label>
                <Select
                  onValueChange={(value) => setSelectedPrintifyVariantId(parseInt(value))}
                  value={selectedPrintifyVariantId?.toString() || ''}
                >
                  <SelectTrigger id="phone-model-select" className="w-full bg-white/70 text-ghibli-earth border-ghibli-sand">
                    <SelectValue placeholder="Selecione um modelo">
                      {product.variants?.find(v => v.id === selectedPrintifyVariantId)?.title || 'Selecione um modelo'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white text-ghibli-earth border-ghibli-sand max-h-60">
                    {product.variants?.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id.toString()}>
                        {variant.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Especificações Minimalistas */}
              <div className="bg-white/50 rounded-lg p-3 space-y-2">
                <h3 className="font-semibold text-ghibli-earth text-sm">Detalhes</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ghibli-earth/60">Material:</span>
                    <span className="font-medium">Policarbonato resistente</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ghibli-earth/60">Proteção:</span>
                    <span className="font-medium">Contra quedas e riscos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ghibli-earth/60">Qualidade:</span>
                    <span className="font-medium">Impressão HD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ghibli-earth/60">Entrega:</span>
                    <span className="font-medium">3-5 dias</span>
                  </div>
                </div>
              </div>

              {/* Seleção de Imagem */}
              {selectedImageUrl && (
                <div className="bg-white/50 rounded-lg p-3">
                  <h3 className="font-semibold text-ghibli-earth mb-2 text-sm">Arte Selecionada</h3>
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedImageUrl}
                      alt="Arte selecionada"
                      className="w-12 h-12 rounded-lg object-cover border-2 border-ghibli-moss"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-ghibli-earth/80 mb-2">
                        Transformação AI aplicada
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleOpenGallery}
                          className="text-xs bg-ghibli-moss hover:bg-ghibli-moss/90 h-7"
                        >
                          Trocar Arte
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleResetSelection}
                          className="text-xs h-7"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="space-y-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedImageUrl || loading || !printifyProductId || !printifyImageId || !selectedPrintifyVariantId}
                  className="w-full bg-ghibli-moss hover:bg-ghibli-moss/90 text-white py-3 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      A adicionar...
                    </>
                  ) : !selectedImageUrl ? (
                    'Escolha uma Arte'
                  ) : !selectedPrintifyVariantId ? (
                    'Selecione o Modelo'
                  ) : (!printifyProductId || !printifyImageId) ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      A gerar mockups...
                    </>
                  ) : (
                    'Adicionar ao Carrinho'
                  )}
                </Button>

                {!selectedImageUrl && userInfo && (
                  <Button
                    onClick={handleOpenGallery}
                    variant="outline"
                    className="w-full border-ghibli-moss text-ghibli-moss hover:bg-ghibli-moss hover:text-white"
                    size="lg"
                  >
                    Escolher Arte
                  </Button>
                )}

                {!userInfo && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      Faça login para personalizar esta capa com as suas criações AI
                    </p>
                    <Button
                      onClick={() => router.push('/')}
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    >
                      Fazer Login
                    </Button>
                  </div>
                )}
              </div>

              {/* Informações de Entrega Minimalistas */}
              <div className="bg-ghibli-moss/10 rounded-lg p-3">
                <h3 className="font-semibold text-ghibli-earth mb-2 text-sm">Garantias</h3>
                <ul className="text-xs text-ghibli-earth/80 space-y-1">
                  <li>✓ Entrega gratuita {'>'}€50</li>
                  <li>✓ Envio em 3-5 dias</li>
                  <li>✓ Garantia 30 dias</li>
                  <li>✓ Proteção premium</li>
                </ul>
              </div>
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

export default PhoneCaseDetailPage; 