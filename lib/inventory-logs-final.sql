-- Final Path Check: Explicit table creation with foreign key relationship
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id INTEGER NOT NULL, -- ✅ INTEGER matching products table
    product_name TEXT NOT NULL,
    quantity_sold INTEGER NOT NULL DEFAULT 1,
    remaining_stock INTEGER NOT NULL,
    sale_id UUID REFERENCES sales(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key relationship to products table for proper joins
ALTER TABLE inventory_logs 
ADD CONSTRAINT fk_inventory_logs_product_id 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_sale_id ON inventory_logs(sale_id);

-- Enable RLS
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Users can view inventory logs" ON inventory_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create inventory logs" ON inventory_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create daily audit summary view
CREATE OR REPLACE VIEW daily_audit_summary AS
SELECT 
    DATE(created_at) as audit_date,
    product_id,
    product_name,
    SUM(quantity_sold) as total_quantity_sold,
    MAX(remaining_stock) as current_stock,
    COUNT(*) as total_transactions,
    MAX(created_at) as last_transaction,
    -- Calculate starting stock by adding sold quantity to remaining stock
    (MAX(remaining_stock) + SUM(quantity_sold)) as starting_stock
FROM inventory_logs
GROUP BY DATE(created_at), product_id, product_name
ORDER BY audit_date DESC, total_quantity_sold DESC;

-- Grant access to views
GRANT SELECT ON daily_audit_summary TO authenticated;

-- Verify table exists and has proper structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'inventory_logs' 
ORDER BY ordinal_position;
