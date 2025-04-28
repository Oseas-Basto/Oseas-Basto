-- Create the reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN (
    'once',
    'daily',
    'weekly'
  )) DEFAULT 'once',
  notes TEXT,
  coordinates JSONB NOT NULL, -- Store as [longitude, latitude]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own reminders
CREATE POLICY "Allow users to view their own reminders" ON reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own reminders
CREATE POLICY "Allow users to insert their own reminders" ON reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reminders
CREATE POLICY "Allow users to update their own reminders" ON reminders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reminders
CREATE POLICY "Allow users to delete their own reminders" ON reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Create an index on user_id for faster lookups
CREATE INDEX idx_reminders_user_id ON reminders(user_id);

-- Optional: Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

