import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ArrowRight } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

const DoctorPatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/doctor/patients')
      .then(({ data }) => { if (data.success) setPatients(data.patients) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Patients"
        description="View patients who have visited your practice"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No patients yet"
            description="Patients will appear here after their first visit."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {patients.map((p) => (
            <Card key={p.patientId}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.name}</h3>
                    <p className="text-sm text-slate-500">{p.email}</p>
                  </div>
                  <Badge variant="primary">
                    {p.totalVisits} visit{p.totalVisits !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-slate-600">
                  {p.age && <span>Age: {p.age}</span>}
                  {p.bloodGroup && <span>Blood: {p.bloodGroup}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-2">Last visit: {p.lastVisit}</p>
                <Link to={`/doctor/patients/${p.patientId}/history`}
                  className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 font-medium hover:underline">
                  View History <ArrowRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorPatients
