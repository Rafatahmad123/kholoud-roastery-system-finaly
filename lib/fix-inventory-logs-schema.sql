-- SCHEMA FIX: Add Foreign Key between inventory_logs and products
-- Run this in Supabase SQL Editor

-- First, drop any existing foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_inventory_logs_product_id' 
        AND table_name = 'inventory_logs'
    ) THEN
        ALTER TABLE inventory_logs DROP CONSTRAINT fk_inventory_logs_product_id;
    END IF;
END $$;

-- Add the proper foreign key constraint
ALTER TABLE inventory_logs 
ADD CONSTRAINT fk_inventory_logs_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'inventory_logs';

-- Test the relationship with a simple query
SELECT 
    il.id,
    il.product_id,
    il.product_name,
    il.quantity_sold,
    il.remaining_stock,
    il.created_at,
    p.id as product_ref_id,
    p.name_ar as product_name_ar
FROM inventory_logs il
LEFT JOIN products p ON il.product_id = p.id
ORDER BY il.created_at DESC
LIMIT 1;
