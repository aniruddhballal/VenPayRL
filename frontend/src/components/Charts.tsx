import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { HistoryPoint } from '../types'

interface Props { history: HistoryPoint[] }

const tooltipStyle = {
  background: '#fff', border: '1px solid #E8E5DF',
  borderRadius: '8px', fontSize: 12, fontFamily: 'Inter, sans-serif',
  boxShadow: '0 4px 16px rgba(26,25,22,0.08)',
}
const tick = { fontSize: 11, fill: '#A8A49C', fontFamily: 'Inter, sans-serif' }

export default function Charts({ history }: Props) {
  return (
    <div className="card p-5 space-y-5">
      <div>
        <p className="label mb-4">Cash over time</p>
        <ResponsiveContainer width="100%" height={145}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="2 4" stroke="#F0EEE9" />
            <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false}
                   label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#A8A49C' }} />
            <YAxis tick={tick} axisLine={false} tickLine={false}
                   label={{ value: '$', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10, fill: '#A8A49C' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="cash" stroke="var(--positive)" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <p className="label mb-4">Cumulative reward</p>
        <ResponsiveContainer width="100%" height={145}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="2 4" stroke="#F0EEE9" />
            <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false}
                   label={{ value: 'Day', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#A8A49C' }} />
            <YAxis tick={tick} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="reward" stroke="var(--text-primary)" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}