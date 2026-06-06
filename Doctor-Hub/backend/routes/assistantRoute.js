/**
 * assistantRoute.js
 * /api/assistant/* — all protected with JWT + assistant role.
 *
 * GET  /api/assistant/pending-payments      — pending payments for assistant's doctor
 * PUT  /api/assistant/payments/:id/verify   — verify payment → appointment confirmed
 * PUT  /api/assistant/payments/:id/reject   — reject payment with reason
 * GET  /api/assistant/appointments          — all appointments for assistant's doctor
 * GET  /api/assistant/bookings              — same as appointments (alias per spec)
 * GET  /api/assistant/dashboard             — assistant dashboard stats
 */
import express from 'express'
import { body, param } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { requireSupabase } from '../config/supabaseClient.js'
import {
  listPendingPayments,
  verifyPayment,
  rejectPayment,
} from '../services/paymentService.js'
import { listAppointmentsForUser } from '../services/appointmentService.js'

const assistantRouter = express.Router()

assistantRouter.use(authenticate)
// assistant, admin, super_admin can all access these routes
assistantRouter.use(authorizeRoles('assistant', 'admin', 'super_admin'))

// ── Helper: get assistant's doctor_id ──────────────────────
async function getAssistantScope(userId) {
  const supabase = requireSupabase()
  const { data } = await supabase
    .from('assistants')
    .select('doctor_id, clinic_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data || {}
}

// GET /api/assistant/pending-payments
assistantRouter.get('/pending-payments', async (req, res) => {
  try {
    const { userId, role } = req.auth
    const data = await listPendingPayments({ userId, role })
    return res.json({ success: true, data, total: data.length })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// PUT /api/assistant/payments/:id/verify
assistantRouter.put(
  '/payments/:id/verify',
  [param('id').isUUID()],
  validate,
  async (req, res) => {
    try {
      const { userId, role } = req.auth
      const data = await verifyPayment({ paymentId: req.params.id, verifierId: userId, role })
      return res.json({
        success: true,
        message: 'Payment verified — appointment confirmed',
        data,
      })
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
  }
)

// PUT /api/assistant/payments/:id/reject
assistantRouter.put(
  '/payments/:id/reject',
  [param('id').isUUID(), body('reason').optional().isString()],
  validate,
  async (req, res) => {
    try {
      const { userId, role } = req.auth
      const { reason } = req.body
      const data = await rejectPayment({
        paymentId: req.params.id,
        verifierId: userId,
        role,
        reason: reason || 'Payment proof rejected',
      })
      return res.json({
        success: true,
        message: 'Payment rejected. Patient may re-upload proof.',
        data,
      })
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
  }
)

// GET /api/assistant/appointments
assistantRouter.get('/appointments', async (req, res) => {
  try {
    const { userId, role } = req.auth
    const data = await listAppointmentsForUser({ userId, role })
    return res.json({ success: true, data, appointments: data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/assistant/bookings — alias for appointments
assistantRouter.get('/bookings', async (req, res) => {
  try {
    const { userId, role } = req.auth
    const data = await listAppointmentsForUser({ userId, role })
    return res.json({ success: true, data, total: data.length })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/assistant/dashboard
assistantRouter.get('/dashboard', async (req, res) => {
  try {
    const { getDashboard } = await import('../services/dashboardService.js')
    const { userId, role } = req.auth
    const data = await getDashboard({ userId, role })
    const today = new Date().toISOString().slice(0, 10)
    const todayAppointments = (data.recentAppointments || []).filter((a) => a.slot_date === today).length
    const confirmedToday = (data.recentAppointments || []).filter(
      (a) => a.slot_date === today && ['confirmed', 'verified'].includes(a.status)
    ).length
    const stats = {
      pendingPayments: data.stats.pendingPayments,
      todayAppointments,
      confirmedToday,
      ...data.stats,
    }
    return res.json({ success: true, data, stats })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/assistant/doctor
assistantRouter.get('/doctor', async (req, res) => {
  try {
    const supabase = requireSupabase()
    const { userId } = req.auth
    const scope = await getAssistantScope(userId)
    if (!scope.doctor_id) {
      return res.status(404).json({ success: false, message: 'No linked doctor found' })
    }
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', scope.doctor_id)
      .maybeSingle()
    if (userErr) throw userErr
    const { data: doctor, error: docErr } = await supabase
      .from('doctors')
      .select('speciality, degree, fees, available')
      .eq('user_id', scope.doctor_id)
      .maybeSingle()
    if (docErr) throw docErr
    return res.json({
      success: true,
      doctor: {
        ...user,
        specialization: doctor?.speciality || '',
        degree: doctor?.degree || '',
        fees: doctor?.fees || 0,
        available: doctor?.available ?? false,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
})

export default assistantRouter
