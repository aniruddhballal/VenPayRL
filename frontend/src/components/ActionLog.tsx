import type { LogEntry } from '../types'

interface Props { log: LogEntry[] }

const actionMeta: Record<string, { color: string; label: string }> = {
  FULL_PAY:    { color: 'var(--color-positive)', label: 'Full Pay' },
  PARTIAL_PAY: { color: 'var(--color-warning)',  label: 'Partial'  },
  DELAYED:     { color: 'var(--color-negative)', label: 'Delayed'  },
  OVERDUE:     { color: '#991b1b',               label: 'Overdue'  },
}

export default function ActionLog({ log }: Props) {
  return (
    <div className="card p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] mb-4"
         style={{ color: 'var(--color-text-muted)' }}>
        Action Log
      </p>
      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {[...log].reverse().map((entry, i) => {
          const meta = actionMeta[entry.action] ?? { color: '#6b6b6b', label: entry.action }
          const reward = parseFloat(entry.reward)
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs fade-in"
              style={{
                background: 'var(--color-surface-raised)',
                borderLeft: `3px solid ${meta.color}`,
              }}
            >
              <span className="w-10 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                D{entry.day}
              </span>
              <span className="w-24 shrink-0 font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {entry.vendor}
              </span>
              <span className="w-16 shrink-0 text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="w-16 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                ${parseFloat(entry.amount).toFixed(0)}
              </span>
              <span className="font-medium" style={{ color: reward >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                {reward >= 0 ? '+' : ''}{reward.toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}