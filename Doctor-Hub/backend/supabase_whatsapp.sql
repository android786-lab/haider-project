-- Phase 14: WhatsApp notification log (run after supabase_schema.sql)

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_phone TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  template TEXT,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'twilio',
  provider_sid TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_appt ON whatsapp_notifications (appointment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_created ON whatsapp_notifications (created_at DESC);
