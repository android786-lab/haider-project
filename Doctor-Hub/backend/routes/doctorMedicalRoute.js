/**
 * doctorMedicalRoute.js
 * /api/doctor/medical-history  — doctor adds/views patient medical history
 * /api/doctor/prescription      — doctor adds/views patient prescriptions
 *
 * Rules enforced here:
 * - NO DELETE on medical_history (not even a route exists)
 * - NO PUT/PATCH on prescriptions (not even a route exists)
 * - Appointment must belong to this doctor before adding history
 * - Appointment must be confirmed or completed before adding records
 */
import express from 'express'
import { body, param, query } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { requireSupabase } from '../config/supabaseClient.js'

const doctorMedicalRouter = express.Router()

function parseMedicalDetails(details) {
  const result = { symptoms: '', diagnosis: '', notes: '' }
  if (!details) return result
  for (const line of String(details).split('\n')) {
    if (line.startsWith('Symptoms: ')) result.symptoms = line.slice(10)
    else if (line.startsWith('Diagnosis: ')) result.diagnosis = line.slice(11)
    else if (line.startsWith('Notes: ')) result.notes = line.slice(7)
  }
  return result
}

doctorMedicalRouter.use(authenticate)
doctorMedicalRouter.use(authorizeRoles('doctor'))

// ── Middleware: verify appointment belongs to this doctor ──
async function verifyAppointmentOwnership(req, res, next) {
  const supabase = requireSupabase()
  const doctorId = req.auth.userId
  const appointmentId = req.body.appointmentId || req.body.appointment_id

  if (!appointmentId) return next() // optional field — skip check

  const { data: appt, error } = await supabase
    .from('appointments')
    .select('id, doctor_id, patient_id, status')
    .eq('id', appointmentId)
    .maybeSingle()

  if (error || !appt) {
    return res.status(404).json({ success: false, message: 'Appointment not found' })
  }

  if (appt.doctor_id !== doctorId) {
    return res.status(403).json({ success: false, message: 'This appointment does not belong to you' })
  }

  if (!['confirmed', 'completed'].includes(appt.status)) {
    return res.status(400).json({
      success: false,
      message: `Medical records can only be added for confirmed or completed appointments (current: ${appt.status})`,
    })
  }

  // Attach to req for downstream use
  req.appointment = appt
  return next()
}

// ─────────────────────────────────────────────────────────
// POST /api/doctor/medical-history
// ─────────────────────────────────────────────────────────
doctorMedicalRouter.post(
  '/medical-history',
  [
    body('patientId').isUUID().withMessage('patientId must be a valid UUID'),
    body('appointmentId').optional().isUUID(),
    body('symptoms').optional().isString(),
    body('diagnosis').optional().isString(),
    body('notes').optional().isString(),
    body('title').optional().isString(),
  ],
  validate,
  verifyAppointmentOwnership,
  async (req, res) => {
    try {
      const supabase = requireSupabase()
      const doctorId = req.auth.userId
      const { patientId, appointmentId, symptoms, diagnosis, notes, title } = req.body

      // Verify doctor has access to this patient
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .limit(1)

      if (!existing?.length) {
        return res.status(403).json({ success: false, message: 'No appointment found with this patient' })
      }

      // Build title from symptoms/diagnosis if not provided
      const recordTitle = title?.trim() ||
        (diagnosis ? `Diagnosis: ${diagnosis}` : symptoms ? `Symptoms: ${symptoms}` : 'Visit note')

      // Build details combining symptoms + diagnosis + notes
      const parts = []
      if (symptoms) parts.push(`Symptoms: ${symptoms}`)
      if (diagnosis) parts.push(`Diagnosis: ${diagnosis}`)
      if (notes) parts.push(`Notes: ${notes}`)
      const details = parts.join('\n')

      const { data, error } = await supabase
        .from('medical_history')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId || null,
          title: recordTitle,
          details,
          attachments: [],
        })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({
        success: true,
        message: 'Medical history added (permanent — cannot be edited or deleted)',
        data: {
          ...data,
          symptoms,
          diagnosis,
          notes,
          record_type: 'doctor_note',
          immutable: true,
        },
      })
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
  }
)

// ─────────────────────────────────────────────────────────
// GET /api/doctor/medical-history/:patientId
// ─────────────────────────────────────────────────────────
doctorMedicalRouter.get(
  '/medical-history/:patientId',
  [param('patientId').isUUID()],
  validate,
  async (req, res) => {
    try {
      const supabase = requireSupabase()
      const doctorId = req.auth.userId
      const { patientId } = req.params

      const { data: latestAppt, error: apptErr } = await supabase
        .from('appointments')
        .select('id, status, slot_date, slot_time, patient_snapshot')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (apptErr) throw apptErr
      if (!latestAppt) {
        return res.status(403).json({ success: false, message: 'No appointment found with this patient' })
      }

      const snap = latestAppt.patient_snapshot || {}
      const patient = {
        patient_id: patientId,
        name: snap.name || 'Unknown Patient',
        email: snap.email || '',
        phone: snap.phone || '',
        gender: snap.gender || '',
        image: snap.image || '',
      }

      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .or(`doctor_id.eq.${doctorId},doctor_id.is.null`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const { data: prescriptions } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })

      const rxByAppointment = new Map()
      for (const rx of prescriptions || []) {
        if (rx.appointment_id && !rxByAppointment.has(rx.appointment_id)) {
          rxByAppointment.set(rx.appointment_id, rx)
        }
      }

      const mapped = (data || []).map((row) => {
        const parsed = parseMedicalDetails(row.details)
        const rx = row.appointment_id ? rxByAppointment.get(row.appointment_id) : null
        return {
          ...row,
          visitDate: row.created_at,
          symptoms: parsed.symptoms,
          diagnosis: parsed.diagnosis || row.title,
          notes: parsed.notes || row.details,
          record_type: row.doctor_id ? 'doctor_note' : 'patient_report',
          immutable: true,
          prescriptions: rx
            ? [{
                id: rx.id,
                medicines: rx.medicines || [],
                instructions: rx.notes || '',
                createdAt: rx.created_at,
              }]
            : [],
        }
      })

      const allPrescriptions = (prescriptions || []).map((rx) => ({
        id: rx.id,
        appointment_id: rx.appointment_id,
        medicines: rx.medicines || [],
        instructions: rx.notes || '',
        createdAt: rx.created_at,
        immutable: true,
      }))

      const latestHistory = mapped.find((row) => row.doctor_id === doctorId) || mapped[0] || null

      return res.json({
        success: true,
        patient,
        latestAppointment: {
          id: latestAppt.id,
          status: latestAppt.status,
          slot_date: latestAppt.slot_date,
          slot_time: latestAppt.slot_time,
        },
        latestHistoryId: latestHistory?.id || null,
        data: mapped,
        history: mapped,
        prescriptions: allPrescriptions,
        allPrescriptions,
      })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
)

// ─────────────────────────────────────────────────────────
// POST /api/doctor/prescription
// NO PUT/PATCH route exists — prescriptions are immutable after creation
// ─────────────────────────────────────────────────────────
doctorMedicalRouter.post(
  '/prescription',
  [
    body('patientId').isUUID().withMessage('patientId must be a valid UUID'),
    body('appointmentId').optional().isUUID(),
    body('medicalHistoryId').optional().isUUID(),
    body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
    body('medicines.*.name').notEmpty().withMessage('Medicine name is required'),
    body('medicines.*.dosage').optional().isString(),
    body('medicines.*.frequency').optional().isString(),
    body('medicines.*.duration').optional().isString(),
    body('instructions').optional().isString(),
  ],
  validate,
  verifyAppointmentOwnership,
  async (req, res) => {
    try {
      const supabase = requireSupabase()
      const doctorId = req.auth.userId
      const { patientId, appointmentId, medicalHistoryId, medicines, instructions } = req.body

      // Verify doctor has access to this patient
      const { data: existing } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .limit(1)

      if (!existing?.length) {
        return res.status(403).json({ success: false, message: 'No appointment found with this patient' })
      }

      // Normalize medicine fields (support both dosage and dose)
      const normalizedMedicines = medicines.map((m) => ({
        name: m.name,
        dose: m.dosage || m.dose || '',
        dosage: m.dosage || m.dose || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        instructions: m.instructions || '',
      }))

      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          appointment_id: appointmentId || null,
          medicines: normalizedMedicines,
          notes: instructions || '',
        })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({
        success: true,
        message: 'Prescription saved permanently (cannot be edited or deleted)',
        data: {
          ...data,
          immutable: true,
          warning: 'This prescription cannot be modified after submission.',
        },
      })
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message })
    }
  }
)

// ─────────────────────────────────────────────────────────
// GET /api/doctor/prescriptions/:patientId
// ─────────────────────────────────────────────────────────
doctorMedicalRouter.get(
  '/prescriptions/:patientId',
  [param('patientId').isUUID()],
  validate,
  async (req, res) => {
    try {
      const supabase = requireSupabase()
      const doctorId = req.auth.userId
      const { patientId } = req.params

      const { data: appts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .limit(1)

      if (!appts?.length) {
        return res.status(403).json({ success: false, message: 'No appointment found with this patient' })
      }

      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const prescriptions = (data || []).map((r) => ({
        ...r,
        medicines: r.medicines || [],
        instructions: r.notes || '',
        createdAt: r.created_at,
        immutable: true,
      }))

      return res.json({ success: true, data: prescriptions, prescriptions })
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message })
    }
  }
)

export default doctorMedicalRouter
