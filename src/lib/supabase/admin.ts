import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Importar o node-fetch

// Check required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ [lib/supabase/admin] NEXT_PUBLIC_SUPABASE_URL not configured');
  // Considerar lançar um erro aqui pode ser mais assertivo,
  // pois o cliente será criado de forma inválida.
  // throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ [lib/supabase/admin] SUPABASE_SERVICE_ROLE_KEY not configured');
  // throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

console.log('[lib/supabase/admin] Initializing Supabase admin client...');

// Initialize Supabase admin client with service role key AND custom fetch
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    global: {
      fetch: fetch as unknown as typeof globalThis.fetch, // Usar o node-fetch aqui. O 'as any' pode ser necessário devido a pequenas diferenças de tipo com o fetch global.
    },
    // auth: {
    //   persistSession: false // Para admin client, geralmente não precisamos persistir sessão
    // }
  }
);

console.log('[lib/supabase/admin] Supabase admin client initialized with custom fetch.');

// Pequeno teste de exportação para garantir que o módulo está a funcionar
if (supabaseAdmin) {
  console.log('[lib/supabase/admin] supabaseAdmin object exported successfully.dd');
} else {
  console.error('[lib/supabase/admin] CRITICAL: supabaseAdmin object is null or undefined after initialization!');
}