import { useEffect, useState } from 'react'
import { CreditCard, Calendar, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'

const AssistantHome = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/assistant/dashboard'),
      api.get('/api/assistant/doctor'),
    ])
      .then(([statsRes, doctorRes]) => {
        if (statsRes.data.success) setStats(statsRes.data.stats)
        if (doctorRes.data.success) setDoctor(doctorRes.data.doctor)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const description = doctor
    ? `Welcome, ${user?.name} — assisting Dr. ${doctor.name} (${doctor.specialization})`
    : `Welcome, ${user?.name}`

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description={description}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)
        ) : (
          <>
            <StatCard label="Pending Payments" value={stats?.pendingPayments ?? 0} icon={CreditCard} color="orange" />
            <StatCard label="Today's Appointments" value={stats?.todayAppointments ?? 0} icon={Calendar} color="blue" />
            <StatCard label="Confirmed Today" value={stats?.confirmedToday ?? 0} icon={CheckCircle} color="green" />
          </>
        )}
      </div>
    </div>
  )
}

export default AssistantHome
