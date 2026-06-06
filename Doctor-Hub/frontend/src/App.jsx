import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './components/shared/PublicLayout'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Unauthorized from './pages/Unauthorized'
import NotFound from './pages/NotFound'
import DoctorLayout from './components/doctor/DoctorLayout'
import DoctorHome from './pages/doctor/DoctorHome'
import DoctorProfile from './pages/doctor/DoctorProfile'
import DoctorClinics from './pages/doctor/DoctorClinics'
import DoctorSchedule from './pages/doctor/DoctorSchedule'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorPatients from './pages/doctor/DoctorPatients'
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions'
import DoctorAppointmentDetail from './pages/doctor/DoctorAppointmentDetail'
import DoctorAddMedicalRecord from './pages/doctor/DoctorAddMedicalRecord'
import DoctorAddPrescription from './pages/doctor/DoctorAddPrescription'
import DoctorPatientHistory from './pages/doctor/DoctorPatientHistory'
import PatientLayout from './components/patient/PatientLayout'
import PatientHome from './pages/patient/PatientHome'
import PatientFindDoctor from './pages/patient/PatientFindDoctor'
import PatientDoctorDetail from './pages/patient/PatientDoctorDetail'
import PatientAppointments from './pages/patient/PatientAppointments'
import PatientHistory from './pages/patient/PatientHistory'
import PatientPrescriptions from './pages/patient/PatientPrescriptions'
import PatientProfile from './pages/patient/PatientProfile'
import AssistantLayout from './components/assistant/AssistantLayout'
import AssistantHome from './pages/assistant/AssistantHome'
import AssistantPendingPayments from './pages/assistant/AssistantPendingPayments'
import AssistantAppointments from './pages/assistant/AssistantAppointments'
import AssistantBookings from './pages/assistant/AssistantBookings'
import AdminLayout from './components/admin/AdminLayout'
import AdminHome from './pages/admin/AdminHome'
import AdminDoctors from './pages/admin/AdminDoctors'
import AdminPatients from './pages/admin/AdminPatients'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminPayments from './pages/admin/AdminPayments'
import AdminAdmins from './pages/admin/AdminAdmins'
import AdminUsers from './pages/admin/AdminUsers'

const App = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PatientHome />} />
        <Route path="doctors" element={<PatientFindDoctor />} />
        <Route path="doctors/:id" element={<PatientDoctorDetail />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="history" element={<PatientHistory />} />
        <Route path="prescriptions" element={<PatientPrescriptions />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DoctorHome />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route path="clinics" element={<DoctorClinics />} />
        <Route path="schedule" element={<DoctorSchedule />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="appointments/:appointmentId" element={<DoctorAppointmentDetail />} />
        <Route path="appointments/:appointmentId/medical-record" element={<DoctorAddMedicalRecord />} />
        <Route path="appointments/:appointmentId/prescription" element={<DoctorAddPrescription />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="patients/:patientId/history" element={<DoctorPatientHistory />} />
        <Route path="prescriptions" element={<DoctorPrescriptions />} />
      </Route>

      <Route
        path="/assistant"
        element={
          <ProtectedRoute allowedRoles={['assistant']}>
            <AssistantLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AssistantHome />} />
        <Route path="pending-payments" element={<AssistantPendingPayments />} />
        <Route path="appointments" element={<AssistantAppointments />} />
        <Route path="bookings" element={<AssistantBookings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="patients" element={<AdminPatients />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route
          path="admins"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminAdmins />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/superadmin/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
