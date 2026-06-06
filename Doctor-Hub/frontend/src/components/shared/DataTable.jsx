import { cn } from '../../lib/utils'

const DataTable = ({ columns, data, emptyMessage = 'No records found.', className }) => (
  <div className={cn('overflow-x-auto rounded-xl border border-surface-border', className)}>
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50/80 border-b border-surface-border">
          {columns.map((col) => (
            <th
              key={col.key}
              className={cn('text-left px-4 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider', col.className)}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-border bg-white">
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3.5 text-slate-700', col.className)}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

export default DataTable
