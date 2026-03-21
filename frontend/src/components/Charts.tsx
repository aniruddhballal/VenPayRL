import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { HistoryPoint } from '../types'

interface Props { history: HistoryPoint[] }

const tooltipStyle = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid #e8e8e8',
  borderRadius: '8px',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}
const tickStyle = { fontSize: 11, fill: '#a8a8a8', fontFamily: 'Inter, sans-serif' }

export default function Charts({ history }: Props) {
  return (
    <div className="card p-5 space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] mb-4"
           style={{ color: 'var(--color-text-muted)' }}>
          Cash over time
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false}
                   label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#a8a8a8' }} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false}
                   label={{ value: 'Cash', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#a8a8a8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="cash" stroke="#16a34a" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
        <p className="text-[11px] uppercase tracking-[0.08em] mb-4"
           style={{ color: 'var(--color-text-muted)' }}>
          Cumulative reward
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false}
                   label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#a8a8a8' }} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false}
                   label={{ value: 'Reward', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#a8a8a8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="reward" stroke="#0a0a0a" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}