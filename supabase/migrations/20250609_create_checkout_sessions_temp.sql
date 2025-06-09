-- Migration: Create checkout_sessions_temp table
-- Purpose: Store cart items temporarily during Stripe checkout to avoid 500 char metadata limit
-- Date: 2025-06-09

CREATE TABLE IF NOT EXISTS checkout_sessions_temp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkout_reference TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    shipping_method JSONB NOT NULL DEFAULT '{}'::jsonb,
    financial_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_temp_reference 
    ON checkout_sessions_temp(checkout_reference);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_temp_user_id 
    ON checkout_sessions_temp(user_id);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_temp_expires_at 
    ON checkout_sessions_temp(expires_at);

-- RLS (Row Level Security) Policies
ALTER TABLE checkout_sessions_temp ENABLE ROW LEVEL SECURITY;

-- Política: Utilizadores só podem ver e editar os seus próprios checkouts
CREATE POLICY "Users can view own checkout sessions" 
    ON checkout_sessions_temp FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkout sessions" 
    ON checkout_sessions_temp FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkout sessions" 
    ON checkout_sessions_temp FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkout sessions" 
    ON checkout_sessions_temp FOR DELETE 
    USING (auth.uid() = user_id);

-- Política adicional para acesso do servidor (service role)
CREATE POLICY "Service role can manage all checkout sessions" 
    ON checkout_sessions_temp FOR ALL 
    USING (current_setting('role') = 'service_role');

-- Função para limpar sessões expiradas automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_checkout_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM checkout_sessions_temp 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_checkout_sessions_temp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER checkout_sessions_temp_updated_at
    BEFORE UPDATE ON checkout_sessions_temp
    FOR EACH ROW
    EXECUTE FUNCTION update_checkout_sessions_temp_updated_at();

-- Comentários para documentação
COMMENT ON TABLE checkout_sessions_temp IS 'Temporary storage for cart items during Stripe checkout to avoid metadata limits';
COMMENT ON COLUMN checkout_sessions_temp.checkout_reference IS 'Unique reference passed to Stripe metadata for correlation';
COMMENT ON COLUMN checkout_sessions_temp.cart_items IS 'Complete cart items array with all product details';
COMMENT ON COLUMN checkout_sessions_temp.shipping_method IS 'Selected shipping method details';
COMMENT ON COLUMN checkout_sessions_temp.financial_data IS 'Subtotal, shipping, tax, and total amounts';
COMMENT ON COLUMN checkout_sessions_temp.expires_at IS 'When this checkout session expires (typically 2 hours)'; 