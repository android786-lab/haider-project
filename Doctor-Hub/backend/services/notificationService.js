import { requireSupabase } from '../config/supabaseClient.js'

export async function createNotification({ userId, type, title, message, metadata = {} }) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('platform_notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function notifyAllSuperAdmins({ type, title, message, metadata = {} }) {
  const supabase = requireSupabase()
  const { data: superAdmins, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'super_admin')
    .eq('is_active', true)

  if (error) throw error

  const results = []
  for (const admin of superAdmins || []) {
    const row = await createNotification({
      userId: admin.id,
      type,
      title,
      message,
      metadata,
    })
    results.push(row)
  }
  return results
}

export async function listNotifications({ userId, unreadOnly = false }) {
  const supabase = requireSupabase()
  let query = supabase
    .from('platform_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (unreadOnly) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function markNotificationRead({ notificationId, userId }) {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('platform_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markAllNotificationsRead({ userId }) {
  const supabase = requireSupabase()
  const { error } = await supabase
    .from('platform_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

export async function countUnreadNotifications({ userId }) {
  const supabase = requireSupabase()
  const { count, error } = await supabase
    .from('platform_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
  return count || 0
}
