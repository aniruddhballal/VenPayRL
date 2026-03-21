import type { SimState } from '../types'

interface Props { state: SimState }

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[11px] uppercase tracking-[0.08em]"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </span>
      <span className="text-lg font-display tick"
            style={{ fontFamily: 'var(--font-display)', color: color ?? 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

export default function Header({ state }: Props) {
  const rewardColor = state.totalReward >= 0
    ? 'var(--color-positive)'
    : 'var(--color-negative)'

  return (
    <header style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
            <span className="text-white text-[10px] font-semibold tracking-tight">VP</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '-0.01em' }}>
            VenPayRL
          </span>
        </div>

        <div className="flex items-center gap-8">
          <StatPill label="Day"    value={String(state.day)} />
          <StatPill label="Cash"   value={`$${state.cash.toLocaleString()}`} color="var(--color-positive)" />
          <StatPill label="Reward" value={state.totalReward.toFixed(1)} color={rewardColor} />
        </div>
      </div>
    </header>
  )
}