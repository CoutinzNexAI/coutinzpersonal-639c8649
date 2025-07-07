-- SCRIPT SQL PARA SUBSTITUIR PICCOINS POR TRANSFORMAÇÕES DIÁRIAS
-- Execute este script no Supabase SQL Editor

-- 1. CRIAR TABELA PARA TRACKING DE TRANSFORMAÇÕES DIÁRIAS
CREATE TABLE IF NOT EXISTS daily_transformation_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    transformations_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para garantir uma linha por user por dia
    UNIQUE(user_id, date)
);

-- 2. CRIAR INDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON daily_transformation_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_limits_date ON daily_transformation_limits(date);

-- 3. CRIAR FUNÇÃO PARA VERIFICAR LIMITE DIÁRIO
CREATE OR REPLACE FUNCTION check_daily_transformation_limit(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS JSON AS $$
DECLARE
    current_usage INTEGER;
    remaining_count INTEGER;
    reset_time TIMESTAMP WITH TIME ZONE;
    result JSON;
BEGIN
    -- Obter uso atual para hoje
    SELECT COALESCE(transformations_used, 0) 
    INTO current_usage
    FROM daily_transformation_limits 
    WHERE user_id = p_user_id 
    AND date = CURRENT_DATE;
    
    -- Se não existe registo para hoje, criar
    IF current_usage IS NULL THEN
        current_usage := 0;
        INSERT INTO daily_transformation_limits (user_id, date, transformations_used)
        VALUES (p_user_id, CURRENT_DATE, 0)
        ON CONFLICT (user_id, date) DO NOTHING;
    END IF;
    
    -- Calcular restantes
    remaining_count := p_limit - current_usage;
    
    -- Calcular hora do reset (meia-noite seguinte)
    reset_time := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
    
    -- Retornar resultado
    result := json_build_object(
        'can_transform', remaining_count > 0,
        'current_usage', current_usage,
        'remaining_count', GREATEST(0, remaining_count),
        'daily_limit', p_limit,
        'reset_time', reset_time,
        'hours_until_reset', EXTRACT(EPOCH FROM (reset_time - NOW())) / 3600
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR FUNÇÃO PARA USAR UMA TRANSFORMAÇÃO
CREATE OR REPLACE FUNCTION use_daily_transformation(
    p_user_id UUID,
    p_transformation_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
) RETURNS JSON AS $$
DECLARE
    current_usage INTEGER;
    remaining_count INTEGER;
    result JSON;
BEGIN
    -- Verificar limite atual
    SELECT (check_daily_transformation_limit(p_user_id, p_limit)->'current_usage')::INTEGER 
    INTO current_usage;
    
    remaining_count := p_limit - current_usage;
    
    -- Se não há transformações restantes
    IF remaining_count <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'daily_limit_exceeded',
            'message', 'Limite diário de transformações esgotado',
            'current_usage', current_usage,
            'daily_limit', p_limit
        );
    END IF;
    
    -- Incrementar contador
    INSERT INTO daily_transformation_limits (user_id, date, transformations_used)
    VALUES (p_user_id, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date) 
    DO UPDATE SET 
        transformations_used = daily_transformation_limits.transformations_used + 1,
        updated_at = NOW();
    
    -- Log da transformação (opcional - para auditoria)
    IF p_transformation_id IS NOT NULL THEN
        UPDATE transformations 
        SET updated_at = NOW()
        WHERE id = p_transformation_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'current_usage', current_usage + 1,
        'remaining_count', remaining_count - 1,
        'daily_limit', p_limit,
        'transformation_id', p_transformation_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CRIAR FUNÇÃO PARA CLEANUP DE DADOS ANTIGOS (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_daily_limits(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM daily_transformation_limits 
    WHERE date < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_daily_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_limits_updated_at
    BEFORE UPDATE ON daily_transformation_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_limits_updated_at();

-- 7. ADICIONAR RLS (ROW LEVEL SECURITY) PARA SEGURANÇA
ALTER TABLE daily_transformation_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own daily limits" 
ON daily_transformation_limits 
FOR ALL 
USING (auth.uid() = user_id);

-- 8. GRANT PERMISSIONS
GRANT ALL ON daily_transformation_limits TO authenticated;
GRANT EXECUTE ON FUNCTION check_daily_transformation_limit(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION use_daily_transformation(UUID, UUID, INTEGER) TO authenticated;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE daily_transformation_limits IS 'Tracking de transformações diárias por utilizador - substitui sistema PicCoins';
COMMENT ON FUNCTION check_daily_transformation_limit IS 'Verifica quantas transformações restam para o utilizador hoje';
COMMENT ON FUNCTION use_daily_transformation IS 'Consome uma transformação diária e verifica limites';
COMMENT ON FUNCTION cleanup_old_daily_limits IS 'Remove dados antigos da tabela daily_transformation_limits';

-- 10. DADOS DE TESTE (opcional - remover em produção)
-- INSERT INTO daily_transformation_limits (user_id, date, transformations_used) 
-- VALUES ('00000000-0000-0000-0000-000000000000', CURRENT_DATE, 5); 