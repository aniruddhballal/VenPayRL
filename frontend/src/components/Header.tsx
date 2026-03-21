import { TrendingUp, TrendingDown } from 'lucide-react'
import type { SimState } from '../types'

interface Props { state: SimState }

export default function Header({ state }: Props) {
  const rewardUp = state.totalReward >= 0

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded flex items-center justify-center"
               style={{ background: 'var(--text-primary)' }}>
            <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em' }}>VP</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--text-primary)' }}>
            VenPayRL
          </span>
        </div>

        <div className="flex items-center gap-8">
          {[
            { label: 'Day',    value: String(state.day),                    color: 'var(--text-primary)' },
            { label: 'Cash',   value: `$${state.cash.toLocaleString()}`,    color: 'var(--positive)' },
            { label: 'Reward', value: state.totalReward.toFixed(1),         color: rewardUp ? 'var(--positive)' : 'var(--negative)' },
          ].map(stat => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <span className="label">{stat.label}</span>
              <span className="tick" style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
          <div style={{ color: rewardUp ? 'var(--positive)' : 'var(--negative)' }}>
            {rewardUp
              ? <TrendingUp size={15} />
              : <TrendingDown size={15} />
            }
          </div>
        </div>
      </div>
    </header>
  )
}