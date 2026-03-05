-- Create Debts and Expenses Tables for Phase 2

-- Debts Table (الديون والذمم)
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('SYP', 'USD')),
  type TEXT NOT NULL CHECK (type IN ('customer', 'supplier')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table (المصاريف والسحوبات)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('SYP', 'USD')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on debts" ON debts FOR ALL USING (true);
CREATE POLICY "Allow all operations on expenses" ON expenses FOR ALL USING (true);

-- Insert sample data for testing
INSERT INTO debts (person_name, amount, currency, type, status, description) VALUES
('أحمد محمد', 50000.00, 'SYP', 'customer', 'pending', 'دين من عميل'),
('شركة القهوة', 150.00, 'USD', 'supplier', 'pending', 'دين للمورد'),
('فاطمة علي', 25000.00, 'SYP', 'customer', 'paid', 'دين تم سداده'),
('مورد السكر', 75.50, 'USD', 'supplier', 'paid', 'دين تم سداده');

INSERT INTO expenses (description, amount, currency, category) VALUES
('إيجار المحل', 150000.00, 'SYP', 'إيجار'),
('رواتب الموظفين', 200000.00, 'SYP', 'رواتب'),
('صيانة آلة القهوة', 50.00, 'USD', 'صيانة'),
('كهرباء ومياه', 35000.00, 'SYP', 'خدمات'),
('تسويق وإعلان', 25.00, 'USD', 'تسويق');

-- Verify tables were created
SELECT 'debts table created' as status, COUNT(*) as count FROM debts;
SELECT 'expenses table created' as status, COUNT(*) as count FROM expenses;
