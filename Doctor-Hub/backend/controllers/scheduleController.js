/**
 * scheduleController.js
 * Manages doctor_schedules table — available dates and time slots.
 * All routes require JWT + doctor role.
 */
import { requireSupabase } from '../config/supabaseClient.js'

// GET /api/doctor/schedule — get own schedule
export async function getSchedule(req, res) {
  try {
    const supabase = requireSupabase()
    const doctorId = req.user?.id || req.auth?.userId

    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('date', { ascending: true })

    if (error) throw error
    return res.json({ success: true, data: data || [] })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/doctor/schedule — upsert a date with time slots
export async function upsertSchedule(req, res) {
  try {
    const supabase = requireSupabase()
    const doctorId = req.user?.id || req.auth?.userId
    const { date, time_slots, is_available } = req.body

    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required (YYYY-MM-DD)' })
    }

    const payload = {
      doctor_id: doctorId,
      date,
      time_slots: Array.isArray(time_slots) ? time_slots : [],
      is_available: is_available !== undefined ? Boolean(is_available) : true,
    }

    // Upsert — insert or update if (doctor_id, date) already exists
    const { data, error } = await supabase
      .from('doctor_schedules')
      .upsert(payload, { onConflict: 'doctor_id,date' })
      .select()
      .single()

    if (error) throw error
    return res.status(201).json({ success: true, data, message: 'Schedule saved' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

// DELETE /api/doctor/schedule/:date — remove a specific date
export async function deleteScheduleDate(req, res) {
  try {
    const supabase = requireSupabase()
    const doctorId = req.user?.id || req.auth?.userId
    const { date } = req.params

    const { error } = await supabase
      .from('doctor_schedules')
      .delete()
      .eq('doctor_id', doctorId)
      .eq('date', date)

    if (error) throw error
    return res.json({ success: true, message: 'Schedule date removed' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
