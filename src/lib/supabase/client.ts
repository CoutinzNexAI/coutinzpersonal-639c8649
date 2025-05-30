import { createBrowserClient } from '@supabase/ssr'; // <<< ALTERAÇÃO IMPORTANTE AQUI

// Read variables using Next.js convention (process.env)
// Ensure these start with NEXT_PUBLIC_ in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// DEBUG LOGS: Check if variables are loaded correctly in Next.js environment
console.log('DEBUG: NEXT_PUBLIC_SUPABASE_URL (client.ts):', supabaseUrl ? '*** URL PRESENT ***' : '!!! NOT FOUND !!!');
console.log('DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY (client.ts):', supabaseAnonKey ? '*** KEY PRESENT ***' : '!!! NOT FOUND !!!');

// Check if variables are actually loaded
if (!supabaseUrl) {
  console.error('❌ CRITICAL (client.ts): Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não está definida ou acessível.');
  // Consider throwing an error in development to catch this early
  // throw new Error('Missing Supabase URL for client. App will not work.');
}
if (!supabaseAnonKey) {
  console.error('❌ CRITICAL (client.ts): Variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida ou acessível.');
  // Consider throwing an error in development
  // throw new Error('Missing Supabase Anon Key for client. App will not work.');
}

// Initialize Supabase client using createBrowserClient from @supabase/ssr
// O '!' assume que as variáveis estão presentes após a verificação acima.
// Se pudessem ser legitimamente nulas e quisesses uma instância "vazia",
// precisarias de um tratamento diferente, mas para Supabase elas são essenciais.
export const supabase = createBrowserClient(
  supabaseUrl!,
  supabaseAnonKey!
  // Opções de cookies (cookieOptions) podem ser passadas aqui se necessário,
  // mas as predefinições do createBrowserClient geralmente funcionam bem para o mesmo domínio.
);

// Log successful initialization (optional)
if (supabaseUrl && supabaseAnonKey) {
    console.log('✅ Supabase browser client initialized successfully using @supabase/ssr.');
} else {
    console.warn('⚠️ Supabase browser client initialized BUT URL or Key might be missing. This is problematic.');
}
