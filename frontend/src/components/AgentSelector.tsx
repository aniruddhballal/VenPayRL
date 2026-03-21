import type { AgentType } from '../types'

interface Props { agentType: AgentType; epsilon: number; loss: number; onChange: (a: AgentType) => void }

const agents: { value: AgentType; label: string; tag: string; description: string }[] = [
  { value: 'rule',      label: 'Rule-based',  tag: 'deterministic', description: 'Pays by due date order' },
  { value: 'random',    label: 'Random',      tag: 'baseline',      description: 'Untrained baseline' },
  { value: 'heuristic', label: 'Heuristic',   tag: 'smart',         description: 'Penalty ÷ deadline score' },
  { value: 'qtable',    label: 'Q-Table',     tag: 'learning',      description: 'Tabular reinforcement learning' },
  { value: 'dqn',       label: 'DQN',         tag: 'neural',        description: 'Neural function approximation' },
]

export default function AgentSelector({ agentType, epsilon, loss, onChange }: Props) {
  return (
    <div className="card p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] mb-4"
         style={{ color: 'var(--color-text-muted)' }}>
        Agent
      </p>
      <div className="space-y-2">
        {agents.map(a => {
          const active = agentType === a.value
          return (
            <button
              key={a.value}
              onClick={() => onChange(a.value)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150"
              style={{
                border: active ? '2px solid #0a0a0a' : '1px solid var(--color-border)',
                background: active ? '#fafafa' : 'white',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {a.label}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: active ? '#0a0a0a' : 'var(--color-surface-raised)', color: active ? 'white' : 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                  {a.tag}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {a.description}
              </p>
            </button>
          )
        })}
      </div>

      {(agentType === 'qtable' || agentType === 'dqn') && (
        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] uppercase tracking-[0.06em]"
                    style={{ color: 'var(--color-text-muted)' }}>
                ε Exploration
              </span>
              <span className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}>
                {epsilon.toFixed(3)}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${epsilon * 100}%`, background: 'var(--color-warning)' }} />
            </div>
          </div>
          {agentType === 'dqn' && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-[0.06em]"
                    style={{ color: 'var(--color-text-muted)' }}>
                Loss
              </span>
              <span className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-negative)' }}>
                {loss.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}