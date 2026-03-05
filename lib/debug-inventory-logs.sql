-- Debug script to check inventory_logs table structure and data
-- Run this in Supabase SQL Editor to see what's in the table

-- 1. Check if table exists and its structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'inventory_logs' 
ORDER BY ordinal_position;

-- 2. Check if there's any data in the table
SELECT 
    COUNT(*) as total_records,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM inventory_logs;

-- 3. Show sample data (if any)
SELECT 
    id,
    product_id,
    product_name,
    quantity_sold,
    remaining_stock,
    sale_id,
    created_at
FROM inventory_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'inventory_logs';

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'inventory_logs';

-- 6. Try a simple query to test table access
SELECT 'Table access test' as test, COUNT(*) as record_count
FROM inventory_logs;

-- 7. Check if products table has the right structure for foreign key
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND column_name = 'id'
ORDER BY ordinal_position;
