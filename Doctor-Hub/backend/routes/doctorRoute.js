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
    return res.json({ success: true, data: data || [] })
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
    body('name').trim().notEmpty().withMessage('Clinic name is required'),
    body('address').optional().isObject(),
    body('phone').optional().isString(),
    body('schedule').optional().isObject(),
  ],
  validate,
  async (req, res) => {
    try {
      const { requireSupabase } = await import('../config/supabaseClient.js')
      const supabase = requireSupabase()
      const doctorId = req.auth.userId
      const { name, address, phone, schedule } = req.body

      const { data, error } = await supabase
        .from('clinics')
        .insert({
          doctor_id: doctorId,
          name,
          address: address || { line1: '', line2: '' },
          phone: phone || '',
          schedule: schedule || {},
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
    const supabase = requireSupabase()
    const docId = req.user.id
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', req.params.id)
      .eq('doctor_id', docId)
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ success: false, message: 'Appointment not found' })
    return res.json({ success: true, appointment: data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

export default doctorRouter
