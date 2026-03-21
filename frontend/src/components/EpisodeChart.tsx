import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
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
  episode:      number
  reward:       number
  movingAvg:    number
  finalCash:    number
  penalties:    number
  invoicesPaid: number
  x:            number
  y:            number
}

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #E8E5DF',
  borderRadius: '8px',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  boxShadow: '0 4px 16px rgba(26,25,22,0.08)',
}
const tick = { fontSize: 11, fill: '#A8A49C', fontFamily: 'Inter, sans-serif' }

export default function EpisodeChart({
  data, episodeCount, trainingRunning,
  onEpisodeCountChange, onStartTraining, agentType, rawResults = [],
}: Props) {
  const [popover, setPopover] = useState<PopoverData | null>(null)

  // detect convergence — first episode where moving avg stops improving
  // by more than 1% over the next 20 episodes
  const convergenceEp = (() => {
    if (data.length < 40) return null
    for (let i = 20; i < data.length - 20; i++) {
      const current = data[i]?.movingAvg ?? 0
      const ahead   = data[i + 20]?.movingAvg ?? 0
      const delta   = Math.abs(ahead - current)
      if (delta < Math.abs(current) * 0.01 + 0.5) return data[i]?.episode ?? null
    }
    return null
  })()

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          {data.length > 0 && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Click the chart to inspect any episode
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="label">Episodes</span>
            <input
              type="range" min={50} max={2000} step={50}
              value={episodeCount}
              onChange={e => onEpisodeCountChange(Number(e.target.value))}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', minWidth: '32px' }}>
              {episodeCount}
            </span>
          </div>
          <button
            onClick={onStartTraining}
            disabled={trainingRunning}
            className="btn-primary"
          >
            {trainingRunning ? 'Running' : `Run ${agentType}`}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Run training to see reward trend across episodes
          </p>
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
            <CartesianGrid strokeDasharray="2 4" stroke="#F0EEE9" />
            <XAxis dataKey="episode" tick={tick} axisLine={false} tickLine={false}
                   label={{ value: 'Episode', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#A8A49C' }} />
            <YAxis tick={tick} axisLine={false} tickLine={false}
                   label={{ value: 'Reward', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#A8A49C' }} />
            <RechartsTooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Inter, sans-serif' }} />
            <Line
              type="monotone" dataKey="reward"
              stroke="#D4D0C8" dot={false} strokeWidth={1}
              strokeOpacity={0.6} name="Reward"
            />
            <Line
              type="monotone" dataKey="movingAvg"
              stroke="var(--text-primary)" dot={false} strokeWidth={2}
              name="Moving Avg (20)"
              activeDot={{
                r: 5, fill: 'var(--text-primary)', stroke: '#fff', strokeWidth: 2,
                style: { cursor: 'pointer' },
              }}
            />
            {convergenceEp && (
              <ReferenceLine
                x={convergenceEp}
                stroke="var(--text-muted)"
                strokeDasharray="3 4"
                label={{
                  value: 'converged',
                  position: 'insideTopLeft',
                  fontSize: 10,
                  fill: 'var(--text-muted)',
                  offset: 6,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Episode popover */}
      {popover && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setPopover(null)} />
          <div
            className="fixed z-20 glass rounded-xl p-4"
            style={{ left: Math.min(popover.x + 12, window.innerWidth - 220), top: popover.y - 10, minWidth: '192px' }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Episode {popover.episode}
            </p>
            <div className="space-y-2">
              {[
                { label: 'Reward',        value: popover.reward.toFixed(1),        color: popover.reward >= 0 ? 'var(--positive)' : 'var(--negative)' },
                { label: 'Moving Avg',    value: popover.movingAvg.toFixed(1),     color: 'var(--text-primary)' },
                { label: 'Final Cash',    value: `$${popover.finalCash.toFixed(0)}`, color: 'var(--positive)' },
                { label: 'Penalties',     value: `$${popover.penalties.toFixed(0)}`, color: 'var(--negative)' },
                { label: 'Invoices Paid', value: String(popover.invoicesPaid),     color: 'var(--text-primary)' },
              ].map(row => (
                <div key={row.label} className="flex justify-between gap-6">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: row.color, fontFamily: 'var(--font-display)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPopover(null)}
              style={{ marginTop: '10px', width: '100%', fontSize: '11px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              dismiss
            </button>
          </div>
        </>
      )}
    </div>
  )
}