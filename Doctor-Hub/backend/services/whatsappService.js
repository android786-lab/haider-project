import { requireSupabase } from '../config/supabaseClient.js'
import { getAppointmentById } from './appointmentService.js'
import { buildMessage, ALLOWED_TEMPLATES } from '../data/notificationTemplates.js'

export function formatPhoneE164(phone) {
  if (!phone) return null
  let digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `92${digits.slice(1)}`
  if (digits.length === 10) digits = `92${digits}`
  if (!digits.startsWith('92') && digits.length > 10) {
    return `+${digits}`
  }
  return `+${digits}`
}

async function logNotification(row) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('whatsapp_notifications')
    .insert(row)
    .select()
    .single()
  if (error) throw error
  return data
}

async function sendViaTwilio({ toE164, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    return { mode: 'demo', sid: null }
  }

  const to = toE164.startsWith('whatsapp:') ? toE164 : `whatsapp:${toE164}`
  const fromAddr = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromAddr,
        To: to,
        Body: body,
      }),
    }
  )

  const json = await response.json()
  if (!response.ok) {
    throw new Error(json.message || 'Twilio send failed')
  }

  return { mode: 'twilio', sid: json.sid }
}

export async function sendWhatsAppNotification({
  phone,
  message,
  userId,
  appointmentId,
  template,
}) {
  const e164 = formatPhoneE164(phone)
  if (!e164) throw new Error('Valid phone number is required')

  const body = message?.trim()
  if (!body) throw new Error('Message cannot be empty')

  let status = 'pending'
  let providerSid = null
  let errorMessage = null

  try {
    const result = await sendViaTwilio({ toE164: e164, body })
    if (result.mode === 'demo') {
      status = 'demo'
      console.info(`[WhatsApp demo] To ${e164}: ${body}`)
    } else {
      status = 'sent'
      providerSid = result.sid
    }
  } catch (err) {
    status = 'failed'
    errorMessage = err.message
    console.error('WhatsApp send failed:', err.message)
  }

  const row = await logNotification({
    recipient_phone: e164,
    user_id: userId || null,
    appointment_id: appointmentId || null,
    template: template || 'custom',
    message_body: body,
    status,
    provider: status === 'demo' ? 'demo' : 'twilio',
    provider_sid: providerSid,
    error_message: errorMessage,
  })

  return {
    id: row.id,
    status,
    recipient_phone: e164,
    message: body,
    demo_mode: status === 'demo',
    error: errorMessage,
  }
}

export async function notifyForAppointment({ appointmentId, template, extra = {} }) {
  const appt = await getAppointmentById(appointmentId)
  const supabase = requireSupabase()

  const { data: patientUser } = await supabase
    .from('users')
    .select('id, name, phone')
    .eq('id', appt.patient_id)
    .single()

  if (!patientUser?.phone) {
    return { skipped: true, reason: 'Patient has no phone on file' }
  }

  const ctx = {
    patientName: patientUser.name || appt.user_data?.name || 'Patient',
    doctorName: appt.doc_data?.name || appt.doctor_snapshot?.name || 'Doctor',
    slotDate: appt.slot_date,
    slotTime: appt.slot_time,
    amount: appt.amount,
    reason: extra.reason,
    customMessage: extra.customMessage,
  }

  const message = buildMessage(template, ctx)

  return sendWhatsAppNotification({
    phone: patientUser.phone,
    message,
    userId: patientUser.id,
    appointmentId,
    template,
  })
}

export function triggerAppointmentNotification({ appointmentId, template, extra }) {
  notifyForAppointment({ appointmentId, template, extra }).catch((err) => {
    console.warn(`WhatsApp [${template}] skipped:`, err.message)
  })
}

export async function sendManualNotification({
  phone,
  message,
  appointmentId,
  template,
  userId,
}) {
  if (appointmentId && template && template !== 'custom') {
    if (!ALLOWED_TEMPLATES.includes(template)) {
      throw new Error(`Unknown template. Allowed: ${ALLOWED_TEMPLATES.join(', ')}`)
    }
    return notifyForAppointment({
      appointmentId,
      template,
      extra: { customMessage: message, reason: message },
    })
  }

  return sendWhatsAppNotification({
    phone,
    message,
    userId,
    appointmentId,
    template: template || 'custom',
  })
}

export async function listNotifications({ appointmentId, limit = 50 }) {
  const supabase = requireSupabase()
  let query = supabase
    .from('whatsapp_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (appointmentId) query = query.eq('appointment_id', appointmentId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}
