-- Phase 9: patient–doctor messaging (run after supabase_schema.sql)

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(user_id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(user_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role user_role NOT NULL,
  body TEXT NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_sender_role_check CHECK (sender_role IN ('patient', 'doctor'))
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages (patient_id, doctor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_doctor ON messages (doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages (patient_id, created_at DESC);
