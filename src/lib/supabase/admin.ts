import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Importar o node-fetch

// Check required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
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

console.log('[lib/supabase/admin] Supabase admin client initialized with custom fetch.');

// Validate admin client was created successfully
if (!supabaseAdmin) {
  throw new Error('Failed to initialize Supabase admin client');
}