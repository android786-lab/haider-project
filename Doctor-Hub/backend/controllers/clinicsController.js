import { requireSupabase } from '../config/supabaseClient.js'

export async function listClinics(req, res) {
  try {
    const supabase = requireSupabase()
    const { doctor_id, active } = req.query

    let query = supabase
      .from('clinics')
      .select('id, doctor_id, name, address, phone, schedule, is_active, created_at')

    if (doctor_id) query = query.eq('doctor_id', doctor_id)
    if (active === 'true') query = query.eq('is_active', true)

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return res.json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function getClinic(req, res) {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(404).json({ success: false, message: 'Clinic not found' })
  }
}

export async function createClinic(req, res) {
  try {
    const supabase = requireSupabase()
    const { name, address, phone, schedule } = req.body
    const { userId, role } = req.auth

    let doctor_id = req.body.doctor_id

    if (role === 'doctor') {
      doctor_id = userId
    } else if (!['admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    if (!doctor_id || !name) {
      return res.status(400).json({ success: false, message: 'doctor_id and name are required' })
    }

    const { data, error } = await supabase
      .from('clinics')
      .insert({
        doctor_id,
        name,
        address: address || { line1: '', line2: '' },
        phone: phone || '',
        schedule: schedule || {},
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return res.status(201).json({ success: true, data })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function updateClinic(req, res) {
  try {
    const supabase = requireSupabase()
    const { userId, role } = req.auth

    const { data: clinic, error: fetchErr } = await supabase
      .from('clinics')
      .select('id, doctor_id')
      .eq('id', req.params.id)
      .single()

    if (fetchErr || !clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' })
    }

    if (role === 'doctor' && clinic.doctor_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    if (!['doctor', 'admin', 'super_admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const updates = {}
    const allowed = ['name', 'address', 'phone', 'schedule', 'is_active']
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    const { data, error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
