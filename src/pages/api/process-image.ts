import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import axios from 'axios';

type ResponseData = {
  success?: boolean;
  message?: string;
  jobId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // 1. Validação da requisição
  if (req.method !== 'POST') {
    console.warn('[API process-image] Método não permitido:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Verificação de segurança
  const internalSecret = req.headers['x-internal-secret'];
  if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
    console.error('[API process-image] Tentativa de acesso não autorizado');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // 3. Extração e validação do jobId
  const { jobId } = req.body;
  if (!jobId) {
    console.error('[API process-image] Requisição sem jobId');
    return res.status(400).json({ message: 'jobId is required' });
  }
  
  console.log(`[API process-image] Iniciando processamento para job: ${jobId}`);

  try {
    // 4. Verificação rápida do job no Supabase
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('transformations')
      .select('id, input_file_path, user_id, style_requested')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error(`[API process-image] Job não encontrado: ${jobId}`, jobError);
      return res.status(400).json({
        success: false,
        message: `Job não encontrado: ${jobError?.message || 'Dados não encontrados'}`
      });
    }

    console.log(`[API process-image] Job encontrado: ${jobId}, user: ${jobData.user_id}, style: ${jobData.style_requested}`);

    if (!jobData.input_file_path) {
      console.error(`[API process-image] Arquivo de entrada ausente: ${jobId}`);
      return res.status(400).json({
        success: false,
        message: `Caminho do arquivo de entrada ausente para o job ${jobId}`
      });
    }

    // 5. Atualizar status para 'processing'
    const { error: updateError } = await supabaseAdmin
      .from('transformations')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        completed_at: null
      })
      .eq('id', jobId);
      
    if (updateError) {
      console.error(`[API process-image] Erro ao atualizar status: ${jobId}`, updateError);
    } else {
      console.log(`[API process-image] Status atualizado para 'processing': ${jobId}`);
    }

    // 6. Chamar a API de processamento em background
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    console.log(`[API process-image] URL base para processamento: ${baseUrl}`);
   
    // Chamada assíncrona sem await para não bloquear a resposta
    axios.post(
      `${baseUrl}/api/processador-background`,
      { jobId },
      {
        headers: { 
          'x-internal-secret': internalSecret,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // Aumentado para 30 segundos
      }
    )
    .then(response => {
      console.log(`[API process-image] Processador background iniciado com sucesso: ${jobId}, status: ${response.status}`);
    })
    .catch(error => {
      console.error(`[API process-image] Erro ao iniciar processamento background: ${jobId}`, error);
      
      // Tentar novamente em caso de falha
      setTimeout(() => {
        console.log(`[API process-image] Tentando novamente para ${jobId}...`);
        axios.post(
          `${baseUrl}/api/processador-background`,
          { jobId },
          {
            headers: { 
              'x-internal-secret': internalSecret,
              'Content-Type': 'application/json' 
            },
            timeout: 30000
          }
        ).catch(retryError => {
          console.error(`[API process-image] Falha na segunda tentativa: ${jobId}`, retryError);
        });
      }, 2000); // Tenta novamente após 2 segundos
    });

    // 7. Resposta imediata ao cliente
    console.log(`[API process-image] Retornando resposta de sucesso: ${jobId}`);
    return res.status(202).json({
      success: true,
      message: 'Processamento de imagem iniciado',
      jobId
    });

  } catch (error) {
    console.error(`[API process-image] Erro não tratado: ${jobId}`, error);
    return res.status(500).json({ 
      success: false,
      message: 'Erro no servidor',
      jobId
    });
  }
}