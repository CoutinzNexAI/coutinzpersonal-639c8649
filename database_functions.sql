-- Função para dar PicCoins aos utilizadores
CREATE OR REPLACE FUNCTION earn_piccoins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'earned',
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'PicCoins earned'
)
RETURNS JSON AS $$
DECLARE
  v_new_balance INTEGER;
  v_result JSON;
BEGIN
  -- Atualizar o saldo do utilizador
  UPDATE users 
  SET piccoin_balance = COALESCE(piccoin_balance, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING piccoin_balance INTO v_new_balance;
  
  -- Verificar se o utilizador existe
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Inserir transação no histórico
  INSERT INTO piccoin_transactions (
    user_id,
    amount,
    type,
    reference_id,
    description,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_reference_id,
    p_description,
    NOW()
  );
  
  -- Retornar sucesso com novo saldo
  RETURN json_build_object(
    'success', true, 
    'newBalance', v_new_balance
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Definir valor padrão para piccoin_balance
ALTER TABLE users 
ALTER COLUMN piccoin_balance SET DEFAULT 2;

-- Atualizar utilizadores existentes que têm NULL para terem 2 PicCoins
UPDATE users 
SET piccoin_balance = 2 
WHERE piccoin_balance IS NULL; 