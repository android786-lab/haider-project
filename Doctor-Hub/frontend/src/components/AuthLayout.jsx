import { Link } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'
import { Card, CardContent } from './ui/Card'

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen flex bg-auth-gradient">
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 text-white">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
          <Stethoscope className="w-8 h-8" />
        </div>
        <span className="text-3xl font-bold">Doctor Hub</span>
      </div>
      <h2 className="text-4xl font-bold leading-tight mb-4">
        Modern healthcare management for everyone
      </h2>
      <p className="text-primary-100 text-lg max-w-md leading-relaxed">
        Connect patients, doctors, and assistants in one secure platform — appointments, medical records, and payments unified.
      </p>
    </div>

    <div className="flex-1 flex flex-col">
      <header className="lg:hidden px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-white">
          <Stethoscope className="w-6 h-6" />
          <span className="text-lg font-bold">Doctor Hub</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-elevated border-0">
          <CardContent className="pt-8 pb-8">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-slate-500 mt-1.5 text-sm">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </CardContent>
        </Card>
      </main>
    </div>
  </div>
)

export default AuthLayout
