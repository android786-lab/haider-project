const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {Icon && (
      <div className="p-4 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    {description && <p className="text-sm text-slate-500 mt-2 max-w-sm">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
)

export default EmptyState
