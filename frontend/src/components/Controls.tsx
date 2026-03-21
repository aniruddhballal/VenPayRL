interface Props {
  running:        boolean
  allPaid:        boolean
  speed:          number
  onReset:        () => void
  onStep:         () => void
  onStart:        () => void
  onStop:         () => void
  onSpeedChange:  (v: number) => void
}

export default function Controls({ running, allPaid, speed, onReset, onStep, onStart, onStop, onSpeedChange }: Props) {
  const btnBase = 'inline-flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-all duration-150 select-none'
  const btnPrimary = `${btnBase} bg-black text-white hover:bg-neutral-800 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`
  const btnSecondary = `${btnBase} bg-white border text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`
  const btnDanger = `${btnBase} bg-white border border-red-200 text-red-600 hover:bg-red-50 active:scale-95`

  return (
    <div className="card p-4 flex flex-wrap items-center gap-3">
      <button onClick={onReset} className={btnSecondary}
              style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-xs">↺</span> Reset
      </button>

      <button onClick={onStep} disabled={running || allPaid} className={btnSecondary}
              style={{ borderColor: 'var(--color-border)' }}>
        Step
      </button>

      {!running
        ? <button onClick={onStart} disabled={allPaid} className={btnPrimary}>
            <span className="text-xs">▶</span> Auto Run
          </button>
        : <button onClick={onStop} className={btnDanger}>
            <span className="text-xs">⏸</span> Pause
          </button>
      }

      <div className="flex items-center gap-3 ml-2">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Speed</span>
        <input
          type="range" min={100} max={1500} step={100}
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className="w-24"
          style={{ accentColor: '#0a0a0a' }}
        />
        <span className="text-xs w-12" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
          {speed}ms
        </span>
      </div>
    </div>
  )
}