import { formatFeePKR } from './doctorMappers'

function derivePaymentStatus(status) {
  if (['confirmed', 'verified', 'completed'].includes(status)) return 'verified'
  if (status === 'payment_submitted') return 'payment_submitted'
  if (status === 'payment_pending') return 'payment_pending'
  if (status === 'rejected') return 'rejected'
  return status || 'not_submitted'
}

function formatSlotDate(slotDate, slotDateIso) {
  const iso = slotDateIso || (String(slotDate || '').length >= 10 ? String(slotDate).slice(0, 10) : null)
  if (iso) {
    const parsed = new Date(iso)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-PK', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
  }
  if (slotDate && String(slotDate).includes('_')) {
    const [day, month, year] = String(slotDate).split('_').map(Number)
    const parsed = new Date(year, month - 1, day)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }
  return slotDate || '—'
}

const CHAT_STATUSES = ['payment_submitted', 'verified', 'confirmed', 'completed']

export function normalizeDoctorAppointments(payload) {
  const list = payload?.appointments || payload?.data
  return Array.isArray(list) ? list : []
}

export function mapDoctorAppointment(row, { isLive = false } = {}) {
  const patient = row.user_data || row.patient_snapshot || {}
  const amount = row.amount ?? 0

  return {
    id: row.id,
    patient_id: row.patient_id,
    patientName: patient.name || 'Unknown Patient',
    patientEmail: patient.email || '',
    date: formatSlotDate(row.slot_date, row.slot_date_iso),
    time: row.slot_time || '—',
    timeSlot: row.slot_time || '—',
    status: row.status,
    paymentStatus: derivePaymentStatus(row.status),
    amount,
    feeLabel: formatFeePKR(amount),
    chatEnabled: CHAT_STATUSES.includes(row.status),
    isLive,
  }
}

export function normalizeDoctorPatients(payload) {
  const list = payload?.patients || payload?.data
  return Array.isArray(list) ? list : []
}

export function mapDoctorPatient(row) {
  return {
    patientId: row.patient_id || row.patientId,
    name: row.name || 'Unknown',
    email: row.email || '',
    phone: row.phone || '',
    gender: row.gender || '',
    age: row.age || null,
    bloodGroup: row.blood_group || row.bloodGroup || '',
    totalVisits: row.total_appointments || row.totalVisits || 0,
    lastVisit: formatSlotDate(row.last_visit) || row.lastVisit || '—',
    lastStatus: row.last_status || row.lastStatus || '',
  }
}

export function normalizeDoctorClinics(payload) {
  const list = payload?.clinics || payload?.data
  return Array.isArray(list) ? list : []
}

export function normalizeDoctorHistory(payload) {
  const list = payload?.history || payload?.data
  return Array.isArray(list) ? list : []
}

export function mapDoctorHistoryRecord(row) {
  return {
    id: row.id,
    visitDate: row.visitDate || row.created_at,
    symptoms: row.symptoms || '',
    diagnosis: row.diagnosis || row.title || '',
    notes: row.notes || row.details || '',
    prescriptions: row.prescriptions || [],
    recordType: row.record_type || 'doctor_note',
    createdAt: row.created_at,
  }
}

export function mapDoctorClinic(row) {
  const address = row.address || {}
  const schedule = row.schedule || {}

  return {
    id: row.id,
    clinicName: row.name || row.clinicName || 'Clinic',
    address: typeof address === 'object' ? (address.line1 || '') : String(address || ''),
    city: typeof address === 'object' ? (address.line2 || '') : (row.city || ''),
    startTime: schedule.start || schedule.open || row.startTime || '09:00',
    endTime: schedule.end || schedule.close || row.endTime || '17:00',
    availableDays: schedule.days || row.availableDays || [],
    phone: row.phone || '',
  }
}
