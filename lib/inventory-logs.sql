-- Create inventory_logs table for daily audit tracking
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id INTEGER NOT NULL, -- ✅ Sync: Use existing Integer product_id
    product_name TEXT NOT NULL,
    quantity_sold INTEGER NOT NULL DEFAULT 1,
    remaining_stock INTEGER NOT NULL,
    sale_id UUID REFERENCES sales(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_sale_id ON inventory_logs(sale_id);

-- Add RLS policies
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Policy for reading inventory logs (authenticated users only)
CREATE POLICY "Users can view inventory logs" ON inventory_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for creating inventory logs (authenticated users only)
CREATE POLICY "Users can create inventory logs" ON inventory_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a view for daily audit summary
CREATE OR REPLACE VIEW daily_audit_summary AS
SELECT 
    DATE(created_at) as audit_date,
    product_id,
    product_name,
    SUM(quantity_sold) as total_quantity_sold,
    MAX(remaining_stock) as current_stock,
    COUNT(*) as total_transactions,
    MAX(created_at) as last_transaction
FROM inventory_logs
GROUP BY DATE(created_at), product_id, product_name
ORDER BY audit_date DESC, total_quantity_sold DESC;

-- Grant access to the view
GRANT SELECT ON daily_audit_summary TO authenticated;
