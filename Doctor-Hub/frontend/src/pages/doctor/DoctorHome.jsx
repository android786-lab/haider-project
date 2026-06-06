import { useEffect, useState } from 'react'
import { ClipboardList, Calendar, Stethoscope, DollarSign } from 'lucide-react'
import api from '../../lib/api'
import StatCard from '../../components/shared/StatCard'
import PageHeader from '../../components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'

const DoctorHome = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/doctor/dashboard')
      .then(({ data }) => { if (data.success) setStats(data.stats) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, Dr. ${user?.name}`}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Appointments" value={stats?.totalAppointments ?? 0} icon={ClipboardList} color="primary" />
          <StatCard label="Today's Appointments" value={stats?.todayAppointments ?? 0} icon={Calendar} color="blue" />
          <StatCard label="Total Patients" value={stats?.totalPatients ?? 0} icon={Stethoscope} color="green" />
          <StatCard label="Pending Payments" value={stats?.pendingPayments ?? 0} icon={DollarSign} color="orange" />
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Use the sidebar to manage your profile, clinics, schedule, and view appointments.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export default DoctorHome
