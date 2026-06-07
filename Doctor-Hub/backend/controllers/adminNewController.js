/**
 * adminNewController.js
 * New admin + superadmin API handlers using JWT auth (not legacy env-based).
 */
import bcrypt from 'bcrypt'
import validator from 'validator'
import { requireSupabase } from '../config/supabaseClient.js'
import { fetchDoctors } from '../services/doctorService.js'
import { listAppointmentsForUser } from '../services/appointmentService.js'
import { formatTimeFromDb } from '../utils/slotUtils.js'

const DEFAULT_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADASURBVHgB7cExAQAAAMKg9U9tCy+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg=='

function mapDoctorForAdmin(d, verifyMap = {}) {
  const verified = verifyMap[d.id] ?? d.available ?? false
  return {
    ...d,
    is_verified: verified,
    isVerified: verified,
    specialization: d.speciality || '',
    treatmentType: d.treatment || 'allopathic',
    fee: d.fees ?? 0,
  }
}

// ── Admin: Doctors ─────────────────────────────────────────

export async function listDoctorsAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const doctors = await fetchDoctors({})
    const { data: doctorUsers, error: usersErr } = await supabase
      .from('users')
      .select('id, name, email, is_active')
      .eq('role', 'doctor')
      .order('name')

    if (usersErr) throw usersErr

    const { data: docRows } = await supabase
      .from('doctors')
      .select('user_id, available')
    const verifyMap = {}
    for (const r of docRows || []) verifyMap[r.user_id] = r.available

    const profileById = new Map(doctors.map((d) => [d.id, mapDoctorForAdmin(d, verifyMap)]))

    const result = (doctorUsers || []).map((user) => {
      const profile = profileById.get(user.id)
      if (profile) return profile
      return {
        id: user.id,
        user_id: user.id,
        name: user.name,
        email: user.email,
        is_active: user.is_active,
        speciality: 'General Physician',
        specialization: 'General Physician',
        is_verified: false,
        isVerified: false,
      }
    })

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

export async function createDoctor(req, res) {
  try {
    const supabase = requireSupabase()
    const {
      name,
      email,
      password,
      phone,
      speciality,
      degree,
      experience,
      about,
      fees,
      treatment = 'allopathic',
      diseases = [],
    } = req.body

    if (!name?.trim() || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email' })
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' })

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email,
        password_hash: passwordHash,
        role: 'doctor',
        image: DEFAULT_IMAGE,
        phone: phone || '',
        address: { line1: '', line2: '' },
        gender: '',
        dob: '',
      })
      .select('id, name, email')
      .single()

    if (userErr) throw userErr

    const { error: docErr } = await supabase.from('doctors').insert({
      user_id: user.id,
      speciality: speciality || 'General Physician',
      degree: degree || 'MBBS',
      experience: experience || '',
      about: about || '',
      fees: Number(fees) || 0,
      treatment,
      diseases: Array.isArray(diseases) ? diseases : [],
      address: { line1: '', line2: '' },
      available: true,
    })

    if (docErr) {
      await supabase.from('users').delete().eq('id', user.id)
      throw docErr
    }

    return res.status(201).json({
      success: true,
      message: 'Doctor account created. Share these credentials with the doctor.',
      doctor: { id: user.id, name: user.name, email: user.email },
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function updateDoctor(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params
    const {
      name,
      email,
      password,
      phone,
      speciality,
      degree,
      experience,
      about,
      fees,
      treatment,
      diseases,
      is_active,
    } = req.body

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !user) return res.status(404).json({ success: false, message: 'Doctor not found' })
    if (user.role !== 'doctor') return res.status(400).json({ success: false, message: 'User is not a doctor' })

    const userPatch = {}
    if (name !== undefined) userPatch.name = name.trim()
    if (email !== undefined) userPatch.email = email
    if (phone !== undefined) userPatch.phone = phone
    if (is_active !== undefined) userPatch.is_active = is_active
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
      }
      const salt = await bcrypt.genSalt(10)
      userPatch.password_hash = await bcrypt.hash(password, salt)
    }

    if (Object.keys(userPatch).length > 0) {
      const { error: userErr } = await supabase.from('users').update(userPatch).eq('id', id)
      if (userErr) throw userErr
    }

    const docPatch = {}
    if (speciality !== undefined) docPatch.speciality = speciality
    if (degree !== undefined) docPatch.degree = degree
    if (experience !== undefined) docPatch.experience = experience
    if (about !== undefined) docPatch.about = about
    if (fees !== undefined) docPatch.fees = Number(fees)
    if (treatment !== undefined) docPatch.treatment = treatment
    if (diseases !== undefined) docPatch.diseases = diseases

    if (Object.keys(docPatch).length > 0) {
      const { error: docErr } = await supabase.from('doctors').update(docPatch).eq('user_id', id)
      if (docErr) throw docErr
    }

    return res.json({ success: true, message: 'Doctor updated' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function deleteDoctor(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !user) return res.status(404).json({ success: false, message: 'Doctor not found' })
    if (user.role !== 'doctor') return res.status(400).json({ success: false, message: 'User is not a doctor' })

    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error

    return res.json({ success: true, message: 'Doctor deleted' })
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
    const patients = (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      gender: p.gender,
      joinedAt: p.created_at,
      created_at: p.created_at,
    }))
    return res.json({ success: true, data: patients, patients })
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

function formatAppointmentDate(slotDate) {
  if (!slotDate) return '—'
  const parsed = new Date(slotDate)
  if (Number.isNaN(parsed.getTime())) return String(slotDate)
  return parsed.toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function mapPaymentForAdmin(payment, appointment) {
  const patient = appointment?.patient_snapshot || {}
  const doctor = appointment?.doctor_snapshot || {}

  return {
    id: payment.id,
    appointment_id: payment.appointment_id,
    patient_id: payment.patient_id,
    patientName: patient.name || '—',
    patientEmail: patient.email || '',
    doctorName: doctor.name || '—',
    doctorSpeciality: doctor.speciality || '',
    appointmentDate: formatAppointmentDate(appointment?.slot_date),
    timeSlot: appointment?.slot_time ? formatTimeFromDb(appointment.slot_time) : '—',
    amount: appointment?.amount ?? 0,
    status: payment.status,
    screenshot_url: payment.screenshot_url,
    screenshotUrl: payment.screenshot_url,
    created_at: payment.created_at,
    submittedAt: payment.created_at,
    verified_by: payment.verified_by,
    verified_at: payment.verified_at,
    rejection_reason: payment.rejection_reason,
  }
}

export async function listPaymentsAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { status } = req.query

    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data: payments, error } = await query
    if (error) throw error

    const appointmentIds = [...new Set((payments || []).map((p) => p.appointment_id).filter(Boolean))]
    const appointmentMap = {}

    if (appointmentIds.length) {
      const { data: appointments, error: apptErr } = await supabase
        .from('appointments')
        .select('id, amount, slot_date, slot_time, patient_snapshot, doctor_snapshot')
        .in('id', appointmentIds)

      if (apptErr) throw apptErr
      for (const appt of appointments || []) {
        appointmentMap[appt.id] = appt
      }
    }

    const mapped = (payments || []).map((payment) =>
      mapPaymentForAdmin(payment, appointmentMap[payment.appointment_id])
    )

    return res.json({ success: true, data: mapped, payments: mapped })
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

    const todayIso = new Date().toISOString().slice(0, 10)
    const todayAppointments = (recentAppointments || []).filter((a) => {
      const slotDate = typeof a.slot_date === 'string' ? a.slot_date.split('T')[0] : ''
      return slotDate === todayIso
    }).length
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
      .select('id, name, email, role, is_active, approval_status, created_at')
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true)
      .neq('approval_status', 'pending')
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
