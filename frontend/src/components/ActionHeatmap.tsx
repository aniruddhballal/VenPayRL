import type { Invoice, ActionRecord } from '../types'

interface Props { invoices: Invoice[]; actionHistory: ActionRecord[] }

const actionStyle: Record<string, { bg: string; border: string; color: string; label: string }> = {
  full:    { bg: '#F0FBF4', border: '#1A7F4B', color: '#1A7F4B', label: 'F' },
  partial: { bg: '#FDF6EC', border: '#B86E00', color: '#B86E00', label: 'P' },
  delay:   { bg: '#FDF2F2', border: '#C93B3B', color: '#C93B3B', label: 'D' },
  overdue: { bg: '#FDF2F2', border: '#8B2020', color: '#8B2020', label: 'O' },
}

export default function ActionHeatmap({ invoices, actionHistory }: Props) {
  const days = [...new Set(actionHistory.map(a => a.day))].sort((a, b) => a - b)
  if (!actionHistory.length) return null

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label">Action Heatmap</p>
        <div className="flex gap-4">
          {Object.entries(actionStyle).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: v.bg, border: `1px solid ${v.border}40` }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table style={{ borderSpacing: '2px', borderCollapse: 'separate' }}>
          <thead>
            <tr>
              <th className="label text-left pr-4 pb-1 font-medium" style={{ minWidth: '96px' }}>Vendor</th>
              {days.map(d => (
                <th key={d} className="label pb-1 text-center w-7">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="pr-4 py-0.5" style={{ fontSize: '12px', fontWeight: 500, color: inv.paid ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: inv.paid ? 'line-through' : 'none' }}>
                  {inv.vendor}
                </td>
                {days.map(d => {
                  const rec = actionHistory.find(a => a.day === d && a.invoiceId === inv.id)
                  const s   = rec ? actionStyle[rec.action] : null
                  return (
                    <td key={d} className="p-0">
                      {s
                        ? <div className="w-7 h-7 rounded flex items-center justify-center cursor-default"
                               style={{ background: s.bg, border: `1px solid ${s.border}30` }}
                               title={`Day ${d}: ${rec!.action}`}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: s.color }}>{s.label}</span>
                          </div>
                        : <div className="w-7 h-7 rounded" style={{ background: 'var(--surface-raised)' }} />
                      }
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