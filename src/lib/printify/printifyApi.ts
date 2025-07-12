const PRINTIFY_BASE_URL = 'https://api.printify.com/v1/';

function getPrintifyToken() {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) {
    throw new Error('PRINTIFY_API_TOKEN is not defined in environment variables. Please set this in Vercel or your .env.local file.');
  }
  return token;
}

export async function printifyFetch(endpoint: string, options: RequestInit = {}, retryCount = 0) {
  const maxRetries = 3; // Máximo de 3 tentativas
  const url = endpoint.startsWith('http') ? endpoint : PRINTIFY_BASE_URL + endpoint.replace(/^\//, '');

  const headersToSend: Record<string, string> = {
    'Authorization': `Bearer ${getPrintifyToken()}`,
    'Content-Type': 'application/json',
    'User-Agent': 'PicTuz-App',
    // Adicionar headers para prevenir cache
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  // Combinar com os headers passados nas options, sobrescrevendo apenas se forem fornecidos explicitamente
  if (options.headers) {
    const incomingHeaders = new Headers(options.headers);
    incomingHeaders.forEach((value, key) => {
      // Não sobrescrever Authorization, Content-Type, User-Agent se já definidos a menos que seja intencional
      if (!['authorization', 'content-type', 'user-agent', 'cache-control', 'pragma'].includes(key.toLowerCase())) {
        headersToSend[key] = value;
      }
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: headersToSend,
    });

    const rawText = await response.text();

    // 🚀 TRATAR ERRO 429 (RATE LIMIT) COM RETRY AUTOMÁTICO
    if (response.status === 429 && retryCount < maxRetries) {
      const retryAfter = response.headers.get('retry-after');
      const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000; // Converte para ms, ou 5s por defeito
      
      console.warn(`⏳ Rate limit atingido (429). A tentar de novo em ${delayMs}ms... (tentativa ${retryCount + 1}/${maxRetries})`);
      
      // Espera o tempo especificado
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Tenta a chamada outra vez (recursivamente)
      return printifyFetch(endpoint, options, retryCount + 1);
    }

    if (!response.ok) {
      console.error(`❌ Printify API Error (${response.status} ${response.statusText}) for ${url}:`, rawText);
      
      // Se for 429 e já esgotamos as tentativas, dar uma mensagem mais clara
      if (response.status === 429) {
        throw new Error(`Rate limit excedido após ${maxRetries + 1} tentativas. Tenta novamente mais tarde.`);
      }
      
      throw new Error(`Printify API error: ${response.status} ${response.statusText} - ${rawText}`);
    }

    try {
      const jsonData = JSON.parse(rawText);
      return jsonData;
    } catch (parseError) {
      console.error("❌ Printify: Resposta não é JSON válido");
      throw new Error(`Resposta inválida da Printify API`);
    }

  } catch (error) {
    console.error(`❌ printifyFetch error:`, error);
    throw error;
  }
}

export async function testPrintifyConnection() {
  try {
    const data = await printifyFetch('shops.json', { method: 'GET' });
    return true;
  } catch (err) {
    console.error('❌ Printify connection failed:', err);
    return false;
  }
} 