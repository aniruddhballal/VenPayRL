import AgentSelector from './AgentSelector'
import ScenarioSelector from './ScenarioSelector'
import MetricsPanel from './MetricsPanel'
import QConfigPanel from './QConfigPanel'
import type { useSimulation } from '../hooks/useSimulation'

interface Props { sim: ReturnType<typeof useSimulation> }

export default function Sidebar({ sim }: Props) {
  const step = !sim.scenarioId ? 1 : !sim.agentType ? 2 : 3

  return (
    <div className="w-72 shrink-0 space-y-3">
      {/* Step guide */}
      <div className="card p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-[0.08em]"
          style={{ color: 'var(--color-text-muted)' }}>
          Getting started
        </p>
        {[
          { n: 1, label: 'Choose a scenario' },
          { n: 2, label: 'Select an agent' },
          { n: 3, label: 'Run simulation' },
        ].map(s => (
          <div key={s.n} className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-5 h-5 rounded-full shrink-0"
              style={{
                background: step > s.n ? 'var(--color-accent)' : step === s.n ? 'transparent' : 'transparent',
                border: step > s.n ? 'none' : '1.5px solid',
                borderColor: step === s.n ? 'var(--color-accent)' : 'var(--color-border-strong)',
              }}>
              {step > s.n
                ? <span className="text-white text-[9px]">✓</span>
                : <span className="text-[10px]" style={{ color: step === s.n ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>{s.n}</span>
              }
              {step === s.n && (
                <span className="absolute inset-0 rounded-full border-2 border-black pulse-dot" />
              )}
            </div>
            <span className="text-sm" style={{
              color: step === s.n ? 'var(--color-text-primary)' : step > s.n ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
              fontWeight: step === s.n ? 500 : 400,
              textDecoration: step > s.n ? 'line-through' : 'none',
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <ScenarioSelector
        scenarioId={sim.scenarioId}
        seed={sim.seed}
        onChange={sim.setScenarioId}
        onSeedChange={sim.setSeed}
      />

      <AgentSelector
        agentType={sim.agentType}
        epsilon={sim.epsilon}
        loss={sim.loss}
        onChange={sim.setAgentType}
      />

      {sim.state && <MetricsPanel state={sim.state} initialCash={12000} />}

      {sim.agentType === 'qtable' && (
        <QConfigPanel config={sim.qConfig} onSave={sim.saveQConfig} />
      )}
    </div>
  )
}