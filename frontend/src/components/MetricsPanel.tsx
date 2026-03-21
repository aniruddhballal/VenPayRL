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

  const metricDefs = [
    { label: 'Total Reward',   value: state.totalReward.toFixed(1),              color: state.totalReward >= 0 ? 'text-amber-400' : 'text-red-400', tip: 'Cumulative reward this episode. Higher = better agent decisions.' },
    { label: 'Final Cash',     value: `$${state.cash.toLocaleString()}`,          color: 'text-green-400',  tip: 'Cash remaining at current step.' },
    { label: 'Cash Delta',     value: `${cashDelta >= 0 ? '+' : ''}$${cashDelta.toFixed(0)}`, color: cashDelta >= 0 ? 'text-emerald-400' : 'text-red-400', tip: 'Change in cash vs starting balance.' },
    { label: 'Penalties Paid', value: `$${penalties.toFixed(0)}`,                color: 'text-red-400',    tip: 'Total penalty dollars from delays and overdue invoices.' },
    { label: 'Paid',           value: `${state.invoices.filter(i => i.paid).length}/${state.invoices.length}`, color: 'text-teal-400', tip: 'Invoices fully settled vs total.' },
    { label: 'Day',            value: String(state.day),                         color: 'text-gray-300',   tip: 'Current simulation day. Episode ends at day 60.' },
  ]

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Metrics</h2>
      <div className="grid grid-cols-2 gap-3">
        {metricDefs.map(m => (
          <div key={m.label} className="bg-gray-950 rounded-lg p-3 group relative cursor-default">
            <div className="text-xs text-gray-600 mb-1">{m.label}</div>
            <div className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
              {m.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}