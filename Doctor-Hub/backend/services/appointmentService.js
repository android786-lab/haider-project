import { requireSupabase } from '../config/supabaseClient.js'
import { fetchDoctorById } from './doctorService.js'
import {
  formatTimeFromDb,
  isoToSlotKey,
  normalizeTimeToDb,
  slotKeyToIso,
} from '../utils/slotUtils.js'

function mapAppointmentRow(row) {
  const slotKey = isoToSlotKey(row.slot_date)
  const timeDisplay = formatTimeFromDb(row.slot_time)
  const doctor = row.doctor_snapshot || {}
  const patient = row.patient_snapshot || {}

  return {
    id: row.id,
    status: row.status,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    clinic_id: row.clinic_id,
    slot_date: slotKey,
    slot_date_iso: row.slot_date,
    slot_time: timeDisplay,
    slot_time_db: row.slot_time,
    amount: row.amount,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    doc_data: doctor,
    user_data: patient,
    doctor_snapshot: doctor,
    patient_snapshot: patient,
    // Legacy UI flags
    cancelled: row.status === 'cancelled',
    payment: ['verified', 'confirmed', 'completed'].includes(row.status),
    isCompleted: row.status === 'completed',
  }
}

async function reserveSlot(doctorId, slotKey, slotTime) {
  const supabase = requireSupabase()
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('slots_booked, available')
    .eq('user_id', doctorId)
    .single()

  if (error) throw error
  if (!doctor.available) throw new Error('Doctor not available')

  const slots_booked = doctor.slots_booked || {}
  if (slots_booked[slotKey]?.includes(slotTime)) {
    throw new Error('Slot not available')
  }

  slots_booked[slotKey] = [...(slots_booked[slotKey] || []), slotTime]
  await supabase.from('doctors').update({ slots_booked }).eq('user_id', doctorId)
}

async function releaseSlot(doctorId, slotKey, slotTime) {
  const supabase = requireSupabase()
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('slots_booked')
    .eq('user_id', doctorId)
    .single()

  if (error) return

  const slots_booked = doctor.slots_booked || {}
  if (slots_booked[slotKey]) {
    slots_booked[slotKey] = slots_booked[slotKey].filter((t) => t !== slotTime)
    if (slots_booked[slotKey].length === 0) delete slots_booked[slotKey]
  }
  await supabase.from('doctors').update({ slots_booked }).eq('user_id', doctorId)
}

export async function createAppointment({
  patientId,
  doctorId,
  slotDate,
  slotTime,
  clinicId,
}) {
  const supabase = requireSupabase()

  const slotKey = slotDate.includes('_') ? slotDate : isoToSlotKey(slotDate)
  const slotIso = slotKeyToIso(slotKey)
  const timeDisplay = slotTime
  const timeDb = normalizeTimeToDb(slotTime)

  const doctor = await fetchDoctorById(doctorId)

  const { data: patientUser, error: patientErr } = await supabase
    .from('users')
    .select('id, name, email, image, phone, address, gender, dob')
    .eq('id', patientId)
    .single()

  if (patientErr) throw patientErr

  await reserveSlot(doctorId, slotKey, timeDisplay)

  const { data: appointment, error: apptErr } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      clinic_id: clinicId || null,
      slot_date: slotIso,
      slot_time: timeDb,
      status: 'payment_pending',
      amount: doctor.fees,
      patient_snapshot: patientUser,
      doctor_snapshot: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        image: doctor.image,
        speciality: doctor.speciality,
        treatment: doctor.treatment,
        fees: doctor.fees,
        address: doctor.address,
      },
    })
    .select()
    .single()

  if (apptErr) {
    await releaseSlot(doctorId, slotKey, timeDisplay)
    throw apptErr
  }

  return mapAppointmentRow(appointment)
}

export async function listAppointmentsForUser({ userId, role }) {
  const supabase = requireSupabase()
  let query = supabase.from('appointments').select('*').order('created_at', { ascending: false })

  if (role === 'patient') {
    query = query.eq('patient_id', userId)
  } else if (role === 'doctor') {
    query = query.eq('doctor_id', userId)
  } else if (role === 'assistant') {
    const { data: assistant } = await supabase
      .from('assistants')
      .select('doctor_id, clinic_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (!assistant) return []
    if (assistant.doctor_id) query = query.eq('doctor_id', assistant.doctor_id)
    else if (assistant.clinic_id) query = query.eq('clinic_id', assistant.clinic_id)
    else return []
  }
  // admin / super_admin: all appointments (no filter)

  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapAppointmentRow)
}

export async function getAppointmentById(id) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single()
  if (error) throw error
  return mapAppointmentRow(data)
}

export async function cancelAppointment({ appointmentId, userId, role }) {
  const appt = await getAppointmentById(appointmentId)

  const canCancel =
    role === 'admin' ||
    role === 'super_admin' ||
    (role === 'patient' && appt.patient_id === userId) ||
    (role === 'doctor' && appt.doctor_id === userId)

  if (!canCancel) throw new Error('Unauthorized')

  if (['completed', 'cancelled'].includes(appt.status)) {
    throw new Error('Appointment cannot be cancelled')
  }

  const supabase = requireSupabase()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (error) throw error

  await releaseSlot(appt.doctor_id, appt.slot_date, appt.slot_time)
  return getAppointmentById(appointmentId)
}

const ALLOWED_TRANSITIONS = {
  assistant: {
    payment_submitted: ['verified', 'rejected'],
    verified: ['confirmed'],
    rejected: ['payment_pending'],
  },
  doctor: {
    confirmed: ['completed'],
  },
  admin: {
    payment_pending: ['cancelled'],
    payment_submitted: ['verified', 'rejected', 'cancelled'],
    verified: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    rejected: ['payment_pending', 'cancelled'],
  },
  super_admin: {
    payment_pending: ['cancelled'],
    payment_submitted: ['verified', 'rejected', 'cancelled'],
    verified: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    rejected: ['payment_pending', 'cancelled'],
  },
}

export async function updateAppointmentStatus({ appointmentId, userId, role, status }) {
  const appt = await getAppointmentById(appointmentId)
  const allowed = ALLOWED_TRANSITIONS[role]?.[appt.status] || []

  if (!allowed.includes(status)) {
    throw new Error(`Cannot change status from ${appt.status} to ${status}`)
  }

  const supabase = requireSupabase()
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)

  if (error) throw error

  if (status === 'cancelled') {
    await releaseSlot(appt.doctor_id, appt.slot_date, appt.slot_time)
  }

  return getAppointmentById(appointmentId)
}
