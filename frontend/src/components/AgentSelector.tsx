import { Shuffle, Brain, Lightbulb, Table2, Network } from 'lucide-react'
import type { AgentType } from '../types'

interface Props { agentType: AgentType; epsilon: number; loss: number; onChange: (a: AgentType) => void }

const agents: { value: AgentType; label: string; tag: string; description: string; icon: React.ReactNode }[] = [
  { value: 'rule',      label: 'Rule-based',  tag: 'deterministic', description: 'Pays by due date order',            icon: <Table2   size={14} /> },
  { value: 'random',    label: 'Random',      tag: 'baseline',      description: 'Untrained baseline',                icon: <Shuffle  size={14} /> },
  { value: 'heuristic', label: 'Heuristic',   tag: 'smart',         description: 'Penalty divided by deadline score', icon: <Lightbulb size={14} /> },
  { value: 'qtable',    label: 'Q-Table',     tag: 'learning',      description: 'Tabular reinforcement learning',    icon: <Brain    size={14} /> },
  { value: 'dqn',       label: 'DQN',         tag: 'neural',        description: 'Neural function approximation',     icon: <Network  size={14} /> },
]

export default function AgentSelector({ agentType, epsilon, loss, onChange }: Props) {
  return (
    <div className="card p-4">
      <p className="label mb-3">Agent</p>
      <div className="space-y-1.5">
        {agents.map(a => {
          const active = agentType === a.value
          return (
            <button key={a.value} onClick={() => onChange(a.value)}
                    className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150"
                    style={{
                      border: active ? '1.5px solid var(--text-primary)' : '1px solid var(--border)',
                      background: active ? 'var(--surface)' : 'transparent',
                    }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {a.icon}
                  <span style={{ fontSize: '13px', fontWeight: active ? 500 : 400 }}>{a.label}</span>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em',
                  padding: '2px 6px', borderRadius: '4px',
                  background: active ? 'var(--text-primary)' : 'var(--surface-raised)',
                  color: active ? '#fff' : 'var(--text-muted)',
                }}>
                  {a.tag}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {a.description}
              </p>
            </button>
          )
        })}
      </div>

      {(agentType === 'qtable' || agentType === 'dqn') && (
        <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="label">Epsilon</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--warning)' }}>
                {epsilon.toFixed(3)}
              </span>
            </div>
            <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${epsilon * 100}%`, height: '100%', background: 'var(--warning)', transition: 'width 400ms ease', borderRadius: '2px' }} />
            </div>
          </div>
          {agentType === 'dqn' && (
            <div className="flex justify-between items-center">
              <span className="label">Loss</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--negative)' }}>
                {loss.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}