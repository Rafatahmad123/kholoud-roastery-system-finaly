-- Fix Sales Schema Issues
-- Based on error: "Could not find 'updated_at' column of 'sales' in schema cache"

-- Check current sales table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

-- Add missing columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'cash';

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

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
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0);

ALTER TABLE sale_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Test the schema with a simple insert
-- This should work after the fixes
-- INSERT INTO sales (id, total_amount, payment_method) 
-- VALUES (gen_random_uuid(), 100.00, 'cash')
-- RETURNING *;
