import { requireSupabase } from '../config/supabaseClient.js'
import { formatTimeFromDb } from '../utils/slotUtils.js'
import { createNotification } from './notificationService.js'

const LIVE_STATUSES = ['payment_submitted', 'verified', 'confirmed']
const CHAT_STATUSES = ['payment_submitted', 'verified', 'confirmed', 'completed']
const SESSION_MINUTES = 90

function parseSlotDateTime(slotDate, slotTime) {
  if (!slotDate) return null
  const dateStr = String(slotDate).slice(0, 10)
  const timeStr = String(slotTime || '09:00:00').slice(0, 8)
  const parsed = new Date(`${dateStr}T${timeStr}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isAppointmentLive(appointment, now = new Date()) {
  if (!appointment || !LIVE_STATUSES.includes(appointment.status)) return false
  const start = parseSlotDateTime(appointment.slot_date, appointment.slot_time)
  if (!start) return false
  const end = new Date(start.getTime() + SESSION_MINUTES * 60 * 1000)
  return now >= start && now <= end
}

export function isAppointmentChatEligible(appointment) {
  return appointment && CHAT_STATUSES.includes(appointment.status)
}

async function alreadyNotifiedStart({ userId, appointmentId }) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('platform_notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'appointment_started')
    .filter('metadata->>appointment_id', 'eq', appointmentId)
    .limit(1)

  if (error) throw error
  return (data || []).length > 0
}

function mapLiveAppointment(row) {
  const patient = row.patient_snapshot || {}
  const doctor = row.doctor_snapshot || {}
  const live = isAppointmentLive(row)

  return {
    id: row.id,
    status: row.status,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    patientName: patient.name || 'Patient',
    doctorName: doctor.name || 'Doctor',
    specialization: doctor.speciality || '',
    slot_date: row.slot_date,
    slot_time: formatTimeFromDb(row.slot_time),
    amount: row.amount,
    isLive: live,
    chatEnabled: isAppointmentChatEligible(row),
  }
}

export async function notifyAppointmentStarted(appointment) {
  const patient = appointment.patient_snapshot || {}
  const doctor = appointment.doctor_snapshot || {}
  const timeLabel = formatTimeFromDb(appointment.slot_time)
  const dateLabel = String(appointment.slot_date).slice(0, 10)

  const recipients = [
    {
      userId: appointment.patient_id,
      title: 'Appointment started',
      message: `Your consultation with Dr. ${doctor.name || 'your doctor'} has started (${dateLabel} ${timeLabel}). Open Messages to chat now.`,
      chatPath: '/patient/messages',
      metadata: {
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        role: 'patient',
      },
    },
    {
      userId: appointment.doctor_id,
      title: 'Appointment started',
      message: `Your consultation with ${patient.name || 'your patient'} has started (${dateLabel} ${timeLabel}). Open Messages to chat now.`,
      chatPath: '/doctor/messages',
      metadata: {
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        role: 'doctor',
      },
    },
  ]

  for (const item of recipients) {
    const exists = await alreadyNotifiedStart({
      userId: item.userId,
      appointmentId: appointment.id,
    })
    if (exists) continue

    await createNotification({
      userId: item.userId,
      type: 'appointment_started',
      title: item.title,
      message: item.message,
      metadata: {
        ...item.metadata,
        chat_path: item.chatPath,
      },
    })
  }
}

export async function processDueAppointmentNotifications() {
  const supabase = requireSupabase()
  const now = new Date()
  const lookback = new Date(now.getTime() - SESSION_MINUTES * 60 * 1000)
  const lookahead = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .in('status', LIVE_STATUSES)
    .gte('slot_date', lookback.toISOString().slice(0, 10))
    .lte('slot_date', lookahead.toISOString().slice(0, 10))

  if (error) throw error

  let notified = 0
  for (const row of data || []) {
    if (!isAppointmentLive(row, now)) continue
    await notifyAppointmentStarted(row)
    notified += 1
  }
  return notified
}

export async function listLiveAppointmentsForUser({ userId, role }) {
  const supabase = requireSupabase()
  await processDueAppointmentNotifications()

  let query = supabase
    .from('appointments')
    .select('*')
    .in('status', CHAT_STATUSES)
    .order('slot_date', { ascending: true })

  if (role === 'patient') query = query.eq('patient_id', userId)
  else if (role === 'doctor') query = query.eq('doctor_id', userId)
  else return []

  const { data, error } = await query
  if (error) throw error

  return (data || []).map(mapLiveAppointment)
}
