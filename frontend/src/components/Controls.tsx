import { RotateCcw, Play, Pause, ChevronRight } from 'lucide-react'

interface Props {
  running: boolean; allPaid: boolean; speed: number
  onReset: () => void; onStep: () => void
  onStart: () => void; onStop: () => void; onSpeedChange: (v: number) => void
}

export default function Controls({ running, allPaid, speed, onReset, onStep, onStart, onStop, onSpeedChange }: Props) {
  return (
    <div className="card px-5 py-3.5 flex flex-wrap items-center gap-3">
      <button onClick={onReset} className="btn-secondary">
        <RotateCcw size={13} /> Reset
      </button>
      <button onClick={onStep} disabled={running || allPaid} className="btn-secondary">
        <ChevronRight size={13} /> Step
      </button>
      {!running
        ? <button onClick={onStart} disabled={allPaid} className="btn-primary">
            <Play size={13} /> Auto Run
          </button>
        : <button onClick={onStop} className="btn-secondary" style={{ color: 'var(--negative)', borderColor: 'var(--negative)' }}>
            <Pause size={13} /> Pause
          </button>
      }
      <div className="flex items-center gap-3 ml-1">
        <span className="label">Speed</span>
        <input type="range" min={100} max={1500} step={100}
               value={speed} onChange={e => onSpeedChange(Number(e.target.value))}
               style={{ width: '80px' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {speed}ms
        </span>
      </div>
    </div>
  )
}