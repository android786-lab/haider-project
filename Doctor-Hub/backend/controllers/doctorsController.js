import { requireSupabase } from '../config/supabaseClient.js'
import { fetchDoctorById, fetchDoctors } from '../services/doctorService.js'
import { isoToSlotKey } from '../utils/slotUtils.js'

const DEFAULT_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM',
  '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM',
]

function buildDefaultSchedules(slotsBooked = {}) {
  const schedules = []

  for (let i = 1; i <= 14; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const iso = date.toISOString().slice(0, 10)
    const slotKey = isoToSlotKey(iso)
    const booked = slotsBooked[slotKey] || []
    const availableSlots = DEFAULT_SLOTS.filter((slot) => !booked.includes(slot))
    if (availableSlots.length) {
      schedules.push({ date: iso, availableSlots })
    }
  }

  return schedules
}

export async function listDoctors(req, res) {
  try {
    const { disease, treatment_type, available, q } = req.query
    const doctors = await fetchDoctors({ disease, treatment_type, available, q })
    return res.json({ success: true, data: doctors, doctors }) // doctors key for legacy UI
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function getDoctor(req, res) {
  try {
    const doctor = await fetchDoctorById(req.params.id)
    return res.json({ success: true, data: doctor, doctor })
  } catch (err) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }
}

export async function getDoctorSchedules(req, res) {
  try {
    const doctor = await fetchDoctorById(req.params.id)
    const supabase = requireSupabase()
    const today = new Date().toISOString().slice(0, 10)

    const { data: scheduleRows } = await supabase
      .from('doctor_schedules')
      .select('date, time_slots, is_available')
      .eq('doctor_id', req.params.id)
      .eq('is_available', true)
      .gte('date', today)
      .order('date', { ascending: true })

    const activeClinics = (doctor.clinics || []).filter((c) => c.is_active !== false)

    let schedules = (scheduleRows || [])
      .map((row) => ({
        date: row.date,
        availableSlots: row.time_slots || [],
      }))
      .filter((row) => row.availableSlots.length > 0)

    if (!schedules.length) {
      schedules = buildDefaultSchedules(doctor.slots_booked)
    }

    return res.json({
      success: true,
      data: {
        doctor_id: doctor.id,
        slots_booked: doctor.slots_booked,
        clinics: activeClinics,
        schedules,
        default_hours: { start: '10:00', end: '21:00', slot_minutes: 30 },
      },
    })
  } catch (err) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }
}
