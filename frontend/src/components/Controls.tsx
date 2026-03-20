interface Props {
  running: boolean
  allPaid: boolean
  speed: number
  onReset: () => void
  onStep: () => void
  onStart: () => void
  onStop: () => void
  onSpeedChange: (val: number) => void
}

export default function Controls({ running, allPaid, speed, onReset, onStep, onStart, onStop, onSpeedChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onReset}
        className="px-4 py-2 text-sm border border-gray-700 rounded hover:border-violet-500 hover:text-violet-300 transition-colors"
      >
        ↺ Reset
      </button>
      <button
        onClick={onStep}
        disabled={running || allPaid}
        className="px-4 py-2 text-sm border border-gray-700 rounded hover:border-violet-500 hover:text-violet-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Step Agent
      </button>
      {!running ? (
        <button
          onClick={onStart}
          disabled={allPaid}
          className="px-4 py-2 text-sm bg-violet-700 border border-violet-500 rounded hover:bg-violet-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-white"
        >
          ▶ Auto Run
        </button>
      ) : (
        <button
          onClick={onStop}
          className="px-4 py-2 text-sm bg-red-900 border border-red-700 rounded hover:bg-red-800 transition-colors text-white"
        >
          ⏸ Pause
        </button>
      )}
      <div className="flex items-center gap-3 text-sm text-gray-400 ml-2">
        <span>Speed</span>
        <input
          type="range" min={100} max={1500} step={100}
          value={speed}
          onChange={e => onSpeedChange(Number(e.target.value))}
          className="w-28 accent-violet-500"
        />
        <span className="w-14 text-gray-300">{speed}ms</span>
      </div>
    </div>
  )
}