import { formatFeePKR } from './doctorMappers'

function derivePaymentStatus(status) {
  if (['confirmed', 'verified', 'completed'].includes(status)) return 'verified'
  if (status === 'payment_submitted') return 'payment_submitted'
  if (status === 'payment_pending') return 'payment_pending'
  if (status === 'rejected') return 'rejected'
  return status || 'not_submitted'
}

function formatSlotDate(slotDate, slotDateIso) {
  if (slotDateIso) {
    const parsed = new Date(slotDateIso)
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
      return parsed.toLocaleDateString('en-PK', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
  }

  return slotDate || '—'
}

export function normalizeAppointmentList(payload) {
  const list = payload?.appointments || payload?.data
  return Array.isArray(list) ? list : []
}

const CHAT_STATUSES = ['payment_submitted', 'verified', 'confirmed', 'completed']

export function mapPatientAppointment(row, { isLive = false } = {}) {
  const doctor = row.doc_data || row.doctor_snapshot || {}
  const amount = row.amount ?? doctor.fees ?? 0
  const address = doctor.address
  const clinicAddress = typeof address === 'object'
    ? [address?.line1, address?.line2].filter(Boolean).join(', ')
    : (address || '')

  return {
    id: row.id,
    doctorId: row.doctor_id,
    doctor_id: row.doctor_id,
    doctorName: doctor.name || 'Unknown Doctor',
    specialization: doctor.speciality || doctor.specialization || 'General Physician',
    treatmentType: doctor.treatment || 'allopathic',
    clinicName: row.clinic_id ? 'Assigned Clinic' : 'General Consultation',
    clinicAddress: clinicAddress || 'Address shared after confirmation',
    date: formatSlotDate(row.slot_date, row.slot_date_iso),
    timeSlot: row.slot_time || '—',
    status: row.status,
    paymentStatus: derivePaymentStatus(row.status),
    amount,
    feeLabel: formatFeePKR(amount),
    createdAt: row.created_at,
    image: doctor.image,
    chatEnabled: CHAT_STATUSES.includes(row.status),
    isLive,
  }
}
