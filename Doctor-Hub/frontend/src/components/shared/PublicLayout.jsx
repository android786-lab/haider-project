import { Link, Outlet } from 'react-router-dom'

import { Stethoscope } from 'lucide-react'

import { useAuth } from '../../context/AuthContext'

import Button from '../ui/Button'



const PublicLayout = () => {

  const { isAuthenticated, user, getRedirectPath } = useAuth()



  return (

    <div className="min-h-screen flex flex-col bg-white">

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-surface-border shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

          <Link to="/" className="flex items-center gap-2.5 group">

            <div className="p-2 rounded-xl bg-primary-600 text-white group-hover:bg-primary-700 transition-colors">

              <Stethoscope className="w-5 h-5" />

            </div>

            <span className="text-xl font-bold text-slate-900">Doctor Hub</span>

          </Link>



          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">

            <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>

            <Link to="/about" className="hover:text-primary-600 transition-colors">About</Link>

            <Link to="/contact" className="hover:text-primary-600 transition-colors">Contact</Link>

          </nav>



          <div className="flex items-center gap-2 sm:gap-3">

            {isAuthenticated ? (

              <Link to={getRedirectPath(user.role)}>

                <Button size="sm">My Dashboard</Button>

              </Link>

            ) : (

              <>

                <Link to="/admin/login" className="hidden sm:block">

                  <Button variant="ghost" size="sm">Admin</Button>

                </Link>

                <Link to="/login">

                  <Button variant="outline" size="sm">Staff Login</Button>

                </Link>

                <Link to="/register">

                  <Button size="sm">Register</Button>

                </Link>

              </>

            )}

          </div>

        </div>

      </header>



      <main className="flex-1">

        <Outlet />

      </main>



      <footer className="border-t border-surface-border bg-slate-50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

          <div className="grid sm:grid-cols-3 gap-8 mb-8">

            <div>

              <p className="font-bold text-slate-900">Doctor Hub</p>

              <p className="text-sm text-slate-500 mt-2">Digital healthcare for patients, doctors, and administrators.</p>

            </div>

            <div>

              <p className="font-semibold text-slate-800 text-sm mb-3">Portals</p>

              <div className="flex flex-col gap-2 text-sm text-slate-500">

                <Link to="/register" className="hover:text-primary-600">Patient Register</Link>

                <Link to="/login" className="hover:text-primary-600">Staff Login</Link>

                <Link to="/admin/login" className="hover:text-primary-600">Admin Login</Link>

              </div>

            </div>

            <div>

              <p className="font-semibold text-slate-800 text-sm mb-3">Company</p>

              <div className="flex flex-col gap-2 text-sm text-slate-500">

                <Link to="/about" className="hover:text-primary-600">About</Link>

                <Link to="/contact" className="hover:text-primary-600">Contact</Link>

              </div>

            </div>

          </div>

          <p className="text-sm text-slate-400 border-t border-surface-border pt-6">

            &copy; {new Date().getFullYear()} Doctor Hub. Healthcare made simple.

          </p>

        </div>

      </footer>

    </div>

  )

}



export default PublicLayout

