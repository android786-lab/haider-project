/** CareLink-style slot key: day_month_year e.g. 29_5_2026 */
export function slotKeyToIso(slotKey) {
  const [day, month, year] = slotKey.split('_').map((n) => parseInt(n, 10))
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isoToSlotKey(isoDate) {
  if (!isoDate) return ''
  const str = String(isoDate).slice(0, 10)
  const [year, month, day] = str.split('-').map((n) => parseInt(n, 10))
  return `${day}_${month}_${year}`
}

/** "10:30 AM" / "10:30" -> "10:30:00" for PostgreSQL TIME */
export function normalizeTimeToDb(timeStr) {
  const trimmed = String(timeStr).trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return trimmed

  let hours = parseInt(match[1], 10)
  const minutes = match[2]
  const meridiem = match[3]?.toUpperCase()

  if (meridiem === 'PM' && hours < 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0

  return `${String(hours).padStart(2, '0')}:${minutes}:00`
}

/** DB TIME -> display like CareLink */
export function formatTimeFromDb(timeVal) {
  if (!timeVal) return ''
  const str = String(timeVal).slice(0, 8)
  const [h, m] = str.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
