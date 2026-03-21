import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts'
import type { BenchmarkResult, AgentType } from '../types'

interface Props {
  results: BenchmarkResult[]
}

const agentColors: Record<AgentType, string> = {
  rule: '#60a5fa',
  random: '#6b7280',
  heuristic: '#2dd4bf',
  qtable: '#a78bfa',
  dqn: '#f472b6',
}

const agentLabels: Record<AgentType, string> = {
  rule: 'Rule',
  random: 'Random',
  heuristic: 'Heuristic',
  qtable: 'Q-Table',
  dqn: 'DQN',
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-2 text-xs space-y-1">
      <div className="text-gray-400 mb-1 capitalize">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: agentColors[p.name as AgentType] }}>
            {agentLabels[p.name as AgentType] ?? p.name}
          </span>
          <span className="text-gray-200 font-mono">{p.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScenarioDashboard({ results }: Props) {
  if (results.length === 0) return null

  // Reshape for grouped bar: one entry per scenario, each agent as a key
  const chartData = results.map(r => {
    const entry: Record<string, number | string> = { scenario: r.scenarioId.replace('-', ' ') }
    for (const s of r.stats) entry[s.agentType] = s.avgReward
    return entry
  })

  const agentTypes = results[0]?.stats.map(s => s.agentType) ?? []

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">
        Scenario Dashboard — Avg Reward by Agent
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="25%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="scenario" stroke="#4b5563" tick={{ fontSize: 11 }} />
          <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={val => agentLabels[val as AgentType] ?? val}
            wrapperStyle={{ fontSize: 11 }}
          />
          {agentTypes.map(at => (
            <Bar key={at} dataKey={at} fill={agentColors[at]} radius={[2, 2, 0, 0]}>
              {chartData.map((_entry, i) => {
                const scenarioResult = results[i]
                const stat = scenarioResult?.stats.find(s => s.agentType === at)
                return (
                  <Cell
                    key={i}
                    fill={agentColors[at]}
                    opacity={stat?.winner ? 1 : 0.55}
                    stroke={stat?.winner ? '#fff' : 'none'}
                    strokeWidth={stat?.winner ? 1.5 : 0}
                  />
                )
              })}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}