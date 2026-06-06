import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9
  const min = i % 2 === 0 ? '00' : '30'
  return `${String(hour).padStart(2, '0')}:${min}`
})

const getDaysInMonth = (year, month) => {
  const days = []
  const total = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= total; d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

const toDateStr = (date) => date.toISOString().split('T')[0]

const DoctorSchedule = () => {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlots, setSelectedSlots] = useState([])
  const [savedSchedules, setSavedSchedules] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = useMemo(() => getDaysInMonth(year, month), [year, month])
  const startDay = new Date(year, month, 1).getDay()

  const fetchSchedule = () => {
    const from = toDateStr(new Date(year, month, 1))
    const to = toDateStr(new Date(year, month + 1, 0))
    api.get(`/api/doctor/schedule?from=${from}&to=${to}`)
      .then(({ data }) => {
        if (data.success) {
          const map = {}
          data.schedules.forEach((s) => { map[s.date] = s })
          setSavedSchedules(map)
        }
      })
      .catch(console.error)
  }

  useEffect(() => { fetchSchedule() }, [year, month])

  const selectDate = (date) => {
    const key = toDateStr(date)
    if (date < new Date(today.toDateString())) return
    setSelectedDate(key)
    setSelectedSlots(savedSchedules[key]?.timeSlots || [])
  }

  const toggleSlot = (slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot].sort()
    )
  }

  const saveSchedule = async () => {
    if (!selectedDate) return
    setSaving(true)
    setMessage('')
    try {
      const { data } = await api.post('/api/doctor/schedule', {
        date: selectedDate,
        timeSlots: selectedSlots,
        isAvailable: selectedSlots.length > 0,
      })
      if (data.success) {
        setMessage('Schedule saved.')
        fetchSchedule()
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const monthLabel = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="page-container">
      <PageHeader
        title="Schedule Management"
        description="Set your available time slots for patient bookings"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="secondary" size="sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" /> {monthLabel}
              </CardTitle>
              <Button variant="secondary" size="sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
              {days.map((date) => {
                const key = toDateStr(date)
                const isPast = date < new Date(today.toDateString())
                const hasSlots = savedSchedules[key]?.timeSlots?.length > 0
                const isSelected = selectedDate === key
                return (
                  <button key={key} onClick={() => selectDate(date)} disabled={isPast}
                    className={`aspect-square rounded-xl text-sm font-medium transition-colors ${
                      isPast ? 'text-slate-300 cursor-not-allowed'
                      : isSelected ? 'bg-primary-600 text-white'
                      : hasSlots ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                      : 'hover:bg-slate-100 text-slate-700'
                    }`}>
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? `Time Slots — ${selectedDate}` : 'Select a date'}
            </CardTitle>
            <CardDescription>Click slots to toggle availability</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {selectedDate ? (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {TIME_SLOTS.map((slot) => (
                    <button key={slot} type="button" onClick={() => toggleSlot(slot)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                        selectedSlots.includes(slot)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-slate-600 border-surface-border hover:border-primary-500'
                      }`}>
                      {slot}
                    </button>
                  ))}
                </div>

                {message && <p className="text-sm text-emerald-600 mb-3">{message}</p>}

                <Button onClick={saveSchedule} disabled={saving}>
                  {saving ? 'Saving...' : `Save ${selectedSlots.length} slot(s)`}
                </Button>
              </>
            ) : (
              <p className="text-slate-400 text-sm">Choose a future date from the calendar to set time slots.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DoctorSchedule
