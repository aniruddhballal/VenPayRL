import type { SimState } from '../types'

interface Props { state: SimState; initialCash: number }

export default function MetricsPanel({ state, initialCash }: Props) {
  const penalties = state.log
    .filter(e => e.action === 'DELAYED' || e.action === 'OVERDUE')
    .reduce((s, e) => s + parseFloat(e.amount), 0)
  const cashDelta = state.cash - initialCash

  const metrics = [
    { label: 'Total Reward',   value: state.totalReward.toFixed(1), color: state.totalReward >= 0 ? 'var(--color-positive)' : 'var(--color-negative)', tip: 'Cumulative reward this episode' },
    { label: 'Cash',           value: `$${state.cash.toLocaleString()}`, color: 'var(--color-positive)', tip: 'Current available cash' },
    { label: 'Cash Δ',         value: `${cashDelta >= 0 ? '+' : ''}$${cashDelta.toFixed(0)}`, color: cashDelta >= 0 ? 'var(--color-positive)' : 'var(--color-negative)', tip: 'Change from starting cash' },
    { label: 'Penalties',      value: `$${penalties.toFixed(0)}`, color: 'var(--color-negative)', tip: 'Total penalty dollars accrued' },
    { label: 'Invoices',       value: `${state.invoices.filter(i => i.paid).length}/${state.invoices.length}`, color: 'var(--color-text-primary)', tip: 'Settled vs total invoices' },
    { label: 'Day',            value: String(state.day), color: 'var(--color-text-primary)', tip: 'Current simulation day' },
  ]

  return (
    <div className="card p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] mb-4"
         style={{ color: 'var(--color-text-muted)' }}>
        Metrics
      </p>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => (
          <div key={m.label}
               className="group relative rounded-lg p-3 cursor-default"
               style={{ background: 'var(--color-surface-raised)' }}>
            <p className="text-[10px] uppercase tracking-[0.06em] mb-1"
               style={{ color: 'var(--color-text-muted)' }}>
              {m.label}
            </p>
            <p className="text-lg" style={{ fontFamily: 'var(--font-display)', color: m.color }}>
              {m.value}
            </p>
            {/* Tooltip */}
            <div className="glass absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 px-3 py-2 rounded-lg text-xs text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                 style={{ color: 'var(--color-text-secondary)' }}>
              {m.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}