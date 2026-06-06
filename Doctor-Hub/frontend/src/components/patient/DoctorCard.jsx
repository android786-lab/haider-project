import { Link } from 'react-router-dom'

const DoctorCard = ({ doctor }) => (
  <Link
    to={`/patient/doctors/${doctor.id}`}
    className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all block"
  >
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-gray-900">Dr. {doctor.name}</h3>
        <p className="text-sm text-primary mt-0.5">{doctor.specialization}</p>
      </div>
      <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
        <span>★</span>
        <span>{doctor.rating}</span>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2 text-xs">
      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
        {doctor.treatmentType}
      </span>
      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
        {doctor.experience} yrs exp
      </span>
    </div>

    <div className="mt-4 flex items-center justify-between">
      <span className="text-lg font-bold text-gray-900">${doctor.fee}</span>
      <span className="text-sm text-primary font-medium">Book Now →</span>
    </div>
  </Link>
)

export default DoctorCard
