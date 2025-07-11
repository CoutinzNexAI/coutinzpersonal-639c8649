import { createBrowserClient } from '@supabase/ssr'; // <<< ALTERAÇÃO IMPORTANTE AQUI

// Read variables using Next.js convention (process.env)
// Ensure these start with NEXT_PUBLIC_ in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if variables are actually loaded
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
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

// Supabase client initialized successfully
