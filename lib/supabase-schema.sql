-- Supabase Schema Definition
-- This file defines the exact schema expected in Supabase

-- Settings Table for Exchange Rate
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  rate DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category TEXT,
  wholesale_price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  packaging TEXT,
  roast_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default exchange rate
INSERT INTO settings (id, rate) 
VALUES ('exchange_rate', 37500)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for settings table
CREATE POLICY "Users can view settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Users can update settings" ON settings
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert settings" ON settings
  FOR INSERT WITH CHECK (true);

-- Create policies for products table
CREATE POLICY "Users can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Users can insert products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update products" ON products
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete products" ON products
  FOR DELETE USING (true);
