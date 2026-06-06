import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Calendar, FileText, Pill } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const PatientHome = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/patient/dashboard')
      .then(({ data }) => { if (data.success) setStats(data.stats) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Appointments', value: stats?.totalAppointments ?? 0, icon: ClipboardList, color: 'primary' },
    { label: 'Upcoming', value: stats?.upcomingAppointments ?? 0, icon: Calendar, color: 'blue' },
    { label: 'Medical Records', value: stats?.historyCount ?? 0, icon: FileText, color: 'green' },
    { label: 'Prescriptions', value: stats?.prescriptionsCount ?? 0, icon: Pill, color: 'orange' },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${user?.name}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)
          : cards.map((c) => (
            <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} color={c.color} />
          ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Need a consultation?</CardTitle>
          <CardDescription>Browse verified doctors and book an appointment.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link to="/patient/doctors">
            <Button>Find a Doctor</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default PatientHome
