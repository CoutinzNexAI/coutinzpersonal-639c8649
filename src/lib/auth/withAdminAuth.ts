import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: string;
}

// Função para verificar se um utilizador é admin
export async function checkAdminRole(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    // Verificar o token com Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error('Erro na autenticação:', authError);
      return null;
    }

    // Buscar o role do utilizador na tabela users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Erro ao buscar dados do utilizador:', userError);
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: userData.role || 'user'
    };

  } catch (error) {
    console.error('Erro na verificação de admin:', error);
    return null;
  }
}

// Middleware para verificar se é admin
export function withAdminAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await checkAdminRole(req);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Acesso não autorizado. Apenas administradores.',
        required_role: 'admin',
        current_role: user?.role || 'unauthenticated'
      });
    }

    return handler(req, res, user);
  };
}

// Função para verificar se é o próprio utilizador ou admin
export async function checkUserOrAdminAccess(req: NextApiRequest, targetUserId: string): Promise<AuthenticatedUser | null> {
  const user = await checkAdminRole(req);
  
  if (!user) {
    return null;
  }

  // Permitir se for admin ou se for o próprio utilizador
  if (user.role === 'admin' || user.id === targetUserId) {
    return user;
  }

  return null;
} 