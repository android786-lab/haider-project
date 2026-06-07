export function formatFeePKR(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value) || value < 0) return '—'
  if (value === 0) return 'Free'
  return `Rs. ${value.toLocaleString('en-PK')}`
}

export function formatExperience(experience) {
  if (!experience) return '—'
  const str = String(experience).trim()
  if (/year/i.test(str)) return str
  if (/^\d+$/.test(str)) return `${str} years`
  return str
}

function mapClinicForPatient(clinic) {
  const address = clinic?.address
  const line1 = typeof address === 'object' ? address?.line1 || '' : (address || '')
  const line2 = typeof address === 'object' ? address?.line2 || '' : ''
  const schedule = clinic?.schedule || {}

  return {
    id: clinic?.id || null,
    clinicName: clinic?.name || clinic?.clinicName || 'General Consultation',
    address: line1 || 'Clinic address on request',
    city: line2 || '',
    startTime: schedule.start || schedule.open || '10:00',
    endTime: schedule.end || schedule.close || '21:00',
    availableDays: schedule.days || [],
    phone: clinic?.phone || '',
  }
}

export function mapDoctorForPatient(raw, { schedules = [] } = {}) {
  if (!raw) return null

  const fee = raw.fees ?? raw.fee ?? 0
  const mappedClinics = (raw.clinics || []).map(mapClinicForPatient)
  const clinics = mappedClinics.length
    ? mappedClinics
    : [{ id: null, clinicName: 'General Consultation', address: 'Online / clinic visit', city: '', startTime: '10:00', endTime: '21:00', availableDays: [] }]

  return {
    ...raw,
    id: raw.id || raw.user_id,
    specialization: raw.speciality || raw.specialization || 'General Physician',
    treatmentType: raw.treatment || raw.treatmentType || 'allopathic',
    fee,
    fees: fee,
    feeLabel: formatFeePKR(fee),
    experience: formatExperience(raw.experience),
    bio: raw.about || raw.bio || '',
    rating: raw.rating ?? '4.8',
    degree: raw.degree || 'MBBS',
    clinics,
    schedules,
    image: raw.image,
    available: raw.available !== false,
    diseases: raw.diseases || [],
  }
}

export function normalizeDoctorList(payload) {
  const list = payload?.doctors || payload?.data
  return Array.isArray(list) ? list : []
}
