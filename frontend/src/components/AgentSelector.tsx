import type { AgentType } from '../types'

interface Props {
  agentType: AgentType
  epsilon:   number
  loss:      number
  onChange:  (a: AgentType) => void
}

const agents: { value: AgentType; label: string; description: string }[] = [
  { value: 'rule',      label: 'Rule-based',  description: 'Urgency-sorted, deterministic'       },
  { value: 'random',    label: 'Random',      description: 'Untrained baseline'                  },
  { value: 'heuristic', label: 'Heuristic',   description: 'Penalty ÷ deadline urgency score'    },
  { value: 'qtable',    label: 'Q-Table',     description: 'Tabular RL, learns over episodes'    },
  { value: 'dqn',       label: 'DQN',         description: 'Neural network function approximation' },
]

export default function AgentSelector({ agentType, epsilon, loss, onChange }: Props) {
  const showEpsilon = agentType === 'qtable' || agentType === 'dqn'
  const showLoss    = agentType === 'dqn'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Agent</h2>
      <div className="flex flex-col gap-2">
        {agents.map(a => (
          <button
            key={a.value}
            onClick={() => onChange(a.value)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
              agentType === a.value
                ? 'border-violet-500 bg-violet-950 text-violet-300'
                : 'border-gray-700 hover:border-gray-600 text-gray-400'
            }`}
          >
            <div className="text-sm font-semibold">{a.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
          </button>
        ))}
      </div>

      {showEpsilon && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          <div className="text-xs text-gray-500">
            <div className="flex justify-between mb-1">
              <span>ε (exploration)</span>
              <span className="text-amber-400 font-mono">{epsilon.toFixed(3)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${epsilon * 100}%` }} />
            </div>
          </div>
          {showLoss && (
            <div className="text-xs text-gray-500 flex justify-between">
              <span>Loss</span>
              <span className="text-rose-400 font-mono">{loss.toFixed(4)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}