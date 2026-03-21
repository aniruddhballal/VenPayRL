import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { Invoice } from '../types'

interface Props { invoices: Invoice[] }

function StatusBadge({ inv }: { inv: Invoice }) {
  if (inv.paid) return (
    <span className="inline-flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--positive)' }}>
      <CheckCircle2 size={12} /> Paid
    </span>
  )
  if (inv.delayed > 0) return (
    <span className="inline-flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--negative)' }}>
      <AlertCircle size={12} /> Late {inv.delayed}d
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
      <Clock size={12} /> Pending
    </span>
  )
}

export default function InvoiceTable({ invoices }: Props) {
  return (
    <div className="card p-5">
      <p className="label mb-4">Invoices</p>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Vendor', 'Amount', 'Due', 'Penalty', 'Status'].map(h => (
              <th key={h} className="label pb-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id} className="row-hover"
                style={{ borderBottom: '1px solid var(--border)', opacity: inv.paid ? 0.45 : 1, transition: 'opacity 400ms ease' }}>
              <td className="py-2.5" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', textDecoration: inv.paid ? 'line-through' : 'none' }}>
                {inv.vendor}
              </td>
              <td className="py-2.5" style={{ fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-primary)' }}>
                ${inv.amount.toFixed(0)}
              </td>
              <td className="py-2.5" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>D{inv.dueDate}</td>
              <td className="py-2.5" style={{ fontSize: '13px', color: inv.penaltyRate >= 0.1 ? 'var(--negative)' : 'var(--text-secondary)' }}>
                {(inv.penaltyRate * 100).toFixed(0)}%
              </td>
              <td className="py-2.5"><StatusBadge inv={inv} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}