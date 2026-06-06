-- Doctor Hub demo seed (run AFTER supabase_schema.sql)
-- Demo password for staff/doctor emails below: password (bcrypt hash below)
-- For production, register via API or use bcrypt.hash('YourPassword', 10)

-- Hash below matches common test password "password"
-- Patient: register via POST /api/auth/register

INSERT INTO users (name, email, password_hash, role, image, phone) VALUES
  ('Dr. Ayesha Khan', 'ayesha.doctor@doctorhub.demo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', '', '03001234567'),
  ('Dr. Hassan Ali', 'hassan.doctor@doctorhub.demo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', '', '03007654321'),
  ('Dr. Fatima Noor', 'fatima.doctor@doctorhub.demo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', '', '03009876543'),
  ('Sara Assistant', 'assistant@doctorhub.demo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'assistant', '', '03001112233'),
  ('Admin User', 'admin@doctorhub.demo', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '', '03009998877')
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctors (user_id, treatment, diseases, speciality, degree, experience, about, available, fees, address)
SELECT u.id, 'allopathic', ARRAY['Diabetes', 'Hypertension', 'Fever'], 'General Physician', 'MBBS', '8 years', 'Allopathic care for common diseases.', true, 1500, '{"line1":"Clinic A, Lahore"}'
FROM users u WHERE u.email = 'ayesha.doctor@doctorhub.demo'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO doctors (user_id, treatment, diseases, speciality, degree, experience, about, available, fees, address)
SELECT u.id, 'homeopathic', ARRAY['Skin Allergy', 'Migraine', 'Anxiety'], 'Homeopathic Specialist', 'DHMS', '12 years', 'Homeopathic treatment plans.', true, 1200, '{"line1":"Homeo Care, Karachi"}'
FROM users u WHERE u.email = 'hassan.doctor@doctorhub.demo'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO doctors (user_id, treatment, diseases, speciality, degree, experience, about, available, fees, address)
SELECT u.id, 'herbal', ARRAY['Digestive Issues', 'Joint Pain', 'Insomnia'], 'Herbal Medicine', 'BUMS', '10 years', 'Herbal remedies and lifestyle guidance.', true, 1000, '{"line1":"Herbal Hub, Islamabad"}'
FROM users u WHERE u.email = 'fatima.doctor@doctorhub.demo'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO clinics (doctor_id, name, address, phone, schedule, is_active)
SELECT u.id, 'City Medical Center', '{"line1":"Gulberg, Lahore"}', '0421111111', '{"mon":{"start":"10:00","end":"18:00"},"tue":{"start":"10:00","end":"18:00"}}', true
FROM users u WHERE u.email = 'ayesha.doctor@doctorhub.demo';

INSERT INTO clinics (doctor_id, name, address, phone, schedule, is_active)
SELECT u.id, 'Homeo Wellness Clinic', '{"line1":"DHA, Karachi"}', '0212222222', '{"wed":{"start":"11:00","end":"19:00"},"thu":{"start":"11:00","end":"19:00"}}', true
FROM users u WHERE u.email = 'hassan.doctor@doctorhub.demo';

INSERT INTO assistants (user_id, doctor_id, clinic_id)
SELECT a.id, d.id, c.id
FROM users a
JOIN users d ON d.email = 'ayesha.doctor@doctorhub.demo'
LEFT JOIN clinics c ON c.doctor_id = d.id
WHERE a.email = 'assistant@doctorhub.demo'
ON CONFLICT (user_id) DO NOTHING;
