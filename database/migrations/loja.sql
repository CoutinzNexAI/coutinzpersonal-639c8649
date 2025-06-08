-- Tabela de encomendas Gelato
CREATE TABLE gelato_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  transformation_id UUID NOT NULL REFERENCES transformations(id),
  gelato_order_id TEXT, -- ID da encomenda na Gelato
  product_id TEXT NOT NULL, -- ID do produto no nosso sistema
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL,
  user_image_url TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  quantity INTEGER DEFAULT 1,
  customizations JSONB, -- Tamanho, cor, etc.
  shipping_info JSONB NOT NULL, -- Morada de envio
  payment_info JSONB, -- Info de pagamento
  gelato_status TEXT, -- Status da Gelato
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'printing', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela do carrinho
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL,
  transformation_id UUID NOT NULL REFERENCES transformations(id),
  user_image_url TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  customizations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs dos webhooks Gelato
CREATE TABLE gelato_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  gelato_order_id TEXT,
  payload JSONB NOT NULL,
  signature TEXT,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_gelato_orders_user_id ON gelato_orders(user_id);
CREATE INDEX idx_gelato_orders_status ON gelato_orders(status);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_gelato_webhooks_order_id ON gelato_webhooks(gelato_order_id);


-- 1. ADICIONAR campo product_uid em cart_items (CRUCIAL para Gelato)
ALTER TABLE cart_items ADD COLUMN product_uid TEXT NOT NULL DEFAULT '';

-- 2. CRIAR tabela para print files gerados
CREATE TABLE print_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  transformation_id UUID REFERENCES transformations(id),
  gelato_order_id UUID REFERENCES gelato_orders(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  product_id TEXT NOT NULL,
  product_uid TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRIGGERS para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gelato_orders_updated_at 
    BEFORE UPDATE ON gelato_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ÍNDICES adicionais para performance
CREATE INDEX idx_print_files_user_id ON print_files(user_id);
CREATE INDEX idx_print_files_order_id ON print_files(gelato_order_id);
CREATE INDEX idx_gelato_orders_gelato_id ON gelato_orders(gelato_order_id);

-- 5. RLS (Row Level Security) - SEGURANÇA
ALTER TABLE gelato_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_files ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - utilizadores só vêem os seus próprios dados
CREATE POLICY "Users can view own orders" ON gelato_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON gelato_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON gelato_orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own print files" ON print_files
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own print files" ON print_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);