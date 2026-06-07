-- Admin approval workflow + in-app notifications
-- Run AFTER supabase_schema.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';

-- Existing users are already approved
UPDATE users SET approval_status = 'approved' WHERE approval_status IS NULL OR approval_status = '';

CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_notifications_user ON platform_notifications (user_id, is_read, created_at DESC);
