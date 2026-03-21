import { TrendingUp, TrendingDown } from 'lucide-react'
import type { SimState } from '../types'
import type { Mode } from '../App'

interface Props {
  state:        SimState
  mode:         Mode
  onModeChange: (m: Mode) => void
}

export default function Header({ state, mode, onModeChange }: Props) {
  const rewardUp = state.totalReward >= 0

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5" style={{ minWidth: '160px' }}>
          <div className="w-6 h-6 rounded flex items-center justify-center"
               style={{ background: 'var(--text-primary)' }}>
            <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>VP</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--text-primary)' }}>
            VenPayRL
          </span>
        </div>

        {/* Mode tabs — center */}
        <div className="flex items-center rounded-lg p-1"
             style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          {(['simulate', 'analyse'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              style={{
                height: '30px',
                padding: '0 20px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                transition: 'all 150ms ease',
                background: mode === m ? 'var(--surface)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(26,25,22,0.08)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Stats — right */}
        <div className="flex items-center gap-6" style={{ minWidth: '160px', justifyContent: 'flex-end' }}>
          {[
            { label: 'Day',    value: String(state.day),                 color: 'var(--text-primary)' },
            { label: 'Cash',   value: `$${state.cash.toLocaleString()}`, color: 'var(--positive)'     },
            { label: 'Reward', value: state.totalReward.toFixed(1),      color: rewardUp ? 'var(--positive)' : 'var(--negative)' },
          ].map(s => (
            <div key={s.label} className="flex items-baseline gap-1.5">
              <span className="label">{s.label}</span>
              <span className="tick" style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: s.color }}>
                {s.value}
              </span>
            </div>
          ))}
          <div style={{ color: rewardUp ? 'var(--positive)' : 'var(--negative)' }}>
            {rewardUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </div>
        </div>

      </div>
    </header>
  )
}