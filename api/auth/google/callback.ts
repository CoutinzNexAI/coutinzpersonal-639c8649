import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_CLIENT_ID = '224760312428-1hukt2gnj04iq1p3unrfgr1capuvjmcq.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://diogocoutinho.com/api/auth/google/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.redirect('/?error=no_code');
  }

  if (!GOOGLE_CLIENT_SECRET) {
    console.error('GOOGLE_CLIENT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Store tokens in cookie (in production, use secure database)
    res.setHeader('Set-Cookie', [
      `google_access_token=${tokens.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
      `google_refresh_token=${tokens.refresh_token || ''}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
    ]);

    // Redirect back to bookings page
    return res.redirect('/marcacoes?auth=success');
  } catch (error) {
    console.error('OAuth error:', error);
    return res.redirect('/?error=auth_failed');
  }
}


