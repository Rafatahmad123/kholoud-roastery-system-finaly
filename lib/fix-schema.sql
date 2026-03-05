-- SQL Script to Fix Schema Mismatch
-- Run this in Supabase SQL Editor if needed

-- Add name column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS name text;

-- Add other missing columns if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price_usd numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS exchange_rate numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date date;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public'
ORDER BY column_name;
