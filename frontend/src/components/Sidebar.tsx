import { CheckCircle2, Circle } from 'lucide-react'
import AgentSelector    from './AgentSelector'
import ScenarioSelector from './ScenarioSelector'
import MetricsPanel     from './MetricsPanel'
import type { useSimulation } from '../hooks/useSimulation'

interface Props { sim: ReturnType<typeof useSimulation> }

export default function Sidebar({ sim }: Props) {
  const scenarioPicked = !!sim.scenarioId
  const agentPicked    = !!sim.agentType
  const step           = !scenarioPicked ? 1 : !agentPicked ? 2 : 3

  return (
    <div className="space-y-3">

      {/* Step guide */}
      <div className="card p-4 space-y-2">
        <p className="label">Getting started</p>
        {[
          { n: 1, label: 'Choose a scenario', done: scenarioPicked },
          { n: 2, label: 'Select an agent',   done: agentPicked    },
          { n: 3, label: 'Run simulation',    done: false          },
        ].map(s => {
          const active = step === s.n
          return (
            <div key={s.n} className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                {s.done
                  ? <CheckCircle2 size={15} style={{ color: 'var(--positive)' }} />
                  : active
                    ? <div className="relative flex items-center justify-center">
                        <Circle size={15} style={{ color: 'var(--text-primary)' }} />
                        <span className="absolute inset-0 rounded-full pulse-dot"
                              style={{ border: '1.5px solid var(--text-primary)' }} />
                      </div>
                    : <Circle size={15} style={{ color: 'var(--border-strong)' }} />
                }
              </div>
              <span style={{
                fontSize: '12px',
                color:  s.done ? 'var(--text-muted)' : active ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: active ? 500 : 400,
                textDecoration: s.done ? 'line-through' : 'none',
              }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      <ScenarioSelector
        scenarioId={sim.scenarioId}
        seed={sim.seed}
        onChange={sim.setScenarioId}
        onSeedChange={sim.setSeed}
        onCustomApply={sim.applyCustomScenario}
      />

      <AgentSelector
        agentType={sim.agentType}
        epsilon={sim.epsilon}
        loss={sim.loss}
        onChange={sim.setAgentType}
      />

      {sim.state && <MetricsPanel state={sim.state} initialCash={12000} />}
    </div>
  )
}