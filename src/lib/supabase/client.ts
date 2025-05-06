import { createClient } from '@supabase/supabase-js';

// Read variables using Next.js convention (process.env)
// Ensure these start with NEXT_PUBLIC_ in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// DEBUG LOGS: Check if variables are loaded correctly in Next.js environment
console.log('DEBUG: NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '*** URL PRESENT ***' : '!!! NOT FOUND !!!');
console.log('DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '*** KEY PRESENT ***' : '!!! NOT FOUND !!!');

// Check if variables are actually loaded
if (!supabaseUrl) {
  console.error('❌ Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não está definida ou acessível.');
  // Optionally throw an error or return a dummy client to avoid crashing later
  // throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  console.error('❌ Variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida ou acessível.');
  // Optionally throw an error or return a dummy client
  // throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Initialize Supabase client
// Provide default empty strings only if you want to avoid crashing immediately,
// but it's better to handle the missing variables above.
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Log successful initialization (optional)
if (supabaseUrl && supabaseAnonKey) {
    console.log('✅ Supabase client initialized successfully.');
} else {
    console.warn('⚠️ Supabase client initialized with missing URL or Key. Check environment variables.');
}
