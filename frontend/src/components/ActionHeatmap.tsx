import type { Invoice, ActionRecord } from '../types'

interface Props { invoices: Invoice[]; actionHistory: ActionRecord[] }

const actionStyle: Record<string, { bg: string; text: string; label: string }> = {
  full:    { bg: '#f0fdf4', text: 'var(--color-positive)', label: 'F' },
  partial: { bg: '#fff7ed', text: 'var(--color-warning)',  label: 'P' },
  delay:   { bg: '#fef2f2', text: 'var(--color-negative)', label: 'D' },
  overdue: { bg: '#fef2f2', text: '#991b1b',               label: 'O' },
}

export default function ActionHeatmap({ invoices, actionHistory }: Props) {
  const days = [...new Set(actionHistory.map(a => a.day))].sort((a, b) => a - b)

  if (!actionHistory.length) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-[0.08em]"
           style={{ color: 'var(--color-text-muted)' }}>
          Action Heatmap
        </p>
        <div className="flex gap-3">
          {Object.entries(actionStyle).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: v.bg, border: `1px solid ${v.text}20` }} />
              <span className="text-[10px] capitalize" style={{ color: 'var(--color-text-muted)' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table style={{ borderSpacing: '2px', borderCollapse: 'separate' }}>
          <thead>
            <tr>
              <th className="text-left pr-4 pb-1 text-[10px] font-normal"
                  style={{ color: 'var(--color-text-muted)', minWidth: '100px' }}>
                Vendor
              </th>
              {days.map(d => (
                <th key={d} className="pb-1 text-center text-[10px] font-normal w-7"
                    style={{ color: 'var(--color-text-muted)' }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="pr-4 py-0.5 text-xs font-medium"
                    style={{ color: inv.paid ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: inv.paid ? 'line-through' : 'none' }}>
                  {inv.vendor}
                </td>
                {days.map(d => {
                  const rec = actionHistory.find(a => a.day === d && a.invoiceId === inv.id)
                  const style = rec ? actionStyle[rec.action] : null
                  return (
                    <td key={d} className="p-0">
                      {style ? (
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-semibold cursor-default"
                          style={{ background: style.bg, color: style.text }}
                          title={`Day ${d}: ${rec!.action}`}
                        >
                          {style.label}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded"
                             style={{ background: 'var(--color-surface-raised)' }} />
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