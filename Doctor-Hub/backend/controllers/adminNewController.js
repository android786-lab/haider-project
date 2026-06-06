/**
 * adminNewController.js
 * New admin + superadmin API handlers using JWT auth (not legacy env-based).
 */
import { requireSupabase } from '../config/supabaseClient.js'
import { fetchDoctors } from '../services/doctorService.js'
import { listAppointmentsForUser } from '../services/appointmentService.js'

// ── Admin: Doctors ─────────────────────────────────────────

export async function listDoctorsAdmin(req, res) {
  try {
    const doctors = await fetchDoctors({})
    // Attach is_verified from doctors table
    const supabase = requireSupabase()
    const { data: docRows } = await supabase
      .from('doctors')
      .select('user_id, available')
    const verifyMap = {}
    for (const r of docRows || []) verifyMap[r.user_id] = r.available

    const result = doctors.map((d) => ({
      ...d,
      is_verified: verifyMap[d.id] !== undefined ? verifyMap[d.id] : true,
    }))
    return res.json({ success: true, data: result, doctors: result })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function verifyDoctor(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params
    const { error } = await supabase
      .from('doctors')
      .update({ available: true })
      .eq('user_id', id)
    if (error) throw error
    return res.json({ success: true, message: 'Doctor verified' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function unverifyDoctor(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params
    const { error } = await supabase
      .from('doctors')
      .update({ available: false })
      .eq('user_id', id)
    if (error) throw error
    return res.json({ success: true, message: 'Doctor unverified' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

// ── Admin: Patients ────────────────────────────────────────

export async function listPatients(req, res) {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, gender, dob, image, is_active, created_at')
      .eq('role', 'patient')
      .order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ success: true, data: data || [] })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Admin: Appointments ────────────────────────────────────

export async function listAppointmentsAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { status, date, doctor_id, patient_id } = req.query

    let query = supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (date) query = query.eq('slot_date', date)
    if (doctor_id) query = query.eq('doctor_id', doctor_id)
    if (patient_id) query = query.eq('patient_id', patient_id)

    const { data, error } = await query
    if (error) throw error

    // Map to legacy-compatible shape
    const { isoToSlotKey, formatTimeFromDb } = await import('../utils/slotUtils.js')
    const mapped = (data || []).map((row) => ({
      ...row,
      slot_date: isoToSlotKey(row.slot_date),
      slot_time: formatTimeFromDb(row.slot_time),
      doc_data: row.doctor_snapshot || {},
      user_data: row.patient_snapshot || {},
      cancelled: row.status === 'cancelled',
      isCompleted: row.status === 'completed',
      payment: ['verified', 'confirmed', 'completed'].includes(row.status),
    }))

    return res.json({ success: true, data: mapped, appointments: mapped })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Admin: Payments ────────────────────────────────────────

export async function listPaymentsAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { status } = req.query

    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return res.json({ success: true, data: data || [] })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Admin: Analytics ───────────────────────────────────────

export async function getAnalytics(req, res) {
  try {
    const supabase = requireSupabase()

    const [
      { count: totalDoctors },
      { count: totalPatients },
      { count: totalAppointments },
      { data: payments },
      { data: recentAppointments },
    ] = await Promise.all([
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount:appointments(amount), created_at').eq('status', 'verified'),
      supabase
        .from('appointments')
        .select('slot_date, status, doctor_snapshot')
        .order('slot_date', { ascending: false })
        .limit(200),
    ])

    // Total revenue from verified payments
    const totalRevenue = (payments || []).reduce((sum, p) => {
      return sum + (Number(p.amount) || 0)
    }, 0)

    // Appointments per day — last 7 days
    const today = new Date()
    const appointmentsPerDay = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })
      const count = (recentAppointments || []).filter((a) => {
        const aDate = typeof a.slot_date === 'string' ? a.slot_date.split('T')[0] : ''
        return aDate === iso
      }).length
      appointmentsPerDay.push({ date: iso, label, count })
    }

    // Treatment type distribution
    const { data: doctorRows } = await supabase
      .from('doctors')
      .select('treatment')
    const treatmentCounts = { allopathic: 0, homeopathic: 0, herbal: 0 }
    for (const d of doctorRows || []) {
      if (treatmentCounts[d.treatment] !== undefined) treatmentCounts[d.treatment]++
    }

    // Status distribution
    const statusCounts = {}
    for (const a of recentAppointments || []) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
    }

    const today = new Date().toISOString().slice(0, 10)
    const todayAppointments = (recentAppointments || []).filter((a) => a.slot_date === today).length
    const treatmentTypes = Object.entries(treatmentCounts).map(([type, count]) => ({ type, count }))

    const analytics = {
      totalDoctors: totalDoctors || 0,
      totalPatients: totalPatients || 0,
      totalAppointments: totalAppointments || 0,
      totalRevenue,
      todayAppointments,
      appointmentsPerDay,
      treatmentTypes,
      treatmentDistribution: treatmentCounts,
      statusDistribution: statusCounts,
    }

    return res.json({ success: true, data: analytics, analytics })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// ── Super Admin: Admins management ────────────────────────

export async function listAdmins(req, res) {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false })
    if (error) throw error
    const admins = (data || []).map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role === 'super_admin' ? 'superadmin' : a.role,
      createdAt: a.created_at,
    }))
    return res.json({ success: true, data: admins, admins })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function listUsers(req, res) {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    const users = (data || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role === 'super_admin' ? 'superadmin' : u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
    }))
    return res.json({ success: true, users })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function promoteToAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { user_id, email, role: rawRole = 'admin' } = req.body
    const role = rawRole === 'superadmin' ? 'super_admin' : rawRole

    if (!['admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Use admin or super_admin.' })
    }

    let userId = user_id
    if (!userId && email) {
      const { data: byEmail, error: emailErr } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', email)
        .maybeSingle()
      if (emailErr || !byEmail) {
        return res.status(404).json({ success: false, message: 'User not found with that email' })
      }
      userId = byEmail.id
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'user_id or email is required' })
    }

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()

    if (fetchErr || !user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (error) throw error
    return res.json({ success: true, message: `User promoted to ${role === 'super_admin' ? 'super admin' : 'admin'}` })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function demoteAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot demote a super admin' })
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'User is not an admin' })
    }

    const { error } = await supabase.from('users').update({ role: 'patient' }).eq('id', id)
    if (error) throw error

    const { error: patientErr } = await supabase
      .from('patients')
      .upsert({ user_id: id }, { onConflict: 'user_id' })
    if (patientErr) throw patientErr

    return res.json({ success: true, message: 'Admin demoted to patient' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function deleteUser(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params

    // Safety: cannot delete super_admin
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.role === 'super_admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a super admin' })
    }

    // medical_history rows are immutable — DB trigger prevents deletion
    // Deleting user cascades patients/doctors/assistants but NOT medical_history (ON DELETE CASCADE not set there)
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error

    return res.json({ success: true, message: 'User deleted' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
