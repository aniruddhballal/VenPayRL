import type { Invoice } from '../types'

interface Props { invoices: Invoice[] }

function StatusBadge({ inv }: { inv: Invoice }) {
  if (inv.paid) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style={{ background: '#f0fdf4', color: 'var(--color-positive)' }}>
      <span>✓</span> Paid
    </span>
  )
  if (inv.delayed > 0) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style={{ background: '#fef2f2', color: 'var(--color-negative)' }}>
      <span>!</span> Late {inv.delayed}d
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
      Pending
    </span>
  )
}

export default function InvoiceTable({ invoices }: Props) {
  return (
    <div className="card p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] mb-4"
         style={{ color: 'var(--color-text-muted)' }}>
        Invoices
      </p>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Vendor', 'Amount', 'Due', 'Penalty', 'Status'].map(h => (
              <th key={h} className="pb-2 text-left text-[11px] font-medium uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-muted)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} className="hoverable"
                style={{ borderBottom: '1px solid var(--color-border)', opacity: inv.paid ? 0.4 : 1, transition: 'opacity 400ms ease' }}>
              <td className="py-2.5 text-sm font-medium" style={{ color: 'var(--color-text-primary)', textDecoration: inv.paid ? 'line-through' : 'none' }}>
                {inv.vendor}
              </td>
              <td className="py-2.5 text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
                ${inv.amount.toFixed(0)}
              </td>
              <td className="py-2.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                D{inv.dueDate}
              </td>
              <td className="py-2.5 text-sm" style={{ color: inv.penaltyRate >= 0.1 ? 'var(--color-negative)' : 'var(--color-text-secondary)' }}>
                {(inv.penaltyRate * 100).toFixed(0)}%
              </td>
              <td className="py-2.5">
                <StatusBadge inv={inv} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}