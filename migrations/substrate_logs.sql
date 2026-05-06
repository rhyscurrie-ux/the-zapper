CREATE TABLE substrate_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  suit_id TEXT NOT NULL,
  turn INTEGER NOT NULL DEFAULT 0,
  input TEXT,
  barfly_response TEXT,
  milestones_hit INTEGER[] DEFAULT '{}',
  wp_node02 INTEGER DEFAULT 0,
  wp_cumulative INTEGER DEFAULT 0,
  gold_glean JSONB DEFAULT '[]',
  stage TEXT DEFAULT 'A',
  synthesis_draft TEXT
);

CREATE INDEX idx_substrate_logs_suit_id ON substrate_logs(suit_id);
