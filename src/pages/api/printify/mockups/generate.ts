// src/pages/api/printify/mockups/generate.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getPrintifyProduct } from '@/lib/printify/printifyProducts';
import { 
  uploadImageToPrintify, 
  createMockupProductOnPrintify, 
  pollForMockups,
  getImageDimensions,
  calculateOptimalScale,
  deleteMockupProduct
} from '@/lib/printify/mockupUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateDraftRequest {
  productId: string;
  userImageUrl: string;
  userId: string;
  selectedPrintifyVariantId?: number;
  imageAdjustments?: {
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
  };
  // Campos para sweat de criança
  logoImageId?: string;
  customerImageUrl?: string;
  customerImageAdjustments?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
  selectedPhraseText?: string;
  phraseImageAdjustments?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
  };
  // Campos para Canvas
  printifyImageId?: string;
  printDetails?: { print_on_side: string };
}

interface CreateDraftResponse {
  success: boolean;
  previewUrls?: string[];
  printifyImageId?: string;
  printifyProductId?: string;
  customerPrintifyImageId?: string;
  dynamicPhrasePrintifyImageId?: string;
  error?: string;
  details?: string;
}

// Interface para a resposta do handler de generate-print-file
interface GeneratePrintFileResponseInternal {
  success: boolean;
  printifyImageId?: string;
  printFileUrl?: string;
  printFileId?: string;
  error?: string;
}

// Interfaces para a API Printify
interface PrintifyVariant {
  id: number;
  title: string;
  placeholders: PrintifyPlaceholder[];
}

interface PrintifyPlaceholder {
  position: string;
  width: number;
  height: number;
}

interface PrintifyVariantsResponse {
  variants: PrintifyVariant[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateDraftResponse>
) {
  console.log("--- [INÍCIO] /api/printify/mockups/generate (VERSÃO REFATORADA) ---");

  // Suporte para OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      productId,
      userImageUrl,
      userId,
      imageAdjustments,
      selectedPrintifyVariantId,
    } = req.body;

    console.log(`🔄 Processando produto: ${productId} para usuário: ${userId}`);

    // 1. Validar parâmetros básicos
    if (!productId || !userImageUrl || !userId) {
      throw new Error('Parâmetros obrigatórios em falta: productId, userImageUrl, userId');
    }

    // 2. Obter configuração do produto
    const productConfig = getPrintifyProduct(productId);
    if (!productConfig) {
      throw new Error(`Produto ${productId} não encontrado na configuração.`);
    }

    // 3. Verificar usuário no Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Usuário não encontrado ou não autorizado.');
    }

    // 4. Determinar variante a usar
    const targetVariantId = selectedPrintifyVariantId || productConfig.variants?.[0]?.id;
    if (!targetVariantId) {
      throw new Error(`Nenhuma variante encontrada para o produto ${productId}.`);
    }

    const selectedVariant = productConfig.variants?.find(v => v.id === targetVariantId);
    if (!selectedVariant) {
      throw new Error(`Variante ${targetVariantId} não encontrada para ${productId}.`);
    }

    // 5. Upload da imagem para Printify
    const fileName = `user-art-${userId}-${Date.now()}.png`;
    const printifyImageId = await uploadImageToPrintify(userImageUrl, fileName);

    // 6. Calcular posicionamento e escala
    let finalX = 0.5;
    let finalY = 0.5;
    let finalScale = 1.0;
    let finalAngle = 0;

    // Usar configuração de design padrão do produto
    if (productConfig.defaultDesign) {
      finalX = productConfig.defaultDesign.x;
      finalY = productConfig.defaultDesign.y;
      finalScale = productConfig.defaultDesign.scale;
      finalAngle = productConfig.defaultDesign.angle;
    } else if (productConfig.printAreasConfig?.[0]) {
      // Fallback para printAreasConfig se defaultDesign não existir
      const printAreaConfig = productConfig.printAreasConfig[0];
      finalX = printAreaConfig.defaultX;
      finalY = printAreaConfig.defaultY;
      finalScale = printAreaConfig.defaultScale;
      finalAngle = printAreaConfig.defaultAngle;
    }

    // Se temos ajustes do frontend, usar esses (prioritário)
    if (imageAdjustments) {
      finalX = imageAdjustments.x;
      finalY = imageAdjustments.y;
      finalAngle = imageAdjustments.rotation || 0;

      // Para a escala, calcular baseado nas dimensões se necessário
      if (imageAdjustments.scale) {
        finalScale = imageAdjustments.scale;
      } else {
        try {
          const imageDimensions = await getImageDimensions(userImageUrl);
          finalScale = calculateOptimalScale(
            imageDimensions.width,
            imageDimensions.height,
            selectedVariant.placeholderWidth,
            selectedVariant.placeholderHeight
          );
        } catch (error) {
          console.warn('⚠️ Falha ao calcular escala, usando padrão:', error);
        }
      }
    }

    console.log('✅ Valores finais calculados:', { finalX, finalY, finalScale, finalAngle });

    // 7. Montar payload para criar produto
    const productPayload = {
      title: `PicTuz ${productConfig.name} Mockup (${user.id}-${Date.now()})`,
      description: `Produto temporário para geração de mockup do ${productConfig.name}.`,
      blueprint_id: productConfig.printifyBlueprintId,
      print_provider_id: productConfig.printifyPrintProviderId,
      variants: [{
        id: targetVariantId,
        price: 1000, // Preço dummy para mockup
        is_enabled: true,
      }],
      print_areas: [{
        variant_ids: [targetVariantId],
        placeholders: [{
          position: productConfig.printAreasConfig?.[0]?.position || 'front',
          images: [{
            id: printifyImageId,
            x: finalX,
            y: finalY,
            scale: finalScale,
            angle: finalAngle,
          }],
        }],
      }],
    };

    // 8. Criar produto na Printify
    const createdProduct = await createMockupProductOnPrintify(productPayload);

    // 9. Esperar pelos mockups
    const previewUrls = await pollForMockups(createdProduct.id);

    // 10. OPCIONAL: Apagar produto temporário
    // await deleteMockupProduct(createdProduct.id);

    // 11. Resposta de sucesso
    console.log(`✅ Mockup gerado com sucesso! ${previewUrls.length} imagens encontradas.`);
    
    return res.status(200).json({
      success: true,
      previewUrls,
      printifyProductId: createdProduct.id,
      printifyImageId,
    });

  } catch (error) {
    console.error('--- [ERRO] Falha na geração de mockup ---', error);
    console.error('--- [STACK] ---', error instanceof Error ? error.stack : 'No stack trace');

    return res.status(500).json({
      success: false,
      error: 'Falha ao gerar mockup',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
