import { v2 as cloudinary } from 'cloudinary'
import { requireSupabase } from '../config/supabaseClient.js'

async function doctorCanAccessPatient(doctorId, patientId) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('patient_id', patientId)
    .limit(1)

  if (error) throw error
  return (data || []).length > 0
}

function mapHistoryRow(row) {
  return {
    id: row.id,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    appointment_id: row.appointment_id,
    title: row.title,
    details: row.details,
    attachments: row.attachments || [],
    created_at: row.created_at,
    record_type: row.doctor_id ? 'doctor_note' : 'patient_report',
  }
}

export async function listHistory({ userId, role, patientIdQuery }) {
  const supabase = requireSupabase()

  if (role === 'patient') {
    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapHistoryRow)
  }

  if (role === 'doctor') {
    if (!patientIdQuery) {
      throw new Error('patient_id query is required for doctors')
    }
    const allowed = await doctorCanAccessPatient(userId, patientIdQuery)
    if (!allowed) throw new Error('No access to this patient history')

    const { data, error } = await supabase
      .from('medical_history')
      .select('*')
      .eq('patient_id', patientIdQuery)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapHistoryRow)
  }

  if (role === 'admin' || role === 'super_admin') {
    let query = supabase.from('medical_history').select('*').order('created_at', { ascending: false })
    if (patientIdQuery) query = query.eq('patient_id', patientIdQuery)
    const { data, error } = await query
    if (error) throw error
    return (data || []).map(mapHistoryRow)
  }

  throw new Error('Forbidden')
}

export async function addHistory({
  userId,
  role,
  title,
  details,
  patientId,
  doctorIdShare,
  appointmentId,
  attachmentUrls = [],
}) {
  const supabase = requireSupabase()

  if (role === 'patient') {
    const { error: patientErr } = await supabase
      .from('patients')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (patientErr) throw patientErr

    let shareDoctorId = doctorIdShare || null
    if (appointmentId) {
      const { data: appt } = await supabase
        .from('appointments')
        .select('doctor_id, patient_id')
        .eq('id', appointmentId)
        .single()
      if (!appt || appt.patient_id !== userId) {
        throw new Error('Invalid appointment for history sharing')
      }
      shareDoctorId = appt.doctor_id
    }

    const { data, error } = await supabase
      .from('medical_history')
      .insert({
        patient_id: userId,
        doctor_id: shareDoctorId,
        appointment_id: appointmentId || null,
        title,
        details: details || '',
        attachments: attachmentUrls,
      })
      .select()
      .single()

    if (error) throw error
    return mapHistoryRow(data)
  }

  if (role === 'doctor') {
    if (!patientId) throw new Error('patient_id is required')
    const allowed = await doctorCanAccessPatient(userId, patientId)
    if (!allowed) throw new Error('Cannot add records for this patient')

    const { data, error } = await supabase
      .from('medical_history')
      .insert({
        patient_id: patientId,
        doctor_id: userId,
        appointment_id: appointmentId || null,
        title,
        details: details || '',
        attachments: attachmentUrls,
      })
      .select()
      .single()

    if (error) throw error
    return mapHistoryRow(data)
  }

  throw new Error('Forbidden')
}

export async function uploadHistoryFiles(files) {
  const urls = []
  for (const file of files) {
    const upload = await cloudinary.uploader.upload(file.path, { resource_type: 'auto' })
    urls.push({ url: upload.secure_url, name: file.originalname, type: file.mimetype })
  }
  return urls
}
