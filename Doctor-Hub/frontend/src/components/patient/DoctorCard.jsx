import { Link } from 'react-router-dom'
import { Star, BadgeCheck, ArrowRight, Stethoscope } from 'lucide-react'
import Badge from '../ui/Badge'
import { mapDoctorForPatient } from '../../lib/doctorMappers'

const DoctorCard = ({ doctor: rawDoctor }) => {
  const doctor = mapDoctorForPatient(rawDoctor)

  return (
    <Link
      to={`/patient/doctors/${doctor.id}`}
      className="group bg-white rounded-2xl border border-surface-border overflow-hidden shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300 flex flex-col"
    >
      <div className="p-5 flex gap-4">
        <div className="shrink-0">
          {doctor.image && !doctor.image.startsWith('data:image/png;base64,iVBOR') ? (
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover border border-surface-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
              <Stethoscope className="w-7 h-7" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors truncate">
                Dr. {doctor.name}
              </h3>
              <p className="text-sm text-primary-600 font-medium mt-0.5">{doctor.specialization}</p>
            </div>
            {doctor.available && (
              <Badge variant="success" className="shrink-0 text-[10px]">
                <BadgeCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {doctor.rating}
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full capitalize">
              {doctor.treatmentType}
            </span>
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              {doctor.experience}
            </span>
          </div>

          {doctor.degree && (
            <p className="text-xs text-slate-500 mt-2">{doctor.degree}</p>
          )}
        </div>
      </div>

      <div className="mt-auto px-5 py-4 bg-slate-50/80 border-t border-surface-border flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Consultation Fee</p>
          <p className="text-lg font-bold text-slate-900">{doctor.feeLabel}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
          Book Now
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}

export default DoctorCard
