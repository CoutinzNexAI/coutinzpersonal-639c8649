const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_BASE_URL = 'https://api.printify.com/v1/';

if (!PRINTIFY_API_TOKEN) {
  throw new Error('PRINTIFY_API_TOKEN is not defined in environment variables. Please set this in Vercel or your .env.local file.');
}

export async function printifyFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : PRINTIFY_BASE_URL + endpoint.replace(/^\//, '');

  const defaultHeaders: HeadersInit = {
    'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'PicTuz-App',
  };

  const combinedHeaders = new Headers(defaultHeaders);
  if (options.headers) {
    const incomingHeaders = new Headers(options.headers);
    incomingHeaders.forEach((value, key) => {
      combinedHeaders.set(key, value);
    });
  }

  try {
    console.log(`[printifyFetch] Calling URL: ${url}`);
    console.log(`[printifyFetch] Headers:`, Object.fromEntries(combinedHeaders.entries()));
    console.log(`[printifyFetch] Method:`, options.method || 'GET');

    const response = await fetch(url, {
      ...options,
      headers: combinedHeaders,
    });

    // Adicionar este log para DEBUG
    if (!response.ok) {
      const errorBody = await response.json().catch(() => response.text());
      console.error(`❌ Printify API Error (${response.status} ${response.statusText}) for ${url}:`, errorBody);
      throw new Error(`Printify API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
    }
    return response.json();
  } catch (error) {
    console.error('❌ printifyFetch error:', error);
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