import { getAppointmentById } from './appointmentService.js'
import { requireSupabase } from '../config/supabaseClient.js'

const JITSI_BASE = (process.env.JITSI_DOMAIN || 'meet.jit.si').replace(/^https?:\/\//, '')

function canAccessVideo(appt, userId, role) {
  if (role === 'patient' && appt.patient_id === userId) return true
  if (role === 'doctor' && appt.doctor_id === userId) return true
  return false
}

function buildRoomName(appointmentId) {
  const slug = appointmentId.replace(/-/g, '').slice(0, 24)
  return `DoctorHub${slug}`
}

function buildJitsiUrl(roomName, displayName) {
  const base = `https://${JITSI_BASE}/${roomName}`
  if (!displayName) return base
  const hash = `userInfo.displayName=${encodeURIComponent(displayName)}`
  return `${base}#${hash}`
}

function estimateExpiry(appt) {
  const iso = appt.slot_date_iso || appt.slot_date
  const dateStr = typeof iso === 'string' && iso.includes('-') ? iso : null
  if (!dateStr) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
  const d = new Date(dateStr)
  if (appt.slot_time_db) {
    const [h, m] = String(appt.slot_time_db).split(':')
    d.setHours(Number(h) || 10, Number(m) || 0, 0, 0)
  }
  d.setHours(d.getHours() + 3)
  return d.toISOString()
}

async function createDailyRoom(roomName) {
  const apiKey = process.env.VIDEO_API_KEY
  if (!apiKey) return null

  const domain = process.env.DAILY_DOMAIN
  if (!domain) return null

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name: roomName.toLowerCase(),
      properties: {
        exp: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Daily.co error: ${text.slice(0, 120)}`)
  }

  const room = await response.json()
  return {
    provider: 'daily',
    join_url: room.url,
    room_name: room.name,
  }
}

export async function getVideoRoom({ appointmentId, userId, role, displayName }) {
  const appt = await getAppointmentById(appointmentId)

  if (!canAccessVideo(appt, userId, role)) {
    throw new Error('Forbidden')
  }

  if (!['confirmed'].includes(appt.status)) {
    throw new Error(
      'Video consultation is available once your appointment is confirmed (after payment verification)'
    )
  }

  const supabase = requireSupabase()
  const { data: existing } = await supabase
    .from('video_consultations')
    .select('*')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) {
    if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
      throw new Error('This video room has expired')
    }
    const joinUrl =
      existing.provider === 'jitsi'
        ? buildJitsiUrl(existing.room_name, displayName)
        : existing.join_url
    return {
      appointment_id: appointmentId,
      room_name: existing.room_name,
      provider: existing.provider,
      join_url: joinUrl,
      embed_url: existing.join_url,
      expires_at: existing.expires_at,
      status: appt.status,
      doctor_name: appt.doc_data?.name || appt.doctor_snapshot?.name,
      patient_name: appt.user_data?.name || appt.patient_snapshot?.name,
      slot_date: appt.slot_date,
      slot_time: appt.slot_time,
    }
  }

  return null
}

export async function createVideoRoom({ appointmentId, userId, role, displayName }) {
  const existing = await getVideoRoom({ appointmentId, userId, role, displayName })
  if (existing) return existing

  const appt = await getAppointmentById(appointmentId)
  const roomName = buildRoomName(appointmentId)

  let provider = 'jitsi'
  let joinUrl = buildJitsiUrl(roomName, displayName)

  try {
    const daily = await createDailyRoom(roomName)
    if (daily) {
      provider = daily.provider
      joinUrl = daily.join_url
    }
  } catch (err) {
    console.warn('Daily.co unavailable, using Jitsi:', err.message)
  }

  const expiresAt = estimateExpiry(appt)
  const supabase = requireSupabase()

  const { error } = await supabase.from('video_consultations').insert({
    appointment_id: appointmentId,
    room_name: roomName,
    provider,
    join_url: joinUrl,
    created_by: userId,
    expires_at: expiresAt,
  })

  if (error) {
    if (error.code === '23505') {
      return getVideoRoom({ appointmentId, userId, role, displayName })
    }
    throw error
  }

  return {
    appointment_id: appointmentId,
    room_name: roomName,
    provider,
    join_url: provider === 'jitsi' ? buildJitsiUrl(roomName, displayName) : joinUrl,
    embed_url: joinUrl,
    expires_at: expiresAt,
    status: appt.status,
    doctor_name: appt.doc_data?.name || appt.doctor_snapshot?.name,
    patient_name: appt.user_data?.name || appt.patient_snapshot?.name,
    slot_date: appt.slot_date,
    slot_time: appt.slot_time,
  }
}
