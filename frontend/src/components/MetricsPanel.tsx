import type { SimState } from '../types'

interface Props {
  state: SimState
  initialCash: number
}

export default function MetricsPanel({ state, initialCash }: Props) {
  const penalties = state.log
    .filter(e => e.action === 'DELAYED' || e.action === 'OVERDUE')
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)

  const cashDelta = state.cash - initialCash

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Metrics</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Reward', value: state.totalReward.toFixed(1), color: state.totalReward >= 0 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Final Cash', value: `$${state.cash.toLocaleString()}`, color: 'text-green-400' },
          { label: 'Cash Delta', value: `${cashDelta >= 0 ? '+' : ''}$${cashDelta.toFixed(0)}`, color: cashDelta >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Penalties Paid', value: `$${penalties.toFixed(0)}`, color: 'text-red-400' },
          { label: 'Paid', value: `${state.invoices.filter(i => i.paid).length}/${state.invoices.length}`, color: 'text-teal-400' },
          { label: 'Day', value: String(state.day), color: 'text-gray-300' },
        ].map(m => (
          <div key={m.label} className="bg-gray-950 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">{m.label}</div>
            <div className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}