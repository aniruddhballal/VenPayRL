import type { SimState } from '../types'

interface Props { state: SimState; initialCash: number }

export default function MetricsPanel({ state, initialCash }: Props) {
  const penalties = state.log
    .filter(e => e.action === 'DELAYED' || e.action === 'OVERDUE')
    .reduce((s, e) => s + parseFloat(e.amount), 0)
  const cashDelta = state.cash - initialCash

  const metrics = [
    { label: 'Total Reward',  value: state.totalReward.toFixed(1), color: state.totalReward >= 0 ? 'var(--positive)' : 'var(--negative)', tip: 'Cumulative reward this episode' },
    { label: 'Cash',          value: `$${state.cash.toLocaleString()}`,  color: 'var(--positive)', tip: 'Current available cash' },
    { label: 'Cash Delta',    value: `${cashDelta >= 0 ? '+' : ''}$${cashDelta.toFixed(0)}`, color: cashDelta >= 0 ? 'var(--positive)' : 'var(--negative)', tip: 'Change from starting cash' },
    { label: 'Penalties',     value: `$${penalties.toFixed(0)}`, color: 'var(--negative)', tip: 'Total penalty dollars' },
    { label: 'Invoices',      value: `${state.invoices.filter(i => i.paid).length}/${state.invoices.length}`, color: 'var(--text-primary)', tip: 'Settled vs total' },
    { label: 'Day',           value: String(state.day), color: 'var(--text-primary)', tip: 'Current day' },
  ]

  return (
    <div className="card p-4">
      <p className="label mb-3">Metrics</p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(m => (
          <div key={m.label} className="group relative rounded-lg p-3 cursor-default"
               style={{ background: 'var(--surface-raised)' }}>
            <p className="label mb-1">{m.label}</p>
            <p className="metric-value tick" style={{ color: m.color }}>{m.value}</p>
            <div className="glass absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20"
                 style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {m.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}