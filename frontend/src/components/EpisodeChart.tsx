import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import type { EpisodePoint } from '../types'

interface Props {
  data: EpisodePoint[]
  episodeCount: number
  trainingRunning: boolean
  onEpisodeCountChange: (n: number) => void
  onStartTraining: () => void
  agentType: string
}

export default function EpisodeChart({ data, episodeCount, trainingRunning, onEpisodeCountChange, onStartTraining, agentType }: Props) {
  const tooltipStyle = { background: '#111827', border: '1px solid #374151', fontSize: 12 }
  const tickStyle = { fontSize: 11 }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs uppercase tracking-widest text-gray-500">Training — Reward per Episode</h2>
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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="episode" stroke="#4b5563" tick={tickStyle} />
            <YAxis stroke="#4b5563" tick={tickStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="reward" stroke="#6366f1" dot={false} strokeWidth={1} strokeOpacity={0.5} name="Reward" />
            <Line type="monotone" dataKey="movingAvg" stroke="#f59e0b" dot={false} strokeWidth={2} name="Moving Avg (20)" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}