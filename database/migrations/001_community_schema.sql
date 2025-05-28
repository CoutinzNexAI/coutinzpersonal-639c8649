-- =====================================================
-- PICTUZ COMMUNITY FEATURE - DATABASE SCHEMA
-- Fase 1.1 - Sistema de Comunidade Completo
-- =====================================================

-- 1. ATUALIZAR TABELA TRANSFORMATIONS
-- ====================================

-- Adicionar colunas para comunidade
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS public_title TEXT;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS public_description TEXT;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS incentive_granted_for_publication BOOLEAN DEFAULT FALSE;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS submitted_for_publication_at TIMESTAMPTZ;
ALTER TABLE transformations ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Criar enum para community_status se não existir
DO $$ BEGIN
    CREATE TYPE community_status AS ENUM ('private', 'pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE transformations ADD COLUMN IF NOT EXISTS community_status community_status DEFAULT 'private';

-- 2. CRIAR NOVAS TABELAS
-- =====================

-- Tabela de likes nas transformações
CREATE TABLE IF NOT EXISTS transformation_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transformation_id UUID NOT NULL REFERENCES transformations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, transformation_id)
);

-- Tabela de comentários da comunidade
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transformation_id UUID NOT NULL REFERENCES transformations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (char_length(comment_text) BETWEEN 1 AND 280),
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  is_hidden_by_admin BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0
);

-- Tabela de likes nos comentários
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

-- Tabela de limites semanais para anti-gaming
CREATE TABLE IF NOT EXISTS user_weekly_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  publications_this_week INTEGER DEFAULT 0,
  comments_for_bonus_count INTEGER DEFAULT 0,
  last_action_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, week_start_date)
);

-- 3. ÍNDICES PARA PERFORMANCE
-- ===========================

-- Índices para transformations community queries
CREATE INDEX IF NOT EXISTS idx_transformations_community_approved 
ON transformations(community_status, published_at DESC) 
WHERE community_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_transformations_community_popular 
ON transformations(community_status, like_count DESC, published_at DESC) 
WHERE community_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_transformations_pending_approval 
ON transformations(community_status, submitted_for_publication_at DESC) 
WHERE community_status = 'pending_approval';

CREATE INDEX IF NOT EXISTS idx_transformations_user_private 
ON transformations(user_id, community_status, status) 
WHERE community_status = 'private' AND status = 'completed';

-- Índices para likes
CREATE INDEX IF NOT EXISTS idx_transformation_likes_transformation 
ON transformation_likes(transformation_id);

CREATE INDEX IF NOT EXISTS idx_transformation_likes_user 
ON transformation_likes(user_id);

-- Índices para comentários
CREATE INDEX IF NOT EXISTS idx_community_comments_transformation 
ON community_comments(transformation_id, created_at ASC) 
WHERE is_hidden_by_admin = FALSE;

CREATE INDEX IF NOT EXISTS idx_community_comments_user 
ON community_comments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_comments_parent 
ON community_comments(parent_comment_id, created_at ASC) 
WHERE parent_comment_id IS NOT NULL AND is_hidden_by_admin = FALSE;

-- Índices para comment likes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment 
ON comment_likes(comment_id);

-- Índices para weekly limits
CREATE INDEX IF NOT EXISTS idx_user_weekly_limits_week 
ON user_weekly_limits(week_start_date);

-- 4. TRIGGERS AUTOMÁTICOS
-- =======================

-- Trigger para atualizar like_count nas transformations
CREATE OR REPLACE FUNCTION update_transformation_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE transformations 
    SET like_count = like_count + 1 
    WHERE id = NEW.transformation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE transformations 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = OLD.transformation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transformation_like_count ON transformation_likes;
CREATE TRIGGER trigger_update_transformation_like_count
  AFTER INSERT OR DELETE ON transformation_likes
  FOR EACH ROW EXECUTE FUNCTION update_transformation_like_count();

-- Trigger para atualizar comment_count nas transformations
CREATE OR REPLACE FUNCTION update_transformation_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_hidden_by_admin = FALSE THEN
      UPDATE transformations 
      SET comment_count = comment_count + 1 
      WHERE id = NEW.transformation_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_hidden_by_admin = FALSE THEN
      UPDATE transformations 
      SET comment_count = GREATEST(comment_count - 1, 0) 
      WHERE id = OLD.transformation_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_hidden_by_admin = FALSE AND NEW.is_hidden_by_admin = TRUE THEN
      UPDATE transformations 
      SET comment_count = GREATEST(comment_count - 1, 0) 
      WHERE id = NEW.transformation_id;
    ELSIF OLD.is_hidden_by_admin = TRUE AND NEW.is_hidden_by_admin = FALSE THEN
      UPDATE transformations 
      SET comment_count = comment_count + 1 
      WHERE id = NEW.transformation_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_transformation_comment_count ON community_comments;
CREATE TRIGGER trigger_update_transformation_comment_count
  AFTER INSERT OR DELETE OR UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_transformation_comment_count();

-- Trigger para atualizar like_count nos comentários
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_like_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_like_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- Trigger para updated_at nos comentários
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_updated_at ON community_comments;
CREATE TRIGGER trigger_update_comment_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_updated_at();

-- 5. RPC FUNCTIONS
-- ================

-- Função para toggle like otimizado
CREATE OR REPLACE FUNCTION toggle_transformation_like(
  p_user_id UUID,
  p_transformation_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN;
  v_like_count INTEGER;
BEGIN
  -- Verificar se o like já existe
  SELECT EXISTS(
    SELECT 1 FROM transformation_likes 
    WHERE user_id = p_user_id AND transformation_id = p_transformation_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remover like
    DELETE FROM transformation_likes 
    WHERE user_id = p_user_id AND transformation_id = p_transformation_id;
  ELSE
    -- Adicionar like
    INSERT INTO transformation_likes (user_id, transformation_id) 
    VALUES (p_user_id, p_transformation_id);
  END IF;
  
  -- Buscar contagem atualizada
  SELECT like_count INTO v_like_count
  FROM transformations 
  WHERE id = p_transformation_id;
  
  RETURN json_build_object(
    'is_liked', NOT v_exists,
    'like_count', COALESCE(v_like_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para toggle comment like
CREATE OR REPLACE FUNCTION toggle_comment_like(
  p_user_id UUID,
  p_comment_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN;
  v_like_count INTEGER;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM comment_likes 
    WHERE user_id = p_user_id AND comment_id = p_comment_id
  ) INTO v_exists;
  
  IF v_exists THEN
    DELETE FROM comment_likes 
    WHERE user_id = p_user_id AND comment_id = p_comment_id;
  ELSE
    INSERT INTO comment_likes (user_id, comment_id) 
    VALUES (p_user_id, p_comment_id);
  END IF;
  
  SELECT like_count INTO v_like_count
  FROM community_comments 
  WHERE id = p_comment_id;
  
  RETURN json_build_object(
    'is_liked', NOT v_exists,
    'like_count', COALESCE(v_like_count, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ROW LEVEL SECURITY (RLS)
-- ============================

-- RLS para transformation_likes
ALTER TABLE transformation_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all likes
CREATE POLICY IF NOT EXISTS "Users can view all transformation likes" 
ON transformation_likes FOR SELECT 
USING (true);

-- Policy: Users can manage their own likes
CREATE POLICY IF NOT EXISTS "Users can manage their own transformation likes" 
ON transformation_likes FOR ALL 
USING (auth.uid() = user_id);

-- RLS para community_comments
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view visible comments
CREATE POLICY IF NOT EXISTS "Users can view visible comments" 
ON community_comments FOR SELECT 
USING (is_hidden_by_admin = FALSE);

-- Policy: Users can insert their own comments
CREATE POLICY IF NOT EXISTS "Users can insert their own comments" 
ON community_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments (within time limit)
CREATE POLICY IF NOT EXISTS "Users can update their own comments" 
ON community_comments FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND created_at > NOW() - INTERVAL '15 minutes'
  AND is_hidden_by_admin = FALSE
);

-- Policy: Service role can manage all comments
CREATE POLICY IF NOT EXISTS "Service role can manage all comments" 
ON community_comments FOR ALL 
USING (auth.role() = 'service_role');

-- RLS para comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view all comment likes" 
ON comment_likes FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Users can manage their own comment likes" 
ON comment_likes FOR ALL 
USING (auth.uid() = user_id);

-- RLS para user_weekly_limits
ALTER TABLE user_weekly_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own weekly limits" 
ON user_weekly_limits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role can manage all weekly limits" 
ON user_weekly_limits FOR ALL 
USING (auth.role() = 'service_role');

-- 7. VIEWS ÚTEIS
-- ==============

-- View para posts públicos com dados do utilizador
CREATE OR REPLACE VIEW public_transformations_with_user AS
SELECT 
  t.id,
  t.public_title,
  t.public_description,
  t.output_url,
  t.like_count,
  t.comment_count,
  t.view_count,
  t.published_at,
  t.style_requested,
  t.user_id,
  u.full_name as user_full_name,
  u.avatar_url as user_avatar_url,
  s.name as style_name
FROM transformations t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN styles s ON t.style_requested = s.id
WHERE t.community_status = 'approved'
ORDER BY t.published_at DESC;

-- =====================================================
-- SCHEMA CRIADO COM SUCESSO! 🎉
-- 
-- Próximos passos:
-- 1. Executar este script no Supabase
-- 2. Criar as validações e rate limiting
-- 3. Implementar as APIs
-- 4. Criar os componentes frontend
-- ===================================================== 