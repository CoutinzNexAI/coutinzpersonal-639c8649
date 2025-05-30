import { createBrowserClient } from '@supabase/ssr'; // <<< ALTERAÇÃO IMPORTANTE AQUI

// Read variables using Next.js convention (process.env)
// Ensure these start with NEXT_PUBLIC_ in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if variables are actually loaded
if (!supabaseUrl) {
  // Only log critical errors in production, not debug info
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ CRITICAL (client.ts): Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não está definida ou acessível.');
  }
}
if (!supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ CRITICAL (client.ts): Variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida ou acessível.');
  }
}

// Initialize Supabase client using createBrowserClient from @supabase/ssr
export const supabase = createBrowserClient(
  supabaseUrl!,
  supabaseAnonKey!
  // Opções de cookies (cookieOptions) podem ser passadas aqui se necessário,
  // mas as predefinições do createBrowserClient geralmente funcionam bem para o mesmo domínio.
);

// Only log success in development
if (process.env.NODE_ENV === 'development' && supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase browser client initialized successfully using @supabase/ssr.');
} else if (process.env.NODE_ENV === 'development') {
  console.warn('⚠️ Supabase browser client initialized BUT URL or Key might be missing. This is problematic.');
}
