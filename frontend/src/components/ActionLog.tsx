import type { LogEntry } from '../types'

interface Props { log: LogEntry[] }

const actionMeta: Record<string, { color: string; bg: string; label: string }> = {
  FULL_PAY:    { color: 'var(--positive)', bg: '#F0FBF4', label: 'Full Pay'  },
  PARTIAL_PAY: { color: 'var(--warning)',  bg: '#FDF6EC', label: 'Partial'   },
  DELAYED:     { color: 'var(--negative)', bg: '#FDF2F2', label: 'Delayed'   },
  OVERDUE:     { color: '#8B2020',         bg: '#FDF2F2', label: 'Overdue'   },
}

export default function ActionLog({ log }: Props) {
  return (
    <div className="card p-5">
      <p className="label mb-4">Action Log</p>
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {[...log].reverse().map((entry, i) => {
          const meta = actionMeta[entry.action] ?? { color: 'var(--text-muted)', bg: 'var(--surface-raised)', label: entry.action }
          const reward = parseFloat(entry.reward)
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg fade-up"
                 style={{ borderLeft: `2.5px solid ${meta.color}`, background: meta.bg }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '28px', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                D{entry.day}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', width: '90px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.vendor}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: meta.color, width: '56px', flexShrink: 0, letterSpacing: '0.03em' }}>
                {meta.label}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '52px', flexShrink: 0 }}>
                ${parseFloat(entry.amount).toFixed(0)}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: reward >= 0 ? 'var(--positive)' : 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>
                {reward >= 0 ? '+' : ''}{reward.toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}