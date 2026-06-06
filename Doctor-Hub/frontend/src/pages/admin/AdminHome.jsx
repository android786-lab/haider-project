import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Stethoscope, Users, Calendar, DollarSign } from 'lucide-react'
import api from '../../lib/api'
import PageLoader from '../../components/shared/PageLoader'
import PageHeader from '../../components/shared/PageHeader'
import StatCard from '../../components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'

const TEAL = '#0D9488'
const PIE_COLORS = [TEAL, '#34D399', '#FBBF24']

const AdminHome = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/analytics')
      .then(({ data }) => { if (data.success) setAnalytics(data.analytics) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader message="Loading analytics..." />

  const barData = (analytics?.appointmentsPerDay || []).map((d) => ({
    date: d.date.slice(5),
    count: d.count,
  }))

  const pieData = (analytics?.treatmentTypes || []).map((t) => ({
    name: t.type?.charAt(0).toUpperCase() + t.type?.slice(1),
    value: t.count,
  }))

  return (
    <div className="page-container">
      <PageHeader
        title="Analytics Dashboard"
        description="Platform overview and key metrics"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Doctors" value={analytics?.totalDoctors ?? 0} icon={Stethoscope} color="primary" />
        <StatCard label="Total Patients" value={analytics?.totalPatients ?? 0} icon={Users} color="blue" />
        <StatCard label="Today's Appointments" value={analytics?.todayAppointments ?? 0} icon={Calendar} color="green" />
        <StatCard label="Total Revenue" value={`$${Number(analytics?.totalRevenue ?? 0).toFixed(2)}`} icon={DollarSign} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments per Day (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treatment Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm text-center py-16">No treatment type data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminHome
