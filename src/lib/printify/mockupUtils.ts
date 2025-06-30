import { printifyFetch } from './printifyApi';
import https from 'https';
import http from 'http';

/**
 * Função para obter dimensões de uma imagem
 */
export async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  console.log(`[Utils] 🕵️ Detectando dimensões para URL: ${imageUrl}`);
  
  return new Promise((resolve, reject) => {
    const client = imageUrl.startsWith('https://') ? https : http;
    
    client.get(imageUrl, (response) => {
      const { statusCode, headers } = response;
      console.log(`[Utils] 🕵️ Status da resposta: ${statusCode}`);

      // Tratar redirecionamentos
      if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        console.error(`[Utils] ❌ Redirecionamento detectado para ${headers.location}`);
        reject(new Error(`Image URL returned a redirect to ${headers.location}`));
        return;
      }

      if (statusCode !== 200) {
        console.error(`[Utils] ❌ Erro na requisição: status ${statusCode}`);
        response.resume();
        reject(new Error(`Request to image URL failed with status code ${statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[Utils] 🕵️ Download concluído. Tamanho: ${buffer.length} bytes`);
        
        if (buffer.length >= 4) {
          // PNG
          if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            console.log(`[Utils] ✅ PNG detectado: ${width}x${height}`);
            resolve({ width, height });
            return;
          }
          // JPEG
          else if (buffer.toString('hex', 0, 4) === 'ffd8ffe0' || buffer.toString('hex', 0, 4) === 'ffd8ffe1') {
            let offset = 2;
            while (offset < buffer.length) {
              const marker = buffer.readUInt16BE(offset);
              if (marker === 0xffc0 || marker === 0xffc2) {
                const height = buffer.readUInt16BE(offset + 5);
                const width = buffer.readUInt16BE(offset + 7);
                console.log(`[Utils] ✅ JPEG detectado: ${width}x${height}`);
                resolve({ width, height });
                return;
              }
              offset += 2 + buffer.readUInt16BE(offset + 2);
            }
          }
          // WebP
          else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
            if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
              const width = buffer.readUInt16LE(26) & 0x3fff;
              const height = buffer.readUInt16LE(28) & 0x3fff;
              console.log(`[Utils] ✅ WebP VP8 detectado: ${width}x${height}`);
              resolve({ width, height });
            } else if (buffer.toString('ascii', 12, 16) === 'VP8L') {
              const bits = buffer.readUInt32LE(21);
              const width = (bits & 0x3fff) + 1;
              const height = ((bits >> 14) & 0x3fff) + 1;
              console.log(`[Utils] ✅ WebP VP8L detectado: ${width}x${height}`);
              resolve({ width, height });
            }
          }
        }
        
        console.warn('[Utils] ⚠️ Formato não reconhecido, usando fallback 1024x1024');
        resolve({ width: 1024, height: 1024 });
      });
    }).on('error', (err) => {
      console.error('[Utils] ❌ Erro de rede:', err.message);
      reject(err);
    });
  });
}

/**
 * Faz upload de uma imagem para a Printify Media Library
 */
export async function uploadImageToPrintify(imageUrl: string, fileName: string): Promise<string> {
  console.log(`[Utils] 🔄 Fazendo upload da imagem: ${fileName}`);
  
  const uploadPayload = {
    file_name: fileName,
    url: imageUrl,
  };
  
  const uploadResponse = await printifyFetch('uploads/images.json', {
    method: 'POST',
    body: JSON.stringify(uploadPayload),
  });

  if (!uploadResponse?.id) {
    throw new Error('Falha ao fazer upload da imagem para a Printify Media Library');
  }
  
  console.log(`[Utils] ✅ Imagem carregada. ID: ${uploadResponse.id}`);
  return uploadResponse.id;
}

interface PrintifyProductPayload {
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: number;
    price: number;
    is_enabled: boolean;
  }>;
  print_areas: Array<{
    variant_ids: number[];
    placeholders: Array<{
      position: string;
      images: Array<{
        id: string;
        x: number;
        y: number;
        scale: number;
        angle: number;
      }>;
    }>;
  }>;
}

interface PrintifyProductResponse {
  id: string;
  title: string;
  images?: Array<{ src: string }>;
}

/**
 * Cria um produto temporário na Printify
 */
export async function createMockupProductOnPrintify(payload: PrintifyProductPayload): Promise<PrintifyProductResponse> {
  console.log('[Utils] 🔄 Criando produto temporário na Printify...');
  
  const productResponse = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!productResponse?.id) {
    console.error("Erro na resposta da criação de produto:", productResponse);
    throw new Error('Falha ao criar produto temporário na Printify');
  }
  
  console.log(`[Utils] ✅ Produto criado. ID: ${productResponse.id}`);
  return productResponse;
}

/**
 * Faz polling para esperar pelos mockups de um produto
 */
export async function pollForMockups(productId: string): Promise<string[]> {
  console.log(`[Utils] 🔄 Fazendo polling para mockups do produto: ${productId}`);
  
  const maxAttempts = 15;
  const delayMs = 5000; // 5 segundos

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const productDetails = await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products/${productId}.json`);
      
      if (productDetails?.images?.length > 0) {
        console.log(`[Utils] ✅ Mockups prontos na tentativa ${attempt}!`);
        return productDetails.images.map((img: { src: string }) => img.src);
      }
      
      console.log(`[Utils] ⏳ Tentativa ${attempt}/${maxAttempts}: Mockups ainda não prontos...`);
    } catch (e) {
      console.warn(`[Utils] ⚠️ Tentativa de polling ${attempt} falhou. Tentando novamente...`);
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error(`Tempo esgotado após ${maxAttempts} tentativas esperando pelos mockups do produto ${productId}.`);
}

/**
 * Calcula a escala correta para uma imagem num placeholder
 */
export function calculateOptimalScale(
  userImageWidth: number,
  userImageHeight: number,
  placeholderWidth: number,
  placeholderHeight: number
): number {
  console.log(`[Utils] 🔄 Calculando escala para imagem ${userImageWidth}x${userImageHeight} em placeholder ${placeholderWidth}x${placeholderHeight}`);
  
  // Calcular o fator de zoom necessário para cobrir toda a área
  const scaleToCover = Math.max(
    placeholderWidth / userImageWidth,
    placeholderHeight / userImageHeight
  );

  // Calcular a largura final da imagem depois de aplicar este zoom
  const finalImageWidth = userImageWidth * scaleToCover;

  // Converter para o valor de 'scale' que a Printify entende
  const printifyScale = finalImageWidth / placeholderWidth;
  
  console.log(`[Utils] ✅ Escala calculada: ${printifyScale}`);
  return printifyScale;
}

/**
 * Apaga um produto temporário da Printify (opcional)
 */
export async function deleteMockupProduct(productId: string): Promise<void> {
  console.log(`[Utils] 🗑️ Apagando produto temporário ${productId}...`);
  
  try {
    await printifyFetch(`shops/${process.env.PRINTIFY_SHOP_ID}/products/${productId}.json`, {
      method: 'DELETE'
    });
    console.log('[Utils] ✅ Produto temporário apagado com sucesso');
  } catch (error) {
    console.warn('[Utils] ⚠️ Falha ao apagar produto temporário:', error);
    // Não propagar o erro, pois é opcional
  }
} 