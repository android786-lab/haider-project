import { useEffect, useState } from 'react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import DataTable from '../../components/shared/DataTable'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDoctors = () => {
    setLoading(true)
    api.get('/api/admin/doctors')
      .then(({ data }) => { if (data.success) setDoctors(data.doctors) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDoctors() }, [])

  const toggleVerify = async (doctor) => {
    const endpoint = doctor.isVerified
      ? `/api/admin/doctors/${doctor.id}/unverify`
      : `/api/admin/doctors/${doctor.id}/verify`
    try {
      await api.put(endpoint)
      fetchDoctors()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (d) => (
        <div>
          <p className="font-medium text-slate-900">{d.name}</p>
          <p className="text-xs text-slate-500">{d.email}</p>
        </div>
      ),
    },
    { key: 'specialization', label: 'Specialization', render: (d) => d.specialization || '—' },
    { key: 'treatmentType', label: 'Type', render: (d) => <span className="capitalize">{d.treatmentType || '—'}</span> },
    { key: 'fee', label: 'Fee', render: (d) => `$${d.fee}` },
    {
      key: 'verified',
      label: 'Verified',
      render: (d) => (
        <Badge variant={d.isVerified ? 'success' : 'default'}>
          {d.isVerified ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (d) => (
        <Button
          size="sm"
          variant={d.isVerified ? 'danger' : 'primary'}
          onClick={() => toggleVerify(d)}
          className={!d.isVerified ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          {d.isVerified ? 'Unverify' : 'Verify'}
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Doctors"
        description="Manage doctor accounts and verification status"
      />

      {loading ? (
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      ) : (
        <DataTable columns={columns} data={doctors} emptyMessage="No doctors found." />
      )}
    </div>
  )
}

export default AdminDoctors
