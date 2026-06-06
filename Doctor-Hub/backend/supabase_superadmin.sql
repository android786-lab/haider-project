-- ============================================================
-- Super Admin user for Doctor Hub
-- Run this in Supabase SQL Editor
-- Email:    haiderwahla199@gmail.com
-- Password: 12345678
-- ============================================================

INSERT INTO users (
  name,
  email,
  password_hash,
  role,
  phone,
  is_active
)
VALUES (
  'Super Admin',
  'haiderwahla199@gmail.com',
  '$2b$10$booCa3mByV6XHQlvfpj2Luh/90Bql1AntV8vPFNU/.xDMcfxKr7zG',
  'super_admin',
  '',
  true
)
ON CONFLICT (email) DO UPDATE
  SET role          = 'super_admin',
      password_hash = '$2b$10$booCa3mByV6XHQlvfpj2Luh/90Bql1AntV8vPFNU/.xDMcfxKr7zG',
      is_active     = true;
