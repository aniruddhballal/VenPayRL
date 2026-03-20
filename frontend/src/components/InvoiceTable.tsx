import type { Invoice } from '../types'

interface Props {
  invoices: Invoice[]
}

export default function InvoiceTable({ invoices }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Invoices</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600 text-xs border-b border-gray-800">
            <th className="pb-2 font-normal">Vendor</th>
            <th className="pb-2 font-normal">Amount</th>
            <th className="pb-2 font-normal">Due</th>
            <th className="pb-2 font-normal">Penalty</th>
            <th className="pb-2 font-normal">Delay</th>
            <th className="pb-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr
              key={inv.id}
              className={`border-b border-gray-800/50 ${inv.paid ? 'opacity-30 line-through' : inv.delayed > 0 ? 'text-red-400' : ''}`}
            >
              <td className="py-2 text-violet-300">{inv.vendor}</td>
              <td className="py-2">${inv.amount.toFixed(0)}</td>
              <td className="py-2">D{inv.dueDate}</td>
              <td className="py-2">{(inv.penaltyRate * 100).toFixed(0)}%</td>
              <td className="py-2">{inv.delayed}d</td>
              <td className="py-2 text-xs">
                {inv.paid ? (
                  <span className="text-emerald-500">Paid</span>
                ) : inv.delayed > 0 ? (
                  <span className="text-red-400">Late</span>
                ) : (
                  <span className="text-gray-500">Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}