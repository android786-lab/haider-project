import express from 'express'
import { body } from 'express-validator'
import { validate } from '../middlewares/validate.js'
import authDoctor from '../middlewares/authDoctor.js'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'

import {
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  doctorList,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  changeAvailability,
} from '../controllers/doctorController.js'

import { getSchedule, upsertSchedule, deleteScheduleDate } from '../controllers/scheduleController.js'
import { getDoctorPatients } from '../controllers/patientsController.js'

const doctorRouter = express.Router()

// ─── Public ───────────────────────────────────────────────
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/list', doctorList)

// ─── Legacy routes (authDoctor — accepts dToken or Bearer) ─
doctorRouter.post('/cancel-appointment', authDoctor, appointmentCancel)
doctorRouter.get('/appointments', authDoctor, appointmentsDoctor)
doctorRouter.post('/change-availability', authDoctor, changeAvailability)
doctorRouter.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRouter.get('/dashboard', authDoctor, doctorDashboard)
doctorRouter.get('/profile', authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)

// ─── Profile (spec: POST to create, PUT to update) ────────
doctorRouter.post(
  '/profile/setup',
  authenticate,
  authorizeRoles('doctor'),
  [
    body('speciality').optional().trim(),
    body('degree').optional().trim(),
    body('experience').optional().trim(),
    body('about').optional().trim(),
    body('fees').optional().isNumeric(),
    body('treatment').optional().isIn(['allopathic', 'homeopathic', 'herbal']),
    body('diseases').optional().isArray(),
    body('address').optional().isObject(),
    body('available').optional().isBoolean(),
  ],
  validate,
  updateDoctorProfile
)

// ─── Clinics (doctor's own clinics) ───────────────────────
// GET /api/doctor/clinics — get own clinics
doctorRouter.get('/clinics', authenticate, authorizeRoles('doctor'), async (req, res) => {
  try {
    const { requireSupabase } = await import('../config/supabaseClient.js')
    const supabase = requireSupabase()
    const doctorId = req.auth.userId

    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const clinics = data || []
    return res.json({ success: true, data: clinics, clinics })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/doctor/clinic — add clinic
doctorRouter.post(
  '/clinic',
  authenticate,
  authorizeRoles('doctor'),
  [
    body('name').optional().trim().isString(),
    body('clinicName').optional().trim().isString(),
    body('address').optional(),
    body('city').optional().isString(),
    body('phone').optional().isString(),
    body('schedule').optional().isObject(),
    body('availableDays').optional().isArray(),
    body('startTime').optional().isString(),
    body('endTime').optional().isString(),
    body().custom((_, { req }) => {
      const name = (req.body.name || req.body.clinicName || '').trim()
      if (!name) throw new Error('Clinic name is required')
      return true
    }),
  ],
  validate,
  async (req, res) => {
    try {
      const { requireSupabase } = await import('../config/supabaseClient.js')
      const supabase = requireSupabase()
      const doctorId = req.auth.userId
      const {
        name,
        clinicName,
        address,
        city,
        phone,
        schedule,
        availableDays,
        startTime,
        endTime,
      } = req.body

      const clinicNameValue = (name || clinicName || '').trim()
      const addressObj = typeof address === 'object'
        ? address
        : { line1: address || '', line2: city || '' }
      const scheduleObj = schedule || {
        days: availableDays || [],
        start: startTime || '09:00',
        end: endTime || '17:00',
      }

      const { data, error } = await supabase
        .from('clinics')
        .insert({
          doctor_id: doctorId,
          name: clinicNameValue,
          address: addressObj,
          phone: phone || '',
          schedule: scheduleObj,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error
      return res.status(201).json({ success: true, data, message: 'Clinic added' })
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
  }
)

// ─── Schedule ─────────────────────────────────────────────
// GET  /api/doctor/schedule
doctorRouter.get('/schedule', authDoctor, getSchedule)
// POST /api/doctor/schedule
doctorRouter.post(
  '/schedule',
  authDoctor,
  [
    body('date').notEmpty().withMessage('date is required (YYYY-MM-DD)'),
    body('time_slots').optional().isArray(),
    body('is_available').optional().isBoolean(),
  ],
  validate,
  upsertSchedule
)
// DELETE /api/doctor/schedule/:date
doctorRouter.delete('/schedule/:date', authDoctor, deleteScheduleDate)

// ─── Patients ─────────────────────────────────────────────
// GET /api/doctor/patients
doctorRouter.get('/patients', authDoctor, getDoctorPatients)

// GET /api/doctor/appointments/:id
doctorRouter.get('/appointments/:id', authDoctor, async (req, res) => {
  try {
    const { requireSupabase } = await import('../config/supabaseClient.js')
    const { getAppointmentById } = await import('../services/appointmentService.js')
    const supabase = requireSupabase()
    const docId = req.user.id
    const row = await getAppointmentById(req.params.id)
    if (row.doctor_id !== docId) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    const patient = row.user_data || row.patient_snapshot || {}
    const { data: historyRows } = await supabase
      .from('medical_history')
      .select('*')
      .eq('appointment_id', row.id)
      .order('created_at', { ascending: false })
      .limit(1)

    const history = historyRows?.[0] || null
    let medicalHistory = null
    if (history) {
      const { data: rxRows } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('appointment_id', row.id)
        .limit(1)
      medicalHistory = {
        id: history.id,
        diagnosis: history.title,
        symptoms: '',
        notes: history.details || '',
        hasPrescription: (rxRows || []).length > 0,
      }
    }

    const appointment = {
      ...row,
      patientId: row.patient_id,
      patientName: patient.name || 'Unknown Patient',
      patientEmail: patient.email || '',
      date: row.slot_date_iso || row.slot_date,
      time: row.slot_time,
      timeSlot: row.slot_time,
      paymentStatus: ['verified', 'confirmed', 'completed'].includes(row.status) ? 'verified' : row.status,
      medicalHistory,
    }

    return res.json({ success: true, appointment, data: appointment })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

export default doctorRouter
