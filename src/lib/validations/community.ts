import { z } from 'zod';

// =====================================================
// PICTUZ COMMUNITY - VALIDATION SCHEMAS (SIMPLIFICADO)
// Validações para a comunidade simplificada - apenas transformações e likes
// =====================================================

// SCHEMAS PARA DADOS DE INPUT
// ===========================

export const submitPublicationSchema = z.object({
  transformationId: z.string().uuid('ID de transformação inválido'),
  public_title: z.string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título deve ter no máximo 100 caracteres')
    .trim()
    .refine(
      (title) => !/<[^>]*>/g.test(title),
      'Título não pode conter HTML'
    )
    .optional(),
  public_description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .refine(
      (desc) => !/<[^>]*>/g.test(desc),
      'Descrição não pode conter HTML'
    )
    .optional(),
});

export const toggleLikeSchema = z.object({
  transformation_id: z.string().uuid('ID de transformação inválido'),
});

// SCHEMAS PARA QUERY PARAMETERS
// ==============================

export const getPublicTransformationsSchema = z.object({
  page: z.coerce.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.coerce.number().min(1).max(20, 'Limite máximo é 20').default(12),
  sort: z.enum(['recent', 'popular', 'trending']).default('recent'),
  timeframe: z.enum(['day', 'week', 'month', 'all']).default('all'),
  search: z.string().optional(),
});

export const getMyPrivateTransformationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// ANTI-GAMING CONSTANTS (SIMPLIFICADO)
// =====================================

export const ANTI_GAMING_LIMITS = {
  // Limites semanais para bónus (apenas publicações)
  MAX_PUBLICATIONS_BONUS_PER_WEEK: 1,
  
  // Cooldowns para prevenir spam
  MIN_COOLDOWN_BETWEEN_ACTIONS_MS: 5000, // 5 segundos
  MIN_COOLDOWN_BETWEEN_LIKES_MS: 1000, // 1 segundo
  
  // Limites de likes
  MAX_LIKES_PER_USER_PER_MINUTE: 30,
  
  // Limites de publicação
  MAX_PUBLICATIONS_PER_DAY: 3,
  MAX_PENDING_PUBLICATIONS_PER_USER: 5,
} as const;

// CONTENT MODERATION
// ==================

const FORBIDDEN_WORDS = [
  // Lista básica - expandir conforme necessário
  'spam', 'fake', 'scam', 'hack',
  // Adicionar mais palavras proibidas aqui
];

const SUSPICIOUS_PATTERNS = [
  /(.)\1{10,}/, // Repetição excessiva de caracteres
  /[A-Z]{10,}/, // Texto todo em maiúsculas
  /(https?:\/\/[^\s]+)/gi, // URLs (opcional - talvez queiras permitir)
  /[^\w\s\u00C0-\u017F\u0100-\u024F.,!?@#$%&*()[\]{}:;"'<>+=\-_|\\/`~]/gi, // Caracteres especiais suspeitos
];

export const validateContentSafety = (text: string): { isValid: boolean; reason?: string } => {
  const lowerText = text.toLowerCase();
  
  // Verificar palavras proibidas
  for (const word of FORBIDDEN_WORDS) {
    if (lowerText.includes(word)) {
      return { isValid: false, reason: 'Conteúdo contém palavras não permitidas' };
    }
  }
  
  // Verificar padrões suspeitos
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      return { isValid: false, reason: 'Formato de texto suspeito detectado' };
    }
  }
  
  return { isValid: true };
};

// UTILITY FUNCTIONS
// =================

export const getWeekStart = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString().split('T')[0];
};

export const timeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  
  return past.toLocaleDateString('pt-PT', { 
    day: 'numeric', 
    month: 'short' 
  });
};

export const formatLikeCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

// TYPE EXPORTS
// ============

export type SubmitPublicationData = z.infer<typeof submitPublicationSchema>;
export type ToggleLikeData = z.infer<typeof toggleLikeSchema>;
export type GetPublicTransformationsQuery = z.infer<typeof getPublicTransformationsSchema>;
export type GetMyPrivateTransformationsQuery = z.infer<typeof getMyPrivateTransformationsSchema>;

// ERROR MESSAGES
// ==============

export const COMMUNITY_ERROR_MESSAGES = {
  UNAUTHORIZED: 'É necessário fazer login para esta ação',
  FORBIDDEN: 'Não tem permissão para esta ação',
  NOT_FOUND: 'Conteúdo não encontrado',
  TRANSFORMATION_NOT_COMPLETED: 'A transformação deve estar completa para ser publicada',
  TRANSFORMATION_ALREADY_SUBMITTED: 'Esta transformação já foi submetida',
  TRANSFORMATION_NOT_PUBLIC: 'Esta transformação não está pública',
  COOLDOWN_ACTIVE: 'Por favor aguarde antes de realizar outra ação',
  RATE_LIMIT_EXCEEDED: 'Muitas ações recentes. Tente novamente mais tarde',
  WEEKLY_LIMIT_REACHED: 'Limite semanal de bónus atingido',
  DAILY_LIMIT_REACHED: 'Limite diário de publicações atingido',
  CONTENT_VALIDATION_FAILED: 'O conteúdo não passou na validação',
  SPAM_DETECTED: 'Comportamento suspeito detectado',
  SERVER_ERROR: 'Erro interno do servidor',
} as const; 