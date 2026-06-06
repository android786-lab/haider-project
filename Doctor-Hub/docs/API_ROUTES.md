# Doctor Hub — API route map

Base URL: `/api` (e.g. `http://localhost:4000/api`)

## Documented minimum (spec)

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| POST | `/auth/register` | Register user (patient public; other roles via admin) | 2 |
| POST | `/auth/login` | Login, returns JWT | 2 |
| GET | `/doctors` | List/search doctors (`disease`, `treatment_type`, etc.) | 3 |
| POST | `/appointments` | Create booking (step 3) | 4 |
| POST | `/payments` | Upload payment screenshot (step 4) | 5 |
| GET | `/history` | Medical history (scoped by role) | 6 |

## Auth (supporting)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| POST | `/auth/forgot-password` | Public | 2 |
| POST | `/auth/reset-password` | Public (token) | 2 |
| GET | `/auth/me` | Authenticated | 2 |

## Users & profiles

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/users/me` | Authenticated | 2 |
| PATCH | `/users/me` | Authenticated | 2 |
| GET | `/patients/me` | patient | 2 |
| PATCH | `/patients/me` | patient | 2 |

## Doctors & clinics

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/doctors/:id` | Public / auth | 3 |
| POST | `/doctors` | admin, super_admin | 3 |
| PATCH | `/doctors/:id` | doctor (own), admin | 3 |
| GET | `/clinics` | Public / auth | 3 |
| POST | `/clinics` | doctor, admin | 3 |
| PATCH | `/clinics/:id` | doctor (own), admin | 3 |
| GET | `/doctors/:id/schedules` | Public | 3 |

## Appointments

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/appointments` | patient, doctor, assistant, admin | 4 |
| GET | `/appointments/:id` | Involved parties | 4 |
| PATCH | `/appointments/:id/status` | assistant (verify flow), doctor | 4 |

## Payments (assistant)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/payments/pending` | assistant, admin | 5 |
| POST | `/payments/:id/verify` | assistant | 5 |
| POST | `/payments/:id/reject` | assistant | 5 |

## Dashboard (role-scoped)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/dashboard` | patient, doctor, assistant, admin, super_admin | 7 |

## Medical history & prescriptions

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/history` | patient (own), doctor (assigned patients) | 6 |
| POST | `/history` | patient (reports), doctor (visit notes) | 6 |
| GET | `/prescriptions` | patient, doctor | 6 |
| POST | `/prescriptions` | doctor (append only) | 6 |
| GET | `/prescriptions/:id/pdf` | patient, doctor, admin | 15 |

## Assistants

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/assistants` | admin, super_admin, doctor (`?doctor_id=` filter for admin) | 8 |
| POST | `/assistants` | admin, super_admin | 8 |
| PATCH | `/assistants/:id` | admin, super_admin (`:id` = assistant `user_id`) | 8 |

## Communication

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/messages` | patient, doctor — thread list, or `?patient_id=&doctor_id=` for messages | 9 |
| POST | `/messages` | patient, doctor — body + `doctor_id` (patient) or `patient_id` (doctor) | 9 |

## AI (Phase 12)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| POST | `/ai/predict` | Public — symptoms text; optional `age`, `duration_days` | 12 |

## Video consultations (Phase 13)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/consultations/:appointmentId/video-room` | patient, doctor | 13 |
| POST | `/consultations/:appointmentId/video-room` | patient, doctor (appointment must be `confirmed`) | 13 |

## WhatsApp notifications (Phase 14)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/notifications/whatsapp` | assistant, admin, super_admin — delivery log | 14 |
| POST | `/notifications/whatsapp` | assistant, admin, super_admin — manual or template by `appointment_id` | 14 |

Auto-sent on: appointment booked, payment submitted, payment confirmed, payment rejected.

## E-prescription PDF (Phase 15)

| Method | Path | Roles | Phase |
|--------|------|-------|-------|
| GET | `/prescriptions/:id/pdf` | patient (own), doctor (assigned patients), admin | 15 |

Returns `application/pdf` download with doctor, patient, medicines, and immutable-record notice.

## Future enhancements

| Method | Path | Phase |
|--------|------|-------|
| — | — | — |

## Legacy (CareLink — remove during refactor)

| Prefix | Status |
|--------|--------|
| `/api/user/*` | Deprecated → `/api/auth`, `/api/patients` |
| `/api/doctor/*` | Deprecated → `/api/doctors`, `/api/appointments` |
| `/api/admin/*` | Deprecated → RBAC admin routes |

## Response convention

```json
{ "success": true, "data": {} }
{ "success": false, "message": "Human-readable error" }
```

Authenticated requests: `Authorization: Bearer <jwt>`.
