-- Corrigir função use_daily_transformation
-- O problema é o casting direto de JSON para INTEGER

DROP FUNCTION IF EXISTS use_daily_transformation(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.use_daily_transformation(
    p_user_id uuid, 
    p_transformation_id uuid DEFAULT NULL::uuid, 
    p_limit integer DEFAULT 10
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_usage INTEGER;
    remaining_count INTEGER;
    result JSON;
    limit_check_result JSON;
BEGIN
    -- Verificar limite atual
    SELECT check_daily_transformation_limit(p_user_id, p_limit) INTO limit_check_result;
    
    -- Extrair current_usage do JSON corretamente usando ->> em vez de ->
    current_usage := (limit_check_result->>'current_usage')::INTEGER;
    
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
$$; 