import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'

const AdminPatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/patients')
      .then(({ data }) => {
        if (data.success) {
          const rows = data.patients || data.data || []
          setPatients(rows.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            gender: p.gender,
            joinedAt: p.joinedAt || p.created_at,
          })))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Patients"
        description="View all registered patients on the platform"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No patients found" description="Patients will appear here when they register." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-slate-900">{p.name || 'Unlinked patient'}</h3>
                <p className="text-sm text-slate-500">{p.email || 'No email'}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                  {p.phone && <span>{p.phone}</span>}
                  {p.gender && <span className="capitalize">{p.gender}</span>}
                </div>
                {p.joinedAt && (
                  <p className="text-xs text-slate-400 mt-2">Joined {new Date(p.joinedAt).toLocaleDateString()}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPatients
