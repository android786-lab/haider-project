-- Phase 13: video consultations (run after supabase_schema.sql)

CREATE TABLE IF NOT EXISTS video_consultations (
  appointment_id UUID PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'jitsi',
  join_url TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_video_consultations_expires ON video_consultations (expires_at);
