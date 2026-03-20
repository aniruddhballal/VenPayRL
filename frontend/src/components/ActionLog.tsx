import type { LogEntry } from '../types'

interface Props {
  log: LogEntry[]
}

const borderColor: Record<string, string> = {
  FULL_PAY: 'border-emerald-500',
  PARTIAL_PAY: 'border-amber-500',
  DELAYED: 'border-red-400',
  OVERDUE: 'border-red-700',
}

export default function ActionLog({ log }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Action log</h2>
      <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
        {[...log].reverse().map((entry, i) => (
          <div
            key={i}
            className={`flex gap-4 items-center text-xs px-3 py-2 rounded border-l-2 bg-gray-950 ${borderColor[entry.action] ?? 'border-gray-700'}`}
          >
            <span className="text-gray-600 w-12 shrink-0">Day {entry.day}</span>
            <span className="text-violet-400 w-24 shrink-0">{entry.vendor}</span>
            <span className="font-semibold w-24 shrink-0">{entry.action}</span>
            <span className="text-gray-400 w-16 shrink-0">${entry.amount}</span>
            <span className={parseFloat(entry.reward) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {parseFloat(entry.reward) >= 0 ? '+' : ''}{parseFloat(entry.reward).toFixed(1)} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}