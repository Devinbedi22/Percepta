-- Create skin_analyses table for storing user analysis history
CREATE TABLE IF NOT EXISTS skin_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  detected_issues TEXT[] NOT NULL DEFAULT '{}',
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS skin_analyses_user_id_idx ON skin_analyses(user_id);
CREATE INDEX IF NOT EXISTS skin_analyses_created_at_idx ON skin_analyses(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own records
CREATE POLICY "Users can read their own analyses"
  ON skin_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only service role can insert
CREATE POLICY "Service role can insert analyses"
  ON skin_analyses
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can only delete their own records
CREATE POLICY "Users can delete their own analyses"
  ON skin_analyses
  FOR DELETE
  USING (auth.uid() = user_id);
