import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// Admin client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função auxiliar para fazer o parse manual de um cookie específico
function getManuallyParsedCookie(cookieString: string, cookieName: string): string | undefined {
  if (!cookieString) return undefined;
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    if (name === cookieName) {
      return parts.slice(1).join('=');
    }
  }
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => {
            const cookieStrToParse = req.headers.cookie ?? '';
            const parsedCookiesObjectOriginal = parseCookieHeader(cookieStrToParse);
            const originalValue = parsedCookiesObjectOriginal[name];

            if (name.startsWith('sb-') && name.includes('-auth-token') && originalValue === undefined) {
              const manualValue = getManuallyParsedCookie(cookieStrToParse, name);
              return manualValue;
            }
            
            return originalValue;
          },
          set: (name: string, value: string, options) => {
            const cookie = serializeCookieHeader(name, value, options);
            let setCookieHeader = res.getHeader('Set-Cookie') ?? [];
            if (typeof setCookieHeader === 'string') {
              setCookieHeader = [setCookieHeader];
            } else if (typeof setCookieHeader === 'number') {
              setCookieHeader = [String(setCookieHeader)];
            }
            res.setHeader('Set-Cookie', [...setCookieHeader, cookie]);
          },
          remove: (name: string, options) => {
            const cookieHeader = serializeCookieHeader(name, '', { ...options, maxAge: 0 });
            let existingSetCookie = res.getHeader('Set-Cookie') ?? [];
            if (typeof existingSetCookie === 'string') existingSetCookie = [existingSetCookie];
            else if (typeof existingSetCookie === 'number') existingSetCookie = [String(existingSetCookie)];
            res.setHeader('Set-Cookie', [...existingSetCookie, cookieHeader]);
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[User Sync API] Auth error:', authError?.message);
      return res.status(401).json({ message: 'Unauthorized', detail: authError?.message });
    }

    const { userData } = req.body;
    
    if (!userData) {
      return res.status(400).json({ message: 'User data is required' });
    }

    // Check if this is a new user by checking if they exist in database
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, created_at, accepted_terms, terms_accepted_at')
      .eq('id', user.id)
      .single();

    const isNewUser = checkError && checkError.code === 'PGRST116'; // Not found error

    // Use admin client to bypass RLS for user upsert
    const { data: upsertedUser, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        updated_at: new Date().toISOString(),
        // ✅ FIXED: Keep existing accepted_terms for existing users
        ...(existingUser && !isNewUser && {
          accepted_terms: existingUser.accepted_terms,
          terms_accepted_at: existingUser.terms_accepted_at
        })
      }, { onConflict: 'id' })
      .select('*')  // ✅ FIXED: Return the complete user data
      .single();

    if (upsertError) {
      console.error("[User Sync API] Error upserting user:", upsertError.message);
      return res.status(500).json({ message: 'Error syncing user', detail: upsertError.message });
    }

    console.log('[User Sync API] ✅ User synced successfully:', {
      user_id: user.id,
      isNewUser,
      updated_at: upsertedUser?.updated_at
    });

    return res.status(200).json({
      success: true,
      isNewUser,
      user: upsertedUser  // ✅ FIXED: Return complete user data
    });

  } catch (error) {
    console.error('[User Sync API] ❌ Unexpected error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 