import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Importar o node-fetch

// Check required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV === 'development') {
  console.error('❌ [lib/supabase/admin] NEXT_PUBLIC_SUPABASE_URL not configured');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NODE_ENV === 'development') {
  console.error('❌ [lib/supabase/admin] SUPABASE_SERVICE_ROLE_KEY not configured');
}

// Initialize Supabase admin client with service role key AND custom fetch
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    global: {
      fetch: fetch as unknown as typeof globalThis.fetch, // Usar o node-fetch aqui.
    },
    // auth: {
    //   persistSession: false // Para admin client, geralmente não precisamos persistir sessão
    // }
  }
);

// Only log initialization in development
if (process.env.NODE_ENV === 'development') {
  console.log('[lib/supabase/admin] Supabase admin client initialized...');
}

// Pequeno teste de exportação para garantir que o módulo está a funcionar
if (supabaseAdmin) {
  console.log('[lib/supabase/admin] supabaseAdmin object exported successfully.');
} else {
  console.error('[lib/supabase/admin] CRITICAL: supabaseAdmin object is null or undefined after initialization!');
}