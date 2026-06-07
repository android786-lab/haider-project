import bcrypt from 'bcrypt'
import validator from 'validator'
import { requireSupabase } from '../config/supabaseClient.js'

const DEFAULT_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADASURBVHgB7cExAQAAAMKg9U9tCy+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg=='

async function resolveDoctorName(doctorId) {
  if (!doctorId) return null
  const supabase = requireSupabase()
  const { data } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', doctorId)
    .maybeSingle()
  return data
}

async function resolveDoctorUserId(doctorId) {
  const normalizedId = String(doctorId || '').trim()
  if (!normalizedId) throw new Error('Doctor not found')

  const supabase = requireSupabase()

  const { data: doctor, error: doctorErr } = await supabase
    .from('doctors')
    .select('user_id')
    .eq('user_id', normalizedId)
    .maybeSingle()

  if (doctorErr) throw doctorErr
  if (doctor) return doctor.user_id

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', normalizedId)
    .maybeSingle()

  if (userErr) throw userErr
  if (!user || user.role !== 'doctor') throw new Error('Doctor not found')

  const { error: insertErr } = await supabase.from('doctors').insert({
    user_id: user.id,
    treatment: 'allopathic',
    speciality: 'General Physician',
    degree: 'MBBS',
    experience: '',
    about: '',
    fees: 0,
    diseases: [],
    available: true,
    address: { line1: '', line2: '' },
    slots_booked: {},
  })

  if (insertErr) throw insertErr
  return user.id
}

async function validateAssignment({ doctorId, clinicId }) {
  if (!doctorId && !clinicId) {
    throw new Error('Assign at least one doctor or clinic')
  }

  const supabase = requireSupabase()

  let resolvedDoctorId = null
  if (doctorId) {
    resolvedDoctorId = await resolveDoctorUserId(doctorId)
  }

  if (clinicId) {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, doctor_id')
      .eq('id', clinicId)
      .maybeSingle()
    if (!clinic) throw new Error('Clinic not found')
    if (resolvedDoctorId && clinic.doctor_id && clinic.doctor_id !== resolvedDoctorId) {
      throw new Error('Clinic does not belong to the selected doctor')
    }
    if (!resolvedDoctorId && clinic.doctor_id) {
      return { doctorId: clinic.doctor_id, clinicId }
    }
  }

  return { doctorId: resolvedDoctorId || null, clinicId: clinicId || null }
}

function mapAssistantRow(row) {
  const user = row.users || {}
  const clinic = row.clinics || null
  const doctorUser = row.doctor_user || null

  return {
    user_id: row.user_id,
    doctor_id: row.doctor_id,
    clinic_id: row.clinic_id,
    created_at: row.created_at,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    is_active: user.is_active,
    image: user.image,
    doctor_name: doctorUser?.name || null,
    doctor_email: doctorUser?.email || null,
    clinic_name: clinic?.name || null,
  }
}

export async function listAssistants({ userId, role, doctorIdQuery }) {
  const supabase = requireSupabase()

  let query = supabase
    .from('assistants')
    .select(
      `
      user_id,
      doctor_id,
      clinic_id,
      created_at,
      users!inner (
        id,
        name,
        email,
        phone,
        is_active,
        image
      ),
      clinics (
        id,
        name
      )
    `
    )
    .order('created_at', { ascending: false })

  if (role === 'doctor') {
    query = query.eq('doctor_id', userId)
  } else if (doctorIdQuery) {
    query = query.eq('doctor_id', doctorIdQuery)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = data || []
  const mapped = []

  for (const row of rows) {
    let doctor_user = null
    if (row.doctor_id) {
      doctor_user = await resolveDoctorName(row.doctor_id)
    }
    mapped.push(mapAssistantRow({ ...row, doctor_user }))
  }

  return mapped
}

export async function createAssistant({
  name,
  email,
  password,
  phone,
  doctorId,
  clinicId,
}) {
  if (!name?.trim() || !email || !password) {
    throw new Error('Name, email, and password are required')
  }
  if (!validator.isEmail(email)) {
    throw new Error('Please enter a valid email')
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const assignment = await validateAssignment({ doctorId, clinicId })
  const supabase = requireSupabase()

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) throw new Error('Email already registered')

  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({
      name: name.trim(),
      email,
      password_hash: passwordHash,
      role: 'assistant',
      image: DEFAULT_IMAGE,
      phone: phone || '',
      address: { line1: '', line2: '' },
      gender: '',
      dob: '',
    })
    .select('id')
    .single()

  if (userErr) throw userErr

  const { error: asstErr } = await supabase.from('assistants').insert({
    user_id: user.id,
    doctor_id: assignment.doctorId,
    clinic_id: assignment.clinicId,
  })

  if (asstErr) {
    await supabase.from('users').delete().eq('id', user.id)
    throw asstErr
  }

  const list = await listAssistants({ userId: null, role: 'admin' })
  return list.find((a) => a.user_id === user.id)
}

export async function updateAssistant({
  assistantUserId,
  doctorId,
  clinicId,
  name,
  phone,
  isActive,
}) {
  const supabase = requireSupabase()

  const { data: row, error } = await supabase
    .from('assistants')
    .select('user_id')
    .eq('user_id', assistantUserId)
    .maybeSingle()

  if (error) throw error
  if (!row) throw new Error('Assistant not found')

  const hasAssignment =
    doctorId !== undefined || clinicId !== undefined

  if (hasAssignment) {
    const current = await supabase
      .from('assistants')
      .select('doctor_id, clinic_id')
      .eq('user_id', assistantUserId)
      .single()

    const nextDoctorId =
      doctorId !== undefined ? doctorId || null : current.data.doctor_id
    const nextClinicId =
      clinicId !== undefined ? clinicId || null : current.data.clinic_id

    const assignment = await validateAssignment({
      doctorId: nextDoctorId,
      clinicId: nextClinicId,
    })

    const { error: asstErr } = await supabase
      .from('assistants')
      .update({
        doctor_id: assignment.doctorId,
        clinic_id: assignment.clinicId,
      })
      .eq('user_id', assistantUserId)

    if (asstErr) throw asstErr
  }

  const userPatch = {}
  if (name !== undefined) userPatch.name = name.trim()
  if (phone !== undefined) userPatch.phone = phone
  if (isActive !== undefined) userPatch.is_active = isActive

  if (Object.keys(userPatch).length > 0) {
    const { error: userErr } = await supabase
      .from('users')
      .update(userPatch)
      .eq('id', assistantUserId)
      .eq('role', 'assistant')

    if (userErr) throw userErr
  }

  const list = await listAssistants({ userId: null, role: 'admin' })
  return list.find((a) => a.user_id === assistantUserId)
}

export async function deleteAssistant(assistantUserId) {
  const supabase = requireSupabase()

  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', assistantUserId)
    .maybeSingle()

  if (fetchErr || !user) throw new Error('Assistant not found')
  if (user.role !== 'assistant') throw new Error('User is not an assistant')

  const { error } = await supabase.from('users').delete().eq('id', assistantUserId)
  if (error) throw error

  return { success: true }
}
