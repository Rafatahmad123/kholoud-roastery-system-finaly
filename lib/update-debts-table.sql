-- Update Debts Table for Payment Tracking
-- Add payment_history column to track installment payments

-- Add payment_history column if it doesn't exist
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS payment_history TEXT;

-- Create index for payment_history for better performance
CREATE INDEX IF NOT EXISTS idx_debts_payment_history ON debts(payment_history);

-- Update existing RLS policy to include payment_history
DROP POLICY IF EXISTS "Allow all operations on debts" ON debts;
CREATE POLICY "Allow all operations on debts" ON debts FOR ALL USING (true);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'debts' 
AND column_name = 'payment_history';

-- Test the updated structure with a sample payment history
UPDATE debts 
SET payment_history = 'Paid 25000.00 SYP on 03/03/2026 | Paid 15000.00 SYP on 04/03/2026'
WHERE person_name = 'أحمد محمد' AND payment_history IS NULL;

-- Show updated table structure
SELECT * FROM debts WHERE person_name = 'أحمد محمد';
