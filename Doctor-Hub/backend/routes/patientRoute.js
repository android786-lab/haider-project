/**
 * patientRoute.js
 * Dedicated /api/patient/* routes — all protected with JWT + patient role.
 *
 * GET /api/patient/appointments   — own appointments
 * GET /api/patient/history        — own medical history (read-only)
 * GET /api/patient/prescriptions  — own prescriptions (read-only)
 * GET /api/patient/payments       — own payment statuses
 * GET /api/patient/dashboard      — patient dashboard stats
 */
import express from 'express'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { requireSupabase } from '../config/supabaseClient.js'
import { listAppointmentsForUser } from '../services/appointmentService.js'
import { listHistory } from '../services/historyService.js'

const patientRouter = express.Router()

// All routes require patient role
patientRouter.use(authenticate)
patientRouter.use(authorizeRoles('patient'))

// GET /api/patient/appointments
patientRouter.get('/appointments', async (req, res) => {
  try {
    const { userId } = req.auth
    const data = await listAppointmentsForUser({ userId, role: 'patient' })
    return res.json({ success: true, data, appointments: data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/patient/history
patientRouter.get('/history', async (req, res) => {
  try {
    const { userId } = req.auth
    const data = await listHistory({ userId, role: 'patient' })
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/patient/prescriptions
patientRouter.get('/prescriptions', async (req, res) => {
  try {
    const supabase = requireSupabase()
    const { userId } = req.auth
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ success: true, data: data || [] })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/patient/payments — own payment records with appointment info
patientRouter.get('/payments', async (req, res) => {
  try {
    const supabase = requireSupabase()
    const { userId } = req.auth
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ success: true, data: data || [] })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/patient/dashboard
patientRouter.get('/dashboard', async (req, res) => {
  try {
    const { getDashboard } = await import('../services/dashboardService.js')
    const { userId } = req.auth
    const data = await getDashboard({ userId, role: 'patient' })
    const stats = {
      totalAppointments: data.stats.totalAppointments,
      upcomingAppointments: data.stats.upcoming,
      historyCount: data.stats.historyRecords,
      prescriptionsCount: data.stats.prescriptions,
      ...data.stats,
    }
    return res.json({ success: true, data, stats })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/patient/profile
patientRouter.get('/profile', async (req, res) => {
  try {
    const supabase = requireSupabase()
    const { userId } = req.auth
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, gender, dob, address, image')
      .eq('id', userId)
      .single()
    if (error) throw error
    return res.json({ success: true, profile: data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// PUT /api/patient/profile
patientRouter.put('/profile', async (req, res) => {
  try {
    const supabase = requireSupabase()
    const { userId } = req.auth
    const { name, phone, gender, dob, address } = req.body
    const updates = {}
    if (name !== undefined) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (gender !== undefined) updates.gender = gender
    if (dob !== undefined) updates.dob = dob
    if (address !== undefined) updates.address = address

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, email, phone, gender, dob, address, image')
      .single()
    if (error) throw error
    return res.json({ success: true, profile: data, message: 'Profile updated' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
})

export default patientRouter
