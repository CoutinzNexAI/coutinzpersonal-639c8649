const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_BASE_URL = 'https://api.printify.com/v1/';

if (!PRINTIFY_API_TOKEN) {
  throw new Error('PRINTIFY_API_TOKEN is not defined in environment variables. Please set this in Vercel or your .env.local file.');
}

export async function printifyFetch(endpoint: string, options: RequestInit = {}, retryCount = 0) {
  const maxRetries = 3; // Máximo de 3 tentativas
  const url = endpoint.startsWith('http') ? endpoint : PRINTIFY_BASE_URL + endpoint.replace(/^\//, '');

  const headersToSend: Record<string, string> = {
    'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
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
    console.log(`[printifyFetch] Calling URL: ${url} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    console.log(`[printifyFetch] Headers:`, headersToSend);
    console.log(`[printifyFetch] Method:`, options.method || 'GET');

    // Log do corpo da requisição para POST/PUT/PATCH
    if (options.body && ['POST', 'PUT', 'PATCH'].includes((options.method || 'GET').toUpperCase())) {
      console.log(`[printifyFetch] Body:`, options.body);
    }

    const response = await fetch(url, {
      ...options,
      headers: headersToSend,
    });

    // 🔍 DEBUGGING: LER RESPOSTA COMO TEXTO PRIMEIRO
    const rawText = await response.text();
    
    // 🔍 DEBUGGING: IMPRIMIR TUDO PARA VER O QUE A PRINTIFY REALMENTE RESPONDEU
    console.log('[DEBUG] ===== PRINTIFY RESPONSE DEBUG =====');
    console.log('[DEBUG] Status:', response.status, response.statusText);
    console.log('[DEBUG] Headers:', Object.fromEntries(response.headers.entries()));
    console.log('[DEBUG] Raw Response Body from Printify:', rawText);
    console.log('[DEBUG] ===== END PRINTIFY RESPONSE =====');

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
      // 🔍 DEBUGGING: TENTAR PARSE JSON COM TRATAMENTO DE ERRO
      const jsonData = JSON.parse(rawText);
      console.log('[DEBUG] Parsed JSON successfully:', jsonData);
      return jsonData;
    } catch (parseError) {
      console.error("❌ DEBUGGING: Falha ao interpretar resposta da Printify como JSON:", parseError);
      console.error("❌ DEBUGGING: Raw text que causou o erro:", rawText);
      throw new Error(`Recebida resposta inválida (não-JSON) da Printify: ${rawText}`);
    }

  } catch (error) {
    console.error(`❌ printifyFetch error:`, error);
    throw error;
  }
}

export async function testPrintifyConnection() {
  try {
    const data = await printifyFetch('shops.json', { method: 'GET' });
    console.log('✅ Printify connection successful:', data);
    return true;
  } catch (err) {
    console.error('❌ Printify connection failed:', err);
    return false;
  }
} 