-- Create orders table
CREATE TABLE IF NOT EXISTS tb_orders (
  id SERIAL PRIMARY KEY,
  total DECIMAL(10, 2) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Kem Merino',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS tb_transactions (
  id SERIAL PRIMARY KEY,
  gateway VARCHAR(50) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  sub_account VARCHAR(50),
  amount_in DECIMAL(10, 2) DEFAULT 0,
  amount_out DECIMAL(10, 2) DEFAULT 0,
  accumulated DECIMAL(10, 2) NOT NULL,
  code VARCHAR(100) NOT NULL,
  transaction_content TEXT NOT NULL,
  reference_number VARCHAR(100),
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on payment_status for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON tb_orders(payment_status);

-- Create index on order_id in transactions content for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_content ON tb_transactions(transaction_content);

-- Enable Row Level Security (optional, adjust as needed)
ALTER TABLE tb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
-- Allow all operations for service role (used in API routes)
CREATE POLICY "Allow all for service role" ON tb_orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON tb_transactions
  FOR ALL USING (true) WITH CHECK (true);

