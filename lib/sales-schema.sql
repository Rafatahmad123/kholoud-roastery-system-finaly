-- Sales Tables Schema for Supabase
-- This file defines the exact schema needed for POS functionality

-- Sales Table (Header)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  customer_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale Items Table (Line Items)
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Enable RLS (Row Level Security)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies for sales table
CREATE POLICY "Users can view sales" ON sales
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sales" ON sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update sales" ON sales
  FOR UPDATE USING (true);

-- Create policies for sale_items table
CREATE POLICY "Users can view sale items" ON sale_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sale items" ON sale_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update sale items" ON sale_items
  FOR UPDATE USING (true);

-- Function to update stock quantity
CREATE OR REPLACE FUNCTION decrement_stock(product_id INTEGER, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity - quantity,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock when sale is created
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Update stock for each item in the sale
  INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
  SELECT NEW.id, item.product_id, item.quantity, item.unit_price, item.total_price
  FROM unnest(NEW.items) AS item;
  
  -- Decrement stock quantities
  UPDATE products 
  SET stock_quantity = stock_quantity - item.quantity
  FROM unnest(NEW.items) AS item
  WHERE products.id = item.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger approach above is complex. 
-- For simplicity, we'll handle stock updates in the API route.
