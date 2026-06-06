import { v2 as cloudinary } from 'cloudinary'
import { requireSupabase } from '../config/supabaseClient.js'
import { getAppointmentById } from './appointmentService.js'

function mapPaymentRow(row, appointment) {
  return {
    id: row.id,
    appointment_id: row.appointment_id,
    patient_id: row.patient_id,
    screenshot_url: row.screenshot_url,
    status: row.status,
    verified_by: row.verified_by,
    verified_at: row.verified_at,
    rejection_reason: row.rejection_reason,
    created_at: row.created_at,
    appointment: appointment || null,
  }
}

async function getAssistantScope(userId) {
  const supabase = requireSupabase()
  const { data } = await supabase
    .from('assistants')
    .select('doctor_id, clinic_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

function appointmentInScope(appt, scope, role) {
  if (role === 'admin' || role === 'super_admin') return true
  if (!scope) return false
  if (scope.doctor_id && appt.doctor_id === scope.doctor_id) return true
  if (scope.clinic_id && appt.clinic_id === scope.clinic_id) return true
  return false
}

export async function submitPayment({ appointmentId, patientId, screenshotUrl }) {
  const appt = await getAppointmentById(appointmentId)

  if (appt.patient_id !== patientId) {
    throw new Error('Unauthorized')
  }

  if (!['payment_pending', 'rejected'].includes(appt.status)) {
    throw new Error('Payment cannot be submitted for this appointment status')
  }

  const supabase = requireSupabase()

  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('payments')
      .update({
        screenshot_url: screenshotUrl,
        status: 'submitted',
        rejection_reason: null,
        verified_by: null,
        verified_at: null,
      })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('payments').insert({
      appointment_id: appointmentId,
      patient_id: patientId,
      screenshot_url: screenshotUrl,
      status: 'submitted',
    })
    if (error) throw error
  }

  const { error: apptErr } = await supabase
    .from('appointments')
    .update({ status: 'payment_submitted' })
    .eq('id', appointmentId)

  if (apptErr) throw apptErr

  return getPaymentByAppointmentId(appointmentId)
}

export async function getPaymentByAppointmentId(appointmentId) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const appt = await getAppointmentById(appointmentId)
  return mapPaymentRow(data, appt)
}

export async function listPendingPayments({ userId, role }) {
  const supabase = requireSupabase()
  const scope = role === 'assistant' ? await getAssistantScope(userId) : null

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  if (error) throw error

  const results = []
  for (const row of payments || []) {
    try {
      const appt = await getAppointmentById(row.appointment_id)
      if (!appointmentInScope(appt, scope, role)) continue
      results.push(mapPaymentRow(row, appt))
    } catch {
      // skip broken refs
    }
  }
  return results
}

export async function verifyPayment({ paymentId, verifierId, role }) {
  const supabase = requireSupabase()
  const scope = role === 'assistant' ? await getAssistantScope(verifierId) : null

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (error || !payment) throw new Error('Payment not found')
  if (payment.status !== 'submitted') throw new Error('Payment is not pending verification')

  const appt = await getAppointmentById(payment.appointment_id)
  if (!appointmentInScope(appt, scope, role)) throw new Error('Forbidden')
  if (appt.status !== 'payment_submitted') {
    throw new Error('Appointment is not awaiting verification')
  }

  const verifiedAt = new Date().toISOString()

  const { error: payErr } = await supabase
    .from('payments')
    .update({
      status: 'verified',
      verified_by: role === 'assistant' ? verifierId : null,
      verified_at: verifiedAt,
      rejection_reason: null,
    })
    .eq('id', paymentId)

  if (payErr) throw payErr

  // Documentation: confirmation only after assistant verification
  const { error: apptErr } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', payment.appointment_id)

  if (apptErr) throw apptErr

  return getPaymentByAppointmentId(payment.appointment_id)
}

export async function rejectPayment({ paymentId, verifierId, role, reason }) {
  const supabase = requireSupabase()
  const scope = role === 'assistant' ? await getAssistantScope(verifierId) : null

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (error || !payment) throw new Error('Payment not found')
  if (payment.status !== 'submitted') throw new Error('Payment is not pending verification')

  const appt = await getAppointmentById(payment.appointment_id)
  if (!appointmentInScope(appt, scope, role)) throw new Error('Forbidden')

  const { error: payErr } = await supabase
    .from('payments')
    .update({
      status: 'rejected',
      verified_by: role === 'assistant' ? verifierId : null,
      verified_at: new Date().toISOString(),
      rejection_reason: reason || 'Payment proof rejected',
    })
    .eq('id', paymentId)

  if (payErr) throw payErr

  const { error: apptErr } = await supabase
    .from('appointments')
    .update({ status: 'rejected' })
    .eq('id', payment.appointment_id)

  if (apptErr) throw apptErr

  return getPaymentByAppointmentId(payment.appointment_id)
}

export async function uploadScreenshot(filePath) {
  const imageUpload = await cloudinary.uploader.upload(filePath, { resource_type: 'image' })
  return imageUpload.secure_url
}
