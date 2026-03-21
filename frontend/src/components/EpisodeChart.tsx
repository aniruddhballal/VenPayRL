import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import type { EpisodePoint, EpisodeResult } from '../types'

interface Props {
  data:                 EpisodePoint[]
  episodeCount:         number
  trainingRunning:      boolean
  onEpisodeCountChange: (n: number) => void
  onStartTraining:      () => void
  agentType:            string
  rawResults?:          EpisodeResult[]
}

interface PopoverData {
  episode:    number
  reward:     number
  movingAvg:  number
  finalCash:  number
  penalties:  number
  invoicesPaid: number
  x:          number
  y:          number
}

const tooltipStyle = { background: '#111827', border: '1px solid #374151', fontSize: 12 }
const tickStyle    = { fontSize: 11 }

export default function EpisodeChart({
  data, episodeCount, trainingRunning,
  onEpisodeCountChange, onStartTraining, agentType, rawResults = [],
}: Props) {
  const [popover, setPopover] = useState<PopoverData | null>(null)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 relative">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xs uppercase tracking-widest text-gray-500">
          Training — Reward per Episode
          {data.length > 0 && <span className="ml-2 text-gray-700 normal-case">(click a dot for details)</span>}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Episodes</span>
            <input
              type="range" min={50} max={2000} step={50}
              value={episodeCount}
              onChange={e => onEpisodeCountChange(Number(e.target.value))}
              className="w-24 accent-violet-500"
            />
            <span className="font-mono text-gray-300 w-10">{episodeCount}</span>
          </div>
          <button
            onClick={onStartTraining}
            disabled={trainingRunning}
            className="px-3 py-1.5 text-xs bg-violet-700 border border-violet-500 rounded hover:bg-violet-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white"
          >
            {trainingRunning ? 'Running...' : `Run ${agentType}`}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
          Run training to see reward trend across episodes
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={data}
            onClick={(chartData) => {
              const d = chartData as any
              if (!d?.activePayload?.[0]?.payload) return
              const point = d.activePayload[0].payload as EpisodePoint
              const raw   = rawResults.find(r => r.episode === point.episode)
              if (!raw) return
              setPopover({
                episode:      point.episode,
                reward:       point.reward,
                movingAvg:    point.movingAvg,
                finalCash:    raw.metrics.finalCash,
                penalties:    raw.metrics.totalPenalties,
                invoicesPaid: raw.metrics.invoicesPaid,
                x:            window.innerWidth / 2 - 110,
                y:            window.innerHeight / 2 - 120,
              })
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="episode"
              stroke="#4b5563"
              tick={tickStyle}
              label={{ value: 'Episode', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#4b5563' }}
            />
            <YAxis
              stroke="#4b5563"
              tick={tickStyle}
              label={{ value: 'Reward', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#4b5563' }}
            />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone" dataKey="reward"
              stroke="#6366f1" dot={false} strokeWidth={1} strokeOpacity={0.5} name="Reward"
            />
            <Line
              type="monotone"
              dataKey="movingAvg"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={2}
              name="Moving Avg (20)"
              activeDot={{ r: 5, fill: '#f59e0b', stroke: '#111827', strokeWidth: 1.5, style: { cursor: 'pointer' } }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Popover */}
      {popover && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPopover(null)} />
          <div
            className="fixed z-20 bg-gray-900 border border-violet-700 rounded-xl p-4 shadow-xl min-w-48"
            style={{ left: Math.min(popover.x + 12, window.innerWidth - 220), top: popover.y - 10 }}
          >
            <div className="text-xs text-violet-400 font-semibold mb-3 uppercase tracking-wider">
              Episode {popover.episode}
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Reward',       value: popover.reward.toFixed(1),     color: 'text-amber-400'   },
                { label: 'Moving Avg',   value: popover.movingAvg.toFixed(1),  color: 'text-yellow-300'  },
                { label: 'Final Cash',   value: `$${popover.finalCash.toFixed(0)}`, color: 'text-green-400' },
                { label: 'Penalties',    value: `$${popover.penalties.toFixed(0)}`, color: 'text-red-400'   },
                { label: 'Invoices Paid', value: String(popover.invoicesPaid),  color: 'text-teal-400'    },
              ].map(row => (
                <div key={row.label} className="flex justify-between gap-6">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={`font-mono font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPopover(null)}
              className="mt-3 w-full text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              dismiss
            </button>
          </div>
        </>
      )}
    </div>
  )
}