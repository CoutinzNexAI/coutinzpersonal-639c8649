// src/lib/gelato/gelatoApi.ts

const GELATO_API_BASE_URL = 'https://order.gelatoapis.com';
const API_KEY = process.env.GELATO_API_KEY;

if (!API_KEY) {
  throw new Error('GELATO_API_KEY não está configurada em .env.local!');
}

/**
 * Função utilitária para fazer requisições à API da Gelato.
 * @param endpoint O endpoint da API (ex: '/orders:search')
 * @param options As opções da requisição (method, body, headers, etc.)
 */
export const gelatoFetch = async (endpoint: string, options?: RequestInit) => {
  try {
    const response = await fetch(`${GELATO_API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
        ...options?.headers,
      },
    });

    // Lidar com erros da API
    if (!response.ok) {
      const errorBody = await response.json().catch(() => response.text());
      console.error(`Erro na API Gelato para ${endpoint}:`, response.status, response.statusText, errorBody);
      throw new Error(`Erro Gelato API (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    return response.json(); // Retorna o JSON da resposta
  } catch (error) {
    console.error(`Erro ao fazer requisição Gelato para ${endpoint}:`, error);
    throw error; // Relança o erro para ser tratado mais acima
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
      body: JSON.stringify({}) // Corpo vazio para procurar todos os pedidos
    });
    console.log('✅ Conexão Gelato bem-sucedida! Exemplo de resposta (apenas para verificar):', data);
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão Gelato:', error);
    return false;
  }
}; 