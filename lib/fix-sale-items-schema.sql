-- Fix Sale Items Schema Issues
-- Based on error: "Could not find 'created_at' column of 'sale_items' in schema cache"

-- Check current sale_items table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
ORDER BY ordinal_position;

-- Add missing columns to sale_items table
ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES sales(id) ON DELETE CASCADE;

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS product_id INTEGER NOT NULL REFERENCES products(id);

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL CHECK (quantity > 0);

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0);

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (wholesale_price >= 0);

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0);

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies for sale_items table
DROP POLICY IF EXISTS "Users can view sale items" ON sale_items;
CREATE POLICY "Users can view sale items" ON sale_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert sale items" ON sale_items;
CREATE POLICY "Users can insert sale items" ON sale_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update sale items" ON sale_items;
CREATE POLICY "Users can update sale items" ON sale_items
  FOR UPDATE USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Test the schema with a simple insert
-- This should work after fixes
-- INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, wholesale_price, total_price) 
-- VALUES (
--   gen_random_uuid(), 
--   gen_random_uuid(), 
--   1, 
--   1, 
--   100.00, 
--   50.00, 
--   100.00
-- )
-- RETURNING *;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'sale_items' 
ORDER BY ordinal_position;
