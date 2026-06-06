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

function mapPrescriptionRow(row) {
  return {
    id: row.id,
    patient_id: row.patient_id,
    doctor_id: row.doctor_id,
    appointment_id: row.appointment_id,
    medicines: row.medicines || [],
    notes: row.notes,
    created_at: row.created_at,
    immutable: true,
  }
}

export async function listPrescriptions({ userId, role, patientIdQuery }) {
  const supabase = requireSupabase()

  if (role === 'patient') {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapPrescriptionRow)
  }

  if (role === 'doctor') {
    if (!patientIdQuery) {
      throw new Error('patient_id query is required for doctors')
    }
    const allowed = await doctorCanAccessPatient(userId, patientIdQuery)
    if (!allowed) throw new Error('No access to this patient prescriptions')

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientIdQuery)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(mapPrescriptionRow)
  }

  if (role === 'admin' || role === 'super_admin') {
    let query = supabase.from('prescriptions').select('*').order('created_at', { ascending: false })
    if (patientIdQuery) query = query.eq('patient_id', patientIdQuery)
    const { data, error } = await query
    if (error) throw error
    return (data || []).map(mapPrescriptionRow)
  }

  throw new Error('Forbidden')
}

export async function addPrescription({
  doctorId,
  patientId,
  appointmentId,
  medicines,
  notes,
}) {
  const supabase = requireSupabase()

  const allowed = await doctorCanAccessPatient(doctorId, patientId)
  if (!allowed) throw new Error('Cannot prescribe for this patient')

  if (!Array.isArray(medicines) || medicines.length === 0) {
    throw new Error('At least one medicine is required')
  }

  const { data, error } = await supabase
    .from('prescriptions')
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_id: appointmentId || null,
      medicines,
      notes: notes || '',
    })
    .select()
    .single()

  if (error) throw error
  return mapPrescriptionRow(data)
}

export async function getPrescriptionById({ id, userId, role }) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('prescriptions').select('*').eq('id', id).single()

  if (error || !data) throw new Error('Prescription not found')

  if (role === 'patient' && data.patient_id !== userId) {
    throw new Error('Forbidden')
  }

  if (role === 'doctor') {
    const allowed = await doctorCanAccessPatient(userId, data.patient_id)
    if (!allowed) throw new Error('Forbidden')
  }

  if (!['patient', 'doctor', 'admin', 'super_admin'].includes(role)) {
    throw new Error('Forbidden')
  }

  const [{ data: patient }, { data: doctor }] = await Promise.all([
    supabase.from('users').select('id, name, email, phone, dob, gender').eq('id', data.patient_id).single(),
    supabase.from('users').select('id, name, email, phone').eq('id', data.doctor_id).single(),
  ])

  const { data: doctorProfile } = await supabase
    .from('doctors')
    .select('speciality, degree, treatment')
    .eq('user_id', data.doctor_id)
    .maybeSingle()

  return {
    ...mapPrescriptionRow(data),
    patient: patient || { name: 'Patient' },
    doctor: doctor || { name: 'Doctor' },
    doctor_profile: doctorProfile || {},
  }
}
