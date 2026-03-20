import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { HistoryPoint } from '../types'

interface Props {
  history: HistoryPoint[]
}

export default function Charts({ history }: Props) {
  const tooltipStyle = { background: '#111827', border: '1px solid #374151', fontSize: 12 }
  const tickStyle = { fontSize: 11 }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
      <div>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Cash over time</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" stroke="#4b5563" tick={tickStyle} />
            <YAxis stroke="#4b5563" tick={tickStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="cash" stroke="#4ade80" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Cumulative reward</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="day" stroke="#4b5563" tick={tickStyle} />
            <YAxis stroke="#4b5563" tick={tickStyle} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="reward" stroke="#f59e0b" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}