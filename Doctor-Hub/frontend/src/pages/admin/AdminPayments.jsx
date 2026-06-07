import { useEffect, useState } from 'react'

import { CreditCard, X } from 'lucide-react'

import api from '../../lib/api'

import PageHeader from '../../components/shared/PageHeader'

import StatusBadge from '../../components/shared/StatusBadge'

import DataTable from '../../components/shared/DataTable'

import EmptyState from '../../components/shared/EmptyState'

import { Card } from '../../components/ui/Card'

import { formatFeePKR } from '../../lib/doctorMappers'

import { resolveAssetUrl } from '../../lib/assistantMappers'



const API_URL = import.meta.env.VITE_API_URL || ''



const AdminPayments = () => {

  const [payments, setPayments] = useState([])

  const [loading, setLoading] = useState(true)

  const [preview, setPreview] = useState(null)



  useEffect(() => {

    api.get('/api/admin/payments')

      .then(({ data }) => {

        if (data.success) setPayments(data.payments || data.data || [])

      })

      .catch(console.error)

      .finally(() => setLoading(false))

  }, [])



  const columns = [

    {

      key: 'patient',

      label: 'Patient',

      render: (p) => (

        <div>

          <p className="font-medium text-slate-900">{p.patientName || '—'}</p>

          {p.patientEmail && <p className="text-xs text-slate-500">{p.patientEmail}</p>}

        </div>

      ),

    },

    {

      key: 'doctor',

      label: 'Doctor',

      render: (p) => (

        <div>

          <p className="font-medium text-slate-900">{p.doctorName ? `Dr. ${p.doctorName}` : '—'}</p>

          {p.doctorSpeciality && <p className="text-xs text-slate-500">{p.doctorSpeciality}</p>}

        </div>

      ),

    },

    {

      key: 'appointmentDate',

      label: 'Appointment',

      render: (p) => (

        <div>

          <p className="text-slate-800">{p.appointmentDate || '—'}</p>

          {p.timeSlot && <p className="text-xs text-slate-500">{p.timeSlot}</p>}

        </div>

      ),

    },

    {

      key: 'amount',

      label: 'Amount (PKR)',

      render: (p) => (

        <span className="font-semibold text-slate-900">{formatFeePKR(p.amount)}</span>

      ),

    },

    {

      key: 'status',

      label: 'Status',

      render: (p) => <StatusBadge status={p.status} />,

    },

    {

      key: 'screenshot',

      label: 'Screenshot',

      render: (p) => (p.screenshotUrl || p.screenshot_url) ? (

        <button

          type="button"

          onClick={() => setPreview(resolveAssetUrl(p.screenshotUrl || p.screenshot_url, API_URL))}

          className="text-primary-600 text-xs font-semibold hover:underline"

        >

          View

        </button>

      ) : (

        <span className="text-slate-400 text-xs">—</span>

      ),

    },

  ]



  return (

    <div className="page-container">

      <PageHeader

        title="Payments"

        description="All patient payment proofs — amounts shown in PKR"

      />



      {!loading && payments.length > 0 && (

        <p className="text-sm text-slate-500 mb-4">

          {payments.length} payment record{payments.length !== 1 ? 's' : ''}

        </p>

      )}



      {loading ? (

        <div className="h-48 bg-white rounded-2xl animate-pulse border border-surface-border" />

      ) : payments.length === 0 ? (

        <Card>

          <EmptyState

            icon={CreditCard}

            title="No payments yet"

            description="Payment submissions will appear here when patients upload proof."

          />

        </Card>

      ) : (

        <DataTable columns={columns} data={payments} emptyMessage="No payments found." />

      )}



      {preview && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>

          <div className="relative max-w-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

            <button

              type="button"

              onClick={() => setPreview(null)}

              className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 shadow-lg flex items-center justify-center"

            >

              <X className="w-4 h-4" />

            </button>

            <img src={preview} alt="Payment screenshot" className="max-w-full max-h-[85vh] rounded-2xl" />

          </div>

        </div>

      )}

    </div>

  )

}



export default AdminPayments

