// src/lib/gelato/gelatoApi.ts

// NOTA: GELATO_API_BASE_ECOMMERCE_URL é exportado aqui para ser usado noutros ficheiros.
export const GELATO_API_BASE_ECOMMERCE_URL = 'https://ecommerce.gelatoapis.com';
const GELATO_API_BASE_URL = 'https://order.gelatoapis.com'; // Base URL para a API de Orders

const API_KEY = process.env.GELATO_API_KEY;
const GELATO_STORE_ID = process.env.GELATO_STORE_ID; 

if (!API_KEY) {
  throw new Error('GELATO_API_KEY não está configurada em .env.local!');
}

/**
 * Função utilitária para fazer requisições à API da Gelato.
 * @param endpoint O endpoint da API (ex: '/orders:search' ou um URL completo como 'https://ecommerce.gelatoapis.com/v1/templates/...')
 * @param options As opções da requisição (method, body, headers, etc.)
 */
export const gelatoFetch = async (endpoint: string, options?: RequestInit) => {
  // Determina a base URL a usar. Se o endpoint já começar com 'https://', usa-o diretamente.
  // Caso contrário, assume que é para a API de Orders (base URL padrão).
  const baseUrl = endpoint.startsWith('https://') ? '' : GELATO_API_BASE_URL;

  const fullUrl = `${baseUrl}${endpoint}`; // Constrói o URL completo

  try {
    // Adiciona este log para vermos o URL exato que está a ser chamado
    console.log(`[gelatoFetch] A chamar URL: ${fullUrl}`); 

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => response.text());
      console.error(`Erro na API Gelato para ${fullUrl}:`, response.status, response.statusText, errorBody);
      throw new Error(`Erro Gelato API (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Erro ao fazer requisição Gelato para ${fullUrl}:`, error);
    throw error;
  }
};

/**
 * Função de teste simples para verificar a conexão com a Gelato API.
 */
export const testGelatoConnection = async () => {
  console.log('A testar a conexão com a Gelato API...');
  try {
    const data = await gelatoFetch('/v4/orders:search', {
      method: 'POST',
      body: JSON.stringify({})
    });
    console.log('✅ Conexão Gelato bem-sucedida! Exemplo de resposta (apenas para verificar):', data);
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão Gelato:', error);
    return false;
  }
};

// Interfaces para a nova função (mantidas)
interface GelatoImagePlaceholder {
  name: string;
  fileUrl: string;
  fitMethod?: 'slice' | 'meet';
}

interface GelatoVariantCreation {
  templateVariantId: string;
  imagePlaceholders?: GelatoImagePlaceholder[];
  position?: number;
}

interface GelatoProductCreationPayload {
  templateId: string;
  title: string;
  description: string;
  isVisibleInTheOnlineStore?: boolean;
  salesChannels?: string[];
  variants?: GelatoVariantCreation[];
  tags?: string[];
  productType?: string;
  vendor?: string;
}

interface GelatoProductCreationResponse {
  id: string;
  title: string;
  status: string;
  [key: string]: unknown;
}

export async function createGelatoStoreProduct(payload: GelatoProductCreationPayload): Promise<GelatoProductCreationResponse> {
  if (!API_KEY || !GELATO_STORE_ID) {
    throw new Error('Gelato API Key or Store ID not configured for createGelatoStoreProduct.');
  }

  const response = await fetch(
    `${GELATO_API_BASE_ECOMMERCE_URL}/v1/stores/${GELATO_STORE_ID}/products:create-from-template`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => response.text());
    console.error('Gelato API Error (Create Store Product):', response.status, response.statusText, errorData);
    throw new Error(`Gelato API error (Create Store Product - ${response.status}): ${JSON.stringify(errorData)}`);
  }

  return response.json();
}