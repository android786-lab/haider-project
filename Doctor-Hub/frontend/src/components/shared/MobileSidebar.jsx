import { useState } from 'react'

const MobileSidebar = ({ title, subtitle, nav, footer }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg border border-gray-200 text-gray-600"
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="hidden lg:block px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 mt-14 lg:mt-0 overflow-y-auto" onClick={() => setOpen(false)}>
          {nav}
        </nav>

        {footer && <div className="px-4 py-4 border-t border-gray-100">{footer}</div>}
      </aside>
    </>
  )
}

export default MobileSidebar
