-- Adicionar coluna de rating à tabela transformations
ALTER TABLE transformations 
ADD COLUMN user_rating SMALLINT DEFAULT 0 CHECK (user_rating IN (-1, 0, 1));

-- -1 = dislike, 0 = sem rating, 1 = like

-- Comentário: Esta coluna irá guardar a avaliação do utilizador para cada transformação
-- 0 = sem rating (default)
-- 1 = like (👍)
-- -1 = dislike (👎) 