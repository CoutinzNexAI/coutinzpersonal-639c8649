-- Adicionar coluna para controlar desconto de primeira compra
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_purchase_used BOOLEAN DEFAULT FALSE;

-- Comentário: Esta coluna controla se o utilizador já usou o desconto especial da primeira compra
-- FALSE = ainda não comprou nada (elegível para desconto)
-- TRUE = já fez pelo menos uma compra (não elegível para desconto) 