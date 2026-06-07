-- Doctor Hub schema (Phase 1)
-- Run this in your Supabase SQL Editor.
--
-- Tables (9): users, patients, doctors, assistants, clinics, appointments,
--             payments, medical_history, prescriptions
--
-- Documentation rules enforced here:
-- - medical_history cannot be deleted
-- - prescriptions cannot be edited/deleted
-- (Strict DB-level immutability for medical_history + prescriptions via triggers)

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Enums
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'assistant', 'admin', 'super_admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'treatment_type') THEN
    CREATE TYPE treatment_type AS ENUM ('allopathic', 'homeopathic', 'herbal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
    CREATE TYPE appointment_status AS ENUM (
      'payment_pending',
      'payment_submitted',
      'verified',
      'confirmed',
      'rejected',
      'completed',
      'cancelled'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('submitted', 'verified', 'rejected');
  END IF;
END $$;

-- =========================
-- Shared helpers
-- =========================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operation not allowed on immutable table: %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- users (auth + RBAC)
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'patient',
  image TEXT,
  phone TEXT,
  address JSONB DEFAULT '{"line1": "", "line2": ""}',
  gender TEXT,
  dob TEXT,
  reset_token_hash TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================
-- patients (profile extension)
-- =========================
CREATE TABLE IF NOT EXISTS patients (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mrn TEXT, -- optional medical record number
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- doctors (profile extension)
-- =========================
CREATE TABLE IF NOT EXISTS doctors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  treatment treatment_type NOT NULL,
  diseases TEXT[] NOT NULL DEFAULT '{}'::text[],
  speciality TEXT,
  degree TEXT,
  experience TEXT,
  about TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  fees NUMERIC NOT NULL DEFAULT 0,
  slots_booked JSONB NOT NULL DEFAULT '{}'::jsonb, -- legacy-friendly (CareLink slot system)
  address JSONB DEFAULT '{"line1": "", "line2": ""}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_doctors_updated_at ON doctors;
CREATE TRIGGER trg_doctors_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_doctors_treatment ON doctors (treatment);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors (available);
CREATE INDEX IF NOT EXISTS idx_doctors_diseases_gin ON doctors USING GIN (diseases);

-- =========================
-- clinics
-- =========================
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(user_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{"line1": "", "line2": ""}'::jsonb,
  phone TEXT,
  schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_clinics_updated_at ON clinics;
CREATE TRIGGER trg_clinics_updated_at
BEFORE UPDATE ON clinics
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_clinics_doctor ON clinics (doctor_id);

-- =========================
-- assistants
-- =========================
CREATE TABLE IF NOT EXISTS assistants (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(user_id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistants_doctor ON assistants (doctor_id);
CREATE INDEX IF NOT EXISTS idx_assistants_clinic ON assistants (clinic_id);

-- =========================
-- appointments
-- =========================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(user_id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(user_id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'payment_pending',
  amount NUMERIC NOT NULL DEFAULT 0,
  patient_snapshot JSONB DEFAULT '{}'::jsonb,
  doctor_snapshot JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor ON appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appt_slot ON appointments (doctor_id, slot_date, slot_time);

-- =========================
-- payments (manual screenshot verification)
-- =========================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(user_id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  status payment_status NOT NULL DEFAULT 'submitted',
  verified_by UUID REFERENCES assistants(user_id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON payments (verified_by);

-- =========================
-- medical_history (immutable append-only)
-- =========================
CREATE TABLE IF NOT EXISTS medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(user_id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(user_id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  details TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_medical_history_no_update ON medical_history;
DROP TRIGGER IF EXISTS trg_medical_history_no_delete ON medical_history;
CREATE TRIGGER trg_medical_history_no_update
BEFORE UPDATE ON medical_history
FOR EACH ROW
EXECUTE FUNCTION prevent_update_delete();
CREATE TRIGGER trg_medical_history_no_delete
BEFORE DELETE ON medical_history
FOR EACH ROW
EXECUTE FUNCTION prevent_update_delete();

CREATE INDEX IF NOT EXISTS idx_history_patient ON medical_history (patient_id);
CREATE INDEX IF NOT EXISTS idx_history_doctor ON medical_history (doctor_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON medical_history (created_at DESC);

-- =========================
-- prescriptions (immutable append-only)
-- =========================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(user_id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(user_id) ON DELETE RESTRICT,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  medicines JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {name,dose,frequency,duration,instructions}
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_prescriptions_no_update ON prescriptions;
DROP TRIGGER IF EXISTS trg_prescriptions_no_delete ON prescriptions;
CREATE TRIGGER trg_prescriptions_no_update
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION prevent_update_delete();
CREATE TRIGGER trg_prescriptions_no_delete
BEFORE DELETE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION prevent_update_delete();

CREATE INDEX IF NOT EXISTS idx_rx_patient ON prescriptions (patient_id);
CREATE INDEX IF NOT EXISTS idx_rx_doctor ON prescriptions (doctor_id);
CREATE INDEX IF NOT EXISTS idx_rx_created_at ON prescriptions (created_at DESC);

-- =========================
-- messages (patient–doctor chat)
-- =========================
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
