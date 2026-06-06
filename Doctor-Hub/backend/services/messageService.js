import { requireSupabase } from '../config/supabaseClient.js'

async function hasAppointmentRelationship(patientId, doctorId) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorId)
    .limit(1)

  if (error) throw error
  return (data || []).length > 0
}

function mapMessageRow(row) {
  return {
    id: row.id,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    sender_id: row.sender_id,
    sender_role: row.sender_role,
    body: row.body,
    appointment_id: row.appointment_id,
    created_at: row.created_at,
  }
}

export async function listThreadMessages({ userId, role, patientId, doctorId }) {
  if (!patientId || !doctorId) {
    throw new Error('patient_id and doctor_id are required')
  }

  if (role === 'patient' && patientId !== userId) {
    throw new Error('Forbidden')
  }
  if (role === 'doctor' && doctorId !== userId) {
    throw new Error('Forbidden')
  }

  const allowed = await hasAppointmentRelationship(patientId, doctorId)
  if (!allowed) {
    throw new Error('You can only message doctors you have booked with')
  }

  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('patient_id', patientId)
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map(mapMessageRow)
}

export async function listThreads({ userId, role }) {
  const supabase = requireSupabase()

  let apptQuery = supabase
    .from('appointments')
    .select('patient_id, doctor_id, patient_snapshot, doctor_snapshot')
    .order('created_at', { ascending: false })

  if (role === 'patient') {
    apptQuery = apptQuery.eq('patient_id', userId)
  } else if (role === 'doctor') {
    apptQuery = apptQuery.eq('doctor_id', userId)
  } else {
    throw new Error('Forbidden')
  }

  const { data: appointments, error: apptErr } = await apptQuery
  if (apptErr) throw apptErr

  const pairMap = new Map()
  for (const appt of appointments || []) {
    const key = `${appt.patient_id}:${appt.doctor_id}`
    if (!pairMap.has(key)) {
      pairMap.set(key, {
        patient_id: appt.patient_id,
        doctor_id: appt.doctor_id,
        patient_name: appt.patient_snapshot?.name || 'Patient',
        patient_image: appt.patient_snapshot?.image,
        doctor_name: appt.doctor_snapshot?.name || 'Doctor',
        doctor_image: appt.doctor_snapshot?.image,
      })
    }
  }

  const threads = []
  for (const pair of pairMap.values()) {
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('body, created_at, sender_role')
      .eq('patient_id', pair.patient_id)
      .eq('doctor_id', pair.doctor_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    threads.push({
      ...pair,
      last_message: lastMsg?.body || null,
      last_at: lastMsg?.created_at || null,
      last_sender_role: lastMsg?.sender_role || null,
    })
  }

  threads.sort((a, b) => {
    const ta = a.last_at ? new Date(a.last_at).getTime() : 0
    const tb = b.last_at ? new Date(b.last_at).getTime() : 0
    return tb - ta
  })

  return threads
}

export async function sendMessage({
  userId,
  role,
  patientId,
  doctorId,
  body,
  appointmentId,
}) {
  const text = body?.trim()
  if (!text) throw new Error('Message cannot be empty')
  if (text.length > 4000) throw new Error('Message is too long')

  if (role === 'patient') {
    if (patientId && patientId !== userId) throw new Error('Forbidden')
    patientId = userId
    if (!doctorId) throw new Error('doctor_id is required')
  } else if (role === 'doctor') {
    if (doctorId && doctorId !== userId) throw new Error('Forbidden')
    doctorId = userId
    if (!patientId) throw new Error('patient_id is required')
  } else {
    throw new Error('Forbidden')
  }

  const allowed = await hasAppointmentRelationship(patientId, doctorId)
  if (!allowed) {
    throw new Error('No appointment relationship — messaging not allowed')
  }

  const supabase = requireSupabase()

  if (appointmentId) {
    const { data: appt } = await supabase
      .from('appointments')
      .select('patient_id, doctor_id')
      .eq('id', appointmentId)
      .maybeSingle()

    if (!appt || appt.patient_id !== patientId || appt.doctor_id !== doctorId) {
      throw new Error('Invalid appointment for this thread')
    }
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      sender_id: userId,
      sender_role: role,
      body: text,
      appointment_id: appointmentId || null,
    })
    .select()
    .single()

  if (error) throw error
  return mapMessageRow(data)
}
