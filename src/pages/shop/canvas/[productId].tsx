import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ChevronLeft, Upload, Sparkles, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { PIC_TUZ_PRINTIFY_PRODUCT_MAP, PrintifyProductMapping } from '@/lib/printify/printifyProducts';
import { CartService } from '@/lib/cart/cartService';

interface ImageAdjustment {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
}

const CanvasProductPage = () => {
  const router = useRouter();
  const { productId } = router.query;
  // const { addItem } = useCart();
  const addItem = (item: Omit<import('@/lib/cart/cartTypes').CartItem, 'id' | 'addedAt'>) => CartService.addToCart(item);

  // Estados principais
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageId, setSelectedImageId] = useState<string>('');
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [mockupImageUrl, setMockupImageUrl] = useState<string>('');
  const [userImageNaturalWidth, setUserImageNaturalWidth] = useState<number>(0);
  const [userImageNaturalHeight, setUserImageNaturalHeight] = useState<number>(0);
  
  // Estados específicos do Canvas
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState<string>('regular');
  const [imageAdjustments, setImageAdjustments] = useState<ImageAdjustment>({
    x: 0.5,
    y: 0.5,
    scale: 1.0,
    rotation: 0,
  });

  // Refs
  const mockupContainerRef = useRef<HTMLDivElement>(null);
  const userImageRef = useRef<HTMLImageElement>(null);

  // Buscar produto
  const product: PrintifyProductMapping | undefined = productId 
    ? PIC_TUZ_PRINTIFY_PRODUCT_MAP[productId as string] 
    : undefined;

  // Definir variante padrão
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  // Calcular escala inicial da imagem baseada na variante selecionada
  useEffect(() => {
    if (userImageNaturalWidth && userImageNaturalHeight && product && selectedVariantId) {
      const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
      if (selectedVariant) {
        // Para Canvas, usar 'slice' - a imagem deve preencher a área cortando o excesso
        const widthRatio = selectedVariant.placeholderWidth / userImageNaturalWidth;
        const heightRatio = selectedVariant.placeholderHeight / userImageNaturalHeight;
        const initialScale = Math.max(widthRatio, heightRatio); // Escolher a maior escala para garantir preenchimento

        setImageAdjustments(prev => ({
          ...prev,
          scale: initialScale
        }));
      }
    }
  }, [userImageNaturalWidth, userImageNaturalHeight, product, selectedVariantId]);

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setSelectedImageUrl(url);
      setMockupImageUrl(''); // Limpar mockup anterior
      setSelectedImageId(''); // Limpar ID da Printify
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setUserImageNaturalWidth(img.naturalWidth);
    setUserImageNaturalHeight(img.naturalHeight);
  };

  const handleUploadToPrintify = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione uma imagem primeiro');
      return;
    }

    const uploadToast = toast.loading('A carregar imagem para a Printify...');

    try {
      // Converter file para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64Content = base64Data.split(',')[1]; // Remover "data:image/...;base64,"

        const response = await fetch('/api/printify/uploads/image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64Content,
            fileName: selectedFile.name,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSelectedImageId(data.imageId);
          toast.success('Imagem carregada com sucesso!', { id: uploadToast });
        } else {
          throw new Error(data.error || 'Erro no upload');
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao carregar imagem', { id: uploadToast });
    }
  };

  const handleGenerateMockup = async () => {
    if (!selectedImageUrl || !product || !selectedVariantId || !selectedImageId) {
      toast.error('Por favor, complete todos os passos necessários');
      return;
    }

    const mockupToast = toast.loading('A gerar mockup...');
    setIsGeneratingMockup(true);

    try {
      const payload: {
        productId: string;
        userImageUrl: string;
        printifyImageId: string;
        selectedPrintifyVariantId: number;
        imageAdjustments: ImageAdjustment;
        userId: string;
        printDetails?: { print_on_side: string };
      } = {
        productId: product.id,
        userImageUrl: selectedImageUrl,
        printifyImageId: selectedImageId,
        selectedPrintifyVariantId: selectedVariantId,
        imageAdjustments: imageAdjustments,
        userId: 'user-canvas-test', // TODO: Usar ID real do utilizador
      };

      // Adicionar print_details apenas para custom_canvas
      if (product.id === 'custom_canvas' && selectedEdgeType !== 'off') {
        payload.printDetails = { print_on_side: selectedEdgeType };
      }

      const response = await fetch('/api/printify/mockups/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success && data.previewUrls && data.previewUrls.length > 0) {
        setMockupImageUrl(data.previewUrls[0]); // Usar primeiro mockup
        toast.success('Mockup gerado com sucesso!', { id: mockupToast });
      } else {
        throw new Error(data.error || 'Erro na geração do mockup');
      }
    } catch (error) {
      console.error('Erro no mockup:', error);
      toast.error('Erro ao gerar mockup', { id: mockupToast });
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariantId || !mockupImageUrl || !selectedImageId) {
      toast.error('Por favor, complete o processo de personalização');
      return;
    }

    const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
    if (!selectedVariant) {
      toast.error('Variante selecionada não encontrada');
      return;
    }

    const itemPrice = (product.basePrice || 0) + (selectedVariant.priceAdjustment || 0);

    // Extrair cor da moldura do título da variante (apenas para framed_canvas)
    let frameColor: string | undefined;
    if (product.id === 'framed_canvas') {
      const colorMatch = selectedVariant.title.match(/(Black|Espresso|White)/);
      frameColor = colorMatch ? colorMatch[1] : undefined;
    }

    const cartItem = {
      productId: product.id,
      productUid: `canvas-${Date.now()}`, // UID temporário
      productName: product.name,
      productCategory: product.category,
      userImageUrl: selectedImageUrl,
      printifyImageId: selectedImageId,
      printifyVariantId: selectedVariantId,
      price: itemPrice,
      quantity: 1,
      customizations: {
        variantTitle: selectedVariant.title,
        ...(product.id === 'custom_canvas' && { canvasEdgeType: selectedEdgeType as 'regular' | 'mirror' | 'off' }),
        ...(product.id === 'framed_canvas' && frameColor && { frameColor }),
      },
      imageAdjustments: imageAdjustments,
    };

    addItem(cartItem);
    toast.success('Produto adicionado ao carrinho!');
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Produto não encontrado</h1>
          <Button onClick={() => router.push('/shop/canvas')}>
            Voltar aos Canvas
          </Button>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const currentPrice = (product.basePrice || 0) + (selectedVariant?.priceAdjustment || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/shop/canvas')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar aos Canvas
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna da Esquerda - Visualização */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={mockupContainerRef}
                  className="relative w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden"
                >
                  {isGeneratingMockup ? (
                    <div className="flex flex-col items-center">
                      <Sparkles className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                      <span>A gerar mockup...</span>
                    </div>
                  ) : mockupImageUrl ? (
                    <Image
                      src={mockupImageUrl}
                      alt="Mockup do Canvas"
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <Image
                      src={product.mockupInitialPath}
                      alt="Mockup base"
                      fill
                      className="object-contain"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upload e Controlos */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="image-upload" className="text-sm font-medium">
                    1. Selecionar Imagem
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selecionado: {selectedFile.name}
                    </p>
                  )}
                </div>

                {selectedFile && !selectedImageId && (
                  <Button 
                    onClick={handleUploadToPrintify}
                    className="w-full"
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    2. Carregar para Printify
                  </Button>
                )}

                {selectedImageId && selectedVariantId && (
                  <Button 
                    onClick={handleGenerateMockup}
                    className="w-full"
                    disabled={isGeneratingMockup}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    3. Gerar Mockup
                  </Button>
                )}

                {/* Imagem oculta para obter dimensões */}
                {selectedImageUrl && (
                  <img
                    ref={userImageRef}
                    src={selectedImageUrl}
                    alt="User upload"
                    style={{ display: 'none' }}
                    onLoad={handleImageLoad}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita - Opções */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <p className="text-gray-600">
                  Canvas de alta qualidade para decorar o seu espaço
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seletor de Variantes */}
                <div>
                  <Label className="text-sm font-medium">
                    {product.id === 'framed_canvas' 
                      ? 'Escolha o Tamanho e a Cor da Moldura:' 
                      : 'Escolha o Tamanho:'
                    }
                  </Label>
                  <Select 
                    value={selectedVariantId?.toString() || ''} 
                    onValueChange={(value) => setSelectedVariantId(Number(value))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants?.map((variant) => {
                        const variantPrice = (product.basePrice || 0) + (variant.priceAdjustment || 0);
                        return (
                          <SelectItem key={variant.id} value={variant.id.toString()}>
                            {variant.title} - €{variantPrice.toFixed(2)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opções de Borda (apenas para custom_canvas) */}
                {product.id === 'custom_canvas' && product.allowsPrintDetails && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Opções de Borda:
                    </Label>
                    <RadioGroup value={selectedEdgeType} onValueChange={setSelectedEdgeType}>
                      {product.printDetailsOptions?.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="text-sm">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <Separator />

                {/* Preço */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    €{currentPrice.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500">Preço final (IVA incluído)</p>
                </div>

                {/* Botão Adicionar ao Carrinho */}
                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                  disabled={!mockupImageUrl || !selectedVariantId || isGeneratingMockup}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>

            {/* Informações do Produto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Características</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Impressão de alta qualidade
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Canvas premium esticado
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Cores vibrantes e duradouras
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                    Pronto a pendurar
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasProductPage; 