import type { Invoice, ActionRecord } from '../types'

interface Props {
  invoices: Invoice[]
  actionHistory: ActionRecord[]
}

const actionColor: Record<string, string> = {
  full: 'bg-emerald-500',
  partial: 'bg-amber-500',
  delay: 'bg-red-500',
  overdue: 'bg-red-900',
}

const actionLabel: Record<string, string> = {
  full: 'F',
  partial: 'P',
  delay: 'D',
  overdue: 'O',
}

export default function ActionHeatmap({ invoices, actionHistory }: Props) {
  const days = Array.from(new Set(actionHistory.map(a => a.day))).sort((a, b) => a - b)

  if (actionHistory.length === 0) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Action Heatmap</h2>
      <div className="h-24 flex items-center justify-center text-gray-600 text-sm">
        Step the agent to see decision heatmap
      </div>
    </div>
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Action Heatmap</h2>

      <div className="flex gap-3 mb-4 text-xs">
        {Object.entries(actionColor).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${v}`} />
            <span className="text-gray-400 capitalize">{k}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="text-xs border-separate border-spacing-0.5">
          <thead>
            <tr>
              <th className="text-left text-gray-600 font-normal pr-3 pb-1 min-w-24">Vendor</th>
              {days.map(d => (
                <th key={d} className="text-gray-600 font-normal w-6 text-center pb-1">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className={`pr-3 py-0.5 ${inv.paid ? 'text-gray-600 line-through' : 'text-violet-400'}`}>
                  {inv.vendor}
                </td>
                {days.map(d => {
                  const rec = actionHistory.find(a => a.day === d && a.invoiceId === inv.id)
                  return (
                    <td key={d} className="p-0">
                      {rec ? (
                        <div
                          className={`w-6 h-6 rounded-sm flex items-center justify-center text-white font-bold text-xs ${actionColor[rec.action] ?? 'bg-gray-700'}`}
                          title={`Day ${d}: ${rec.action}`}
                        >
                          {actionLabel[rec.action]}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-sm bg-gray-800/40" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}