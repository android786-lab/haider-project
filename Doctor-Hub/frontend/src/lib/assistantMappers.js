function derivePaymentStatus(status) {
  if (['confirmed', 'verified', 'completed'].includes(status)) return 'verified'
  if (status === 'payment_submitted') return 'payment_submitted'
  if (status === 'payment_pending') return 'payment_pending'
  if (status === 'rejected') return 'rejected'
  return status || 'not_submitted'
}

export function normalizeList(payload, ...keys) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }
  return []
}

export function mapPendingPayment(row) {
  const appt = row.appointment || {}
  const patient = appt.user_data || appt.patient_snapshot || {}

  return {
    id: row.id,
    patientName: patient.name || 'Unknown',
    patientEmail: patient.email || '',
    appointmentDate: appt.slot_date || '—',
    timeSlot: appt.slot_time || '—',
    amount: appt.amount ?? 0,
    screenshotUrl: row.screenshot_url || '',
  }
}

export function mapAssistantAppointment(row) {
  const patient = row.user_data || row.patient_snapshot || {}
  const doctor = row.doc_data || row.doctor_snapshot || {}
  const address = doctor.address
  const clinicAddress = typeof address === 'object'
    ? [address?.line1, address?.line2].filter(Boolean).join(', ')
    : (address || '—')

  return {
    id: row.id,
    patientName: patient.name || 'Unknown',
    patientEmail: patient.email || '',
    clinicName: doctor.name || '—',
    clinicAddress,
    date: row.slot_date || '—',
    timeSlot: row.slot_time || '—',
    status: row.status,
    paymentStatus: derivePaymentStatus(row.status),
    amount: row.amount,
    createdAt: row.created_at,
  }
}

export function resolveAssetUrl(url, apiBase = '') {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  return `${apiBase}${url}`
}
