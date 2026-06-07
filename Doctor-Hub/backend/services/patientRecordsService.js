import { requireSupabase } from '../config/supabaseClient.js'

async function loadDoctorMeta(doctorIds) {
  const uniqueIds = [...new Set((doctorIds || []).filter(Boolean))]
  const meta = {}

  if (!uniqueIds.length) return meta

  const supabase = requireSupabase()
  const [{ data: users }, { data: profiles }] = await Promise.all([
    supabase.from('users').select('id, name').in('id', uniqueIds),
    supabase.from('doctors').select('user_id, speciality, degree').in('user_id', uniqueIds),
  ])

  for (const user of users || []) {
    meta[user.id] = { name: user.name, speciality: '', degree: '' }
  }
  for (const profile of profiles || []) {
    meta[profile.user_id] = {
      ...meta[profile.user_id],
      speciality: profile.speciality || 'General Physician',
      degree: profile.degree || '',
    }
  }

  return meta
}

function doctorLabel(doctorId, meta) {
  if (!doctorId) return { doctorName: 'Self-reported', specialization: '' }
  const doc = meta[doctorId] || {}
  return {
    doctorName: doc.name || 'Doctor',
    specialization: doc.speciality || 'General Physician',
    degree: doc.degree || '',
  }
}

export async function enrichHistoryRows(rows) {
  const meta = await loadDoctorMeta((rows || []).map((r) => r.doctor_id))
  return (rows || []).map((row) => {
    const doctor = doctorLabel(row.doctor_id, meta)
    return {
      ...row,
      ...doctor,
      visitDate: row.created_at,
      diagnosis: row.title || '',
      notes: row.details || '',
      symptoms: row.record_type === 'patient_report' ? row.details || '' : '',
    }
  })
}

export async function enrichPrescriptionRows(rows) {
  const meta = await loadDoctorMeta((rows || []).map((r) => r.doctor_id))
  return (rows || []).map((row) => {
    const doctor = doctorLabel(row.doctor_id, meta)
    const medicines = (row.medicines || []).map((med) => ({
      name: med.name || med.medicine || 'Medicine',
      dosage: med.dosage || med.dose || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      instructions: med.instructions || '',
    }))

    return {
      ...row,
      ...doctor,
      visitDate: row.created_at,
      medicines,
      instructions: row.notes || '',
    }
  })
}
