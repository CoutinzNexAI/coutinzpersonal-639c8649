import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextApiRequest, NextApiResponse } from 'next';

// Verifica se as variáveis de ambiente estão definidas
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Em desenvolvimento, podemos não querer que isto bloqueie o arranque, mas avisar é importante.
  // Em produção, idealmente, a ausência destas variáveis deveria ser um erro crítico.
  console.warn("ATENÇÃO: Variáveis de ambiente do Upstash Redis (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) não configuradas. O Rate Limiting não funcionará ou usará um fallback que não limita, dependendo da implementação abaixo.");
}

// Inicializa o cliente Redis apenas se as variáveis estiverem presentes
const redisClient = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? Redis.fromEnv() // fromEnv() lê automaticamente UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
  : null;

// Configuração padrão do Rate Limiter:
// 10 pedidos a cada 10 segundos por identificador (IP ou userId)
const defaultRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(40, "10 s"), 
  analytics: true, 
  prefix: "pictuz_ratelimit_default", 
}) : null;

// Limiter mais restritivo para o processamento de imagem
export const processImageApiRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "10 m"), // Ex: 50 pedidos a cada 10 minutos
  analytics: true,
  prefix: "pictuz_ratelimit_process_image",
}) : null;

// Limiter para a API de compra
export const purchaseApiRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "1 m"),  // Ex: 10 pedidos por minuto (evita bloquear users legítimos)
  analytics: true,
  prefix: "pictuz_ratelimit_purchase",
}) : null;

// Limiter mais generoso para get-transformation-status
export const getStatusApiRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(200, "1 m"), // Ex: 100 pedidos por minuto
  analytics: true,
  prefix: "pictuz_ratelimit_get_status",
}) : null;

// =====================================================
// COMMUNITY RATE LIMITERS - FASE 1.1
// Rate limiting específico para funcionalidades da comunidade
// =====================================================

// Rate limiting para submissão de publicações (muito restritivo)
export const communitySubmitRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 submissões por hora
  analytics: true,
  prefix: "pictuz_community_submit",
}) : null;

// Rate limiting para likes (moderado)
export const communityLikeRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(50, "1 m"), // 50 likes por minuto
  analytics: true,
  prefix: "pictuz_community_like",
}) : null;

// Rate limiting para comentários (restritivo)
export const communityCommentRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 comentários por minuto
  analytics: true,
  prefix: "pictuz_community_comment",
}) : null;

// Rate limiting para visualização de conteúdo (generoso)
export const communityViewRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 views por minuto
  analytics: true,
  prefix: "pictuz_community_view",
}) : null;

// Rate limiting para buscar transformações privadas (moderado)
export const communityPrivateListRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests por minuto
  analytics: true,
  prefix: "pictuz_community_private_list",
}) : null;

// Rate limiting para buscar comentários (generoso)
export const communityCommentsListRateLimiter = redisClient ? new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests por minuto
  analytics: true,
  prefix: "pictuz_community_comments_list",
}) : null;

/**
 * Aplica rate limiting a um pedido.
 * @param req O objeto NextApiRequest.
 * @param res O objeto NextApiResponse.
 * @param limiter Uma instância de Ratelimit específica (usa o defaultRateLimiter se não fornecido).
 * @param identifier Um identificador único para o rate limit (ex: IP do utilizador ou userId). Se não fornecido, usa o IP.
 * @returns {Promise<boolean>} True se o pedido for permitido, False se for bloqueado (resposta 429 já enviada).
 */
export async function applyRateLimit(
  req: NextApiRequest, 
  res: NextApiResponse,
  limiterInput?: Ratelimit | null, // Aceita null se o limiter específico não estiver inicializado
  identifier?: string
): Promise<boolean> {

  const effectiveLimiter = limiterInput || defaultRateLimiter;

  // Se nem o limiter específico nem o default estiverem inicializados (Redis não configurado)
  if (!effectiveLimiter) {
    // Em desenvolvimento, pode ser útil não bloquear se o Redis não estiver configurado.
    // Em produção, isto seria um erro de configuração grave.
    if (process.env.NODE_ENV === 'development') {
        console.warn("[RateLimit] Rate limiter não inicializado (Redis não configurado?). Permitindo pedido em desenvolvimento.");
        return true; 
    }
    // Em produção, se o rate limiter não estiver configurado, é mais seguro bloquear ou logar um erro crítico.
    // Por agora, vamos logar e bloquear para ser mais seguro, mas isto indica um problema de setup.
    console.error("[RateLimit] CRITICAL: Rate limiter não inicializado e ambiente não é desenvolvimento. Bloqueando pedido.");
    res.status(500).json({ message: "Erro de configuração interna do servidor (Rate Limit)." });
    return false;
  }

  // Tenta obter o IP do cliente de várias formas comuns em ambientes Vercel/Next.js
  const clientIp = 
    (typeof req.headers['x-forwarded-for'] === 'string' 
        ? req.headers['x-forwarded-for'].split(',').shift()?.trim() 
        : req.headers['x-forwarded-for']?.[0]?.trim()) || 
    req.socket?.remoteAddress || 
    'unknown_ip';

  const id = identifier || clientIp; 

  console.log(`[RateLimit] Aplicando limite para o identificador: ${id.startsWith('unknown') ? `IP_FALLBACK (${id})` : id }`);

  try {
    const { success, limit, remaining, reset } = await effectiveLimiter.limit(id);

    // Adiciona os headers informativos à resposta
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil((reset - Date.now()) / 1000).toString()); // Segundos até reset

    if (!success) {
      console.warn(`[RateLimit] BLOQUEADO para ${id}. Limite: ${limit}, Restantes: ${remaining}, Reset em: ${new Date(reset).toISOString()}`);
      res.status(429).json({
        message: "Demasiados pedidos. Por favor, tente novamente mais tarde.",
        limit,
        remaining,
        resetTimestamp: reset,
        resetsInSeconds: Math.ceil((reset - Date.now()) / 1000)
      });
      return false; // Pedido bloqueado
    }

    console.log(`[RateLimit] PERMITIDO para ${id}. Limite: ${limit}, Restantes: ${remaining}`);
    return true; // Pedido permitido
  } catch (error) {
    console.error("[RateLimit] Erro ao aplicar rate limit com Upstash:", error);
    // Em caso de erro com o serviço de rate limit (ex: Upstash offline),
    // é uma decisão de design se bloqueias ou permites os pedidos.
    // Permitir é muitas vezes mais seguro para não bloquear utilizadores legítimos por uma falha tua.
    // Considera logar este erro num sistema de monitorização.
    if (process.env.NODE_ENV === 'development') {
        console.warn("[RateLimit] Permitindo pedido devido a erro no serviço de rate limit (desenvolvimento).");
        return true;
    }
    // Em produção, talvez queiras ser mais cauteloso, mas bloquear pode afetar todos os utilizadores.
    // Por agora, vamos permitir, mas isto deve ser monitorizado.
    console.error("[RateLimit] CRÍTICO: Erro no serviço de rate limit. Permitindo pedido para evitar paragem total.");
    return true; 
  }
}