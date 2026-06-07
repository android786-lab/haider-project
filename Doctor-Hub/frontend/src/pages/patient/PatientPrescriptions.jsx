import { useEffect, useState } from 'react'

import { Pill, Stethoscope } from 'lucide-react'

import api from '../../lib/api'

import PageHeader from '../../components/shared/PageHeader'

import EmptyState from '../../components/shared/EmptyState'

import { Card, CardContent } from '../../components/ui/Card'

import Badge from '../../components/ui/Badge'

import { mapPatientPrescription, normalizePrescriptionList } from '../../lib/patientRecordsMappers'



const PatientPrescriptions = () => {

  const [prescriptions, setPrescriptions] = useState([])

  const [loading, setLoading] = useState(true)



  useEffect(() => {

    api.get('/api/patient/prescriptions')

      .then(({ data }) => {

        if (data.success) {

          setPrescriptions(normalizePrescriptionList(data).map(mapPatientPrescription))

        }

      })

      .catch(console.error)

      .finally(() => setLoading(false))

  }, [])



  return (

    <div className="page-container">

      <PageHeader

        title="Prescriptions"

        description="Medicines prescribed by your doctors — permanent records, read only"

      />



      {loading ? (

        <div className="space-y-4">

          {[...Array(2)].map((_, i) => (

            <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-surface-border" />

          ))}

        </div>

      ) : prescriptions.length === 0 ? (

        <Card>

          <EmptyState

            icon={Pill}

            title="No prescriptions yet"

            description="Prescriptions from your doctor will appear here after consultations."

          />

        </Card>

      ) : (

        <div className="space-y-4">

          {prescriptions.map((rx) => (

            <Card key={rx.id} className="border-surface-border shadow-sm overflow-hidden">

              <div className="h-1.5 bg-gradient-to-r from-primary-500 to-primary-600" />

              <CardContent className="pt-5">

                <div className="flex flex-wrap items-start justify-between gap-3">

                  <div>

                    <p className="font-bold text-slate-900 inline-flex items-center gap-2">

                      <Stethoscope className="w-4 h-4 text-primary-600" />

                      Dr. {rx.doctorName}

                    </p>

                    <p className="text-sm text-primary-600 mt-0.5">{rx.specialization}</p>

                    <p className="text-sm text-slate-500 mt-1">Issued: {rx.visitDate}</p>

                  </div>

                  <Badge variant="default">Read only</Badge>

                </div>



                {rx.diagnosis && (

                  <p className="text-sm text-slate-700 mt-4 bg-slate-50 rounded-xl px-4 py-3 border border-surface-border">

                    <span className="font-semibold text-slate-900">Diagnosis: </span>{rx.diagnosis}

                  </p>

                )}



                <div className="mt-4">

                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">

                    <Pill className="w-3.5 h-3.5 text-primary-600" /> Medicines

                  </p>

                  <div className="space-y-2">

                    {rx.medicines.map((med, i) => (

                      <div key={i} className="text-sm bg-primary-50/60 rounded-xl px-4 py-3 border border-primary-100">

                        <p className="font-semibold text-slate-900">{med.name}</p>

                        <p className="text-slate-600 mt-1">

                          {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ') || 'As directed'}

                        </p>

                        {med.instructions && (

                          <p className="text-xs text-slate-500 mt-1">{med.instructions}</p>

                        )}

                      </div>

                    ))}

                  </div>

                </div>



                {rx.instructions && (

                  <p className="text-sm text-slate-600 mt-4">

                    <span className="font-semibold text-slate-800">Instructions: </span>{rx.instructions}

                  </p>

                )}

              </CardContent>

            </Card>

          ))}

        </div>

      )}

    </div>

  )

}



export default PatientPrescriptions

