const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_BASE_URL = 'https://api.printify.com/v1/';

if (!PRINTIFY_API_TOKEN) {
  throw new Error('PRINTIFY_API_TOKEN is not defined in environment variables. Please set this in Vercel or your .env.local file.');
}

export async function printifyFetch(endpoint: string, options: RequestInit = {}) {
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
    console.log(`[printifyFetch] Calling URL: ${url}`);
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

    if (!response.ok) {
      console.error(`❌ Printify API Error (${response.status} ${response.statusText}) for ${url}:`, rawText);
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