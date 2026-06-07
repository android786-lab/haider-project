function formatVisitDate(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString('en-PK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function normalizeHistoryList(payload) {
  const list = payload?.history || payload?.data
  return Array.isArray(list) ? list : []
}

export function normalizePrescriptionList(payload) {
  const list = payload?.prescriptions || payload?.data
  return Array.isArray(list) ? list : []
}

export function mapPatientHistoryRecord(row) {
  return {
    id: row.id,
    visitDate: formatVisitDate(row.visitDate || row.created_at),
    doctorName: row.doctorName || row.doctor_name || 'Doctor',
    specialization: row.specialization || row.speciality || 'General Physician',
    symptoms: row.symptoms || '',
    diagnosis: row.diagnosis || row.title || '',
    notes: row.notes || row.details || '',
    recordType: row.record_type || 'doctor_note',
    attachments: row.attachments || [],
    createdAt: row.created_at,
  }
}

export function mapPatientPrescription(row) {
  const medicines = (row.medicines || []).map((med) => ({
    name: med.name || med.medicine || 'Medicine',
    dosage: med.dosage || med.dose || '',
    frequency: med.frequency || '',
    duration: med.duration || '',
    instructions: med.instructions || '',
  }))

  return {
    id: row.id,
    visitDate: formatVisitDate(row.visitDate || row.created_at),
    doctorName: row.doctorName || row.doctor_name || 'Doctor',
    specialization: row.specialization || row.speciality || 'General Physician',
    diagnosis: row.diagnosis || '',
    medicines,
    instructions: row.instructions || row.notes || '',
    createdAt: row.created_at,
  }
}
