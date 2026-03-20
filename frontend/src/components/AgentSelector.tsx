import type { AgentType } from '../types'

interface Props {
  agentType: AgentType
  epsilon: number
  onChange: (a: AgentType) => void
}

const agents: { value: AgentType; label: string; description: string }[] = [
  { value: 'rule', label: 'Rule-based', description: 'Pays by urgency, deterministic' },
  { value: 'random', label: 'Random', description: 'Random actions, baseline' },
  { value: 'qtable', label: 'Q-Table', description: 'Learns over episodes' },
]

export default function AgentSelector({ agentType, epsilon, onChange }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Agent</h2>
      <div className="flex flex-col gap-2">
        {agents.map(a => (
          <button
            key={a.value}
            onClick={() => onChange(a.value)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${agentType === a.value
                ? 'border-violet-500 bg-violet-950 text-violet-300'
                : 'border-gray-700 hover:border-gray-600 text-gray-400'
              }`}
          >
            <div className="text-sm font-semibold">{a.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
          </button>
        ))}
      </div>
      {agentType === 'qtable' && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
          <span>ε (exploration) </span>
          <span className="text-amber-400 font-mono">{epsilon.toFixed(3)}</span>
          <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${epsilon * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}