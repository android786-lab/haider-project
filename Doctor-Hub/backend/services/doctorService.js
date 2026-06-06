import { requireSupabase } from '../config/supabaseClient.js'

function mapDoctorRow(row) {
  const user = row.users || {}
  return {
    id: row.user_id,
    user_id: row.user_id,
    name: user.name,
    email: user.email,
    image: user.image,
    treatment: row.treatment,
    diseases: row.diseases || [],
    speciality: row.speciality,
    degree: row.degree,
    experience: row.experience,
    about: row.about,
    available: row.available,
    fees: row.fees,
    slots_booked: row.slots_booked || {},
    address: row.address || {},
    clinics: row.clinics || [],
  }
}

export async function fetchDoctors({ disease, treatment_type, available, q }) {
  const supabase = requireSupabase()

  let query = supabase
    .from('doctors')
    .select(
      `
      user_id,
      treatment,
      diseases,
      speciality,
      degree,
      experience,
      about,
      available,
      fees,
      slots_booked,
      address,
      users!inner (
        id,
        name,
        email,
        image,
        role,
        is_active
      ),
      clinics (
        id,
        name,
        address,
        phone,
        schedule,
        is_active
      )
    `
    )
    .eq('users.is_active', true)

  if (treatment_type) {
    query = query.eq('treatment', treatment_type)
  }

  if (available === 'true') query = query.eq('available', true)
  if (available === 'false') query = query.eq('available', false)

  const { data, error } = await query
  if (error) throw error

  let doctors = (data || []).map(mapDoctorRow)

  if (disease) {
    const needle = disease.trim().toLowerCase()
    doctors = doctors.filter((d) =>
      (d.diseases || []).some((dis) => dis.toLowerCase().includes(needle))
    )
  }

  if (q) {
    const needle = q.trim().toLowerCase()
    doctors = doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(needle) ||
        d.speciality?.toLowerCase().includes(needle) ||
        (d.diseases || []).some((dis) => dis.toLowerCase().includes(needle))
    )
  }

  return doctors
}

export async function fetchDoctorById(doctorId) {
  const supabase = requireSupabase()

  const { data, error } = await supabase
    .from('doctors')
    .select(
      `
      user_id,
      treatment,
      diseases,
      speciality,
      degree,
      experience,
      about,
      available,
      fees,
      slots_booked,
      address,
      users!inner (
        id,
        name,
        email,
        image,
        role,
        is_active
      ),
      clinics (
        id,
        name,
        address,
        phone,
        schedule,
        is_active
      )
    `
    )
    .eq('user_id', doctorId)
    .single()

  if (error) throw error
  return mapDoctorRow(data)
}
