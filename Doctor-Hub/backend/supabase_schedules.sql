-- Doctor Hub — Phase: Schedule Management
-- Run this in your Supabase SQL Editor AFTER supabase_schema.sql

-- =========================
-- doctor_schedules
-- =========================
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES doctors(user_id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time_slots  JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of "HH:MM" strings
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (doctor_id, date)
);

DROP TRIGGER IF EXISTS trg_schedules_updated_at ON doctor_schedules;
CREATE TRIGGER trg_schedules_updated_at
BEFORE UPDATE ON doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_schedules_doctor ON doctor_schedules (doctor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date   ON doctor_schedules (date);
