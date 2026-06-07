import bcrypt from 'bcrypt'
import validator from 'validator'
import { requireSupabase } from '../config/supabaseClient.js'
import {
  createNotification,
  notifyAllSuperAdmins,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  countUnreadNotifications,
} from '../services/notificationService.js'

const DEFAULT_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADASURBVHgB7cExAQAAAMKg9U9tCy+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg=='

export async function registerAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { name, email, password, phone } = req.body

    if (!name?.trim() || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email' })
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    }

    const { data: existing } = await supabase.from('users').select('id, role, approval_status, is_active').eq('email', email).maybeSingle()

    if (existing) {
      if (existing.role === 'admin' && existing.approval_status === 'pending') {
        return res.json({
          success: true,
          pending: true,
          message: 'Your registration is already pending Super Admin approval.',
        })
      }
      return res.status(400).json({ success: false, message: 'Email already registered' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email,
        password_hash: passwordHash,
        role: 'admin',
        image: DEFAULT_IMAGE,
        phone: phone || '',
        address: { line1: '', line2: '' },
        gender: '',
        dob: '',
        is_active: false,
        approval_status: 'pending',
      })
      .select('id, name, email, role, approval_status')
      .single()

    if (error) throw error

    await notifyAllSuperAdmins({
      type: 'admin_approval_request',
      title: 'New Admin Registration',
      message: `${user.name} (${user.email}) has requested admin access. Review and approve.`,
      metadata: { applicant_id: user.id, applicant_email: user.email, applicant_name: user.name },
    })

    return res.status(201).json({
      success: true,
      pending: true,
      message: 'Your registration has been sent to the Super Admin for approval. You will be notified once approved.',
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function listPendingAdmins(req, res) {
  try {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, approval_status, is_active, created_at')
      .eq('role', 'admin')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return res.json({ success: true, data: data || [], requests: data || [] })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function approveAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, email, role, approval_status')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !user) return res.status(404).json({ success: false, message: 'Request not found' })
    if (user.role !== 'admin') return res.status(400).json({ success: false, message: 'Not an admin account' })
    if (user.approval_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request is not pending' })
    }

    const { error } = await supabase
      .from('users')
      .update({ is_active: true, approval_status: 'approved' })
      .eq('id', id)

    if (error) throw error

    await createNotification({
      userId: id,
      type: 'admin_approved',
      title: 'Admin Account Approved',
      message: 'Your admin registration has been approved by the Super Admin. You can now sign in to the Admin Portal.',
      metadata: { approved_by: req.auth.userId },
    })

    return res.json({ success: true, message: `Admin ${user.name} approved successfully` })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function rejectAdmin(req, res) {
  try {
    const supabase = requireSupabase()
    const { id } = req.params
    const { reason } = req.body

    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, name, email, role, approval_status')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr || !user) return res.status(404).json({ success: false, message: 'Request not found' })
    if (user.approval_status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request is not pending' })
    }

    await createNotification({
      userId: id,
      type: 'admin_rejected',
      title: 'Admin Registration Rejected',
      message: reason || 'Your admin registration was not approved. Contact the Super Admin for details.',
      metadata: { rejected_by: req.auth.userId },
    })

    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) throw error

    return res.json({ success: true, message: 'Admin registration rejected' })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function getMyNotifications(req, res) {
  try {
    const { userId } = req.auth
    const unreadOnly = req.query.unread === 'true'
    const data = await listNotifications({ userId, unreadOnly })
    const unreadCount = await countUnreadNotifications({ userId })
    return res.json({ success: true, data, notifications: data, unreadCount })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function readNotification(req, res) {
  try {
    const { userId } = req.auth
    await markNotificationRead({ notificationId: req.params.id, userId })
    const unreadCount = await countUnreadNotifications({ userId })
    return res.json({ success: true, unreadCount })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function readAllNotifications(req, res) {
  try {
    const { userId } = req.auth
    await markAllNotificationsRead({ userId })
    return res.json({ success: true, unreadCount: 0 })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
