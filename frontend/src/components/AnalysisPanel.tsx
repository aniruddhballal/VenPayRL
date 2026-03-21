import { useState } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import EpisodeChart      from './EpisodeChart'
import DQNPanel          from './DQNPanel'
import BenchmarkTable    from './BenchmarkTable'
import ScenarioDashboard from './ScenarioDashboard'
import HyperparamSweep   from './HyperparamSweep'
import HealthCheck       from './HealthCheck'
import ExportButton      from './ExportButton'
import type { useSimulation } from '../hooks/useSimulation'

interface Props { sim: ReturnType<typeof useSimulation> }

function Section({ title, hint, children, defaultOpen = false }: {
  title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card-bordered overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              style={{ background: open ? 'var(--surface)' : 'transparent' }}
              onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)' }}
              onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</span>
          {hint && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--surface-raised)', color: 'var(--text-muted)', fontWeight: 500 }}>
              {hint}
            </span>
          )}
        </div>
        <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }} />
      </button>
      <div className={`accordion-content ${open ? 'open' : 'closed'}`}>
        <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisPanel({ sim }: Props) {
  const isDqn  = sim.agentType === 'dqn'
  const hasRun = sim.state!.log.length > 0 || sim.episodeData.length > 0

  return (
    <div className="space-y-2">
      {hasRun && sim.benchmarkResults.length === 0 && (
        <div className="card-bordered px-5 py-4 flex items-center gap-4 fade-up"
             style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--text-primary)' }}>
          <ArrowRight size={15} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Ready to benchmark?</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Expand the benchmark panel to compare all agents across all scenarios.
            </p>
          </div>
        </div>
      )}

      <Section title={isDqn ? 'DQN Training' : 'Episode Training'} hint={isDqn ? 'neural' : 'q-table'} defaultOpen>
        {isDqn
          ? <DQNPanel data={sim.dqnEpisodeData} episodeCount={sim.episodeCount} trainingRunning={sim.trainingRunning}
                      config={sim.dqnConfig} epsilon={sim.epsilon} loss={sim.loss}
                      onEpisodeCountChange={sim.setEpisodeCount} onStartTraining={sim.startTraining} onSaveConfig={sim.saveDQNConfig} />
          : <EpisodeChart data={sim.episodeData} episodeCount={sim.episodeCount} trainingRunning={sim.trainingRunning}
                          onEpisodeCountChange={sim.setEpisodeCount} onStartTraining={sim.startTraining}
                          agentType={sim.agentType} rawResults={sim.rawEpisodeResults} />
        }
      </Section>

      <Section title="Benchmark" hint="all agents × all scenarios">
        <BenchmarkTable results={sim.benchmarkResults} experimentRunning={sim.experimentRunning}
                        seeds={sim.experimentSeeds} trainingEpisodes={sim.episodeCount}
                        onSeedsChange={sim.setExperimentSeeds} onRun={sim.startExperiment} />
        {sim.benchmarkResults.length > 0 && (
          <div className="mt-5"><ScenarioDashboard results={sim.benchmarkResults} /></div>
        )}
      </Section>

      <Section title="Hyperparameter Sweep" hint="q-table · dqn">
        <HyperparamSweep sweepResults={sim.sweepResults} sweepRunning={sim.sweepRunning}
                         scenarioId={sim.scenarioId} onRun={sim.startSweep} />
      </Section>

      <Section title="Health Check" hint="pre-demo">
        <HealthCheck results={sim.healthResults} running={sim.healthRunning} onRun={sim.startHealthCheck} />
      </Section>

      <div className="pt-1">
        <ExportButton benchmarkResults={sim.benchmarkResults} episodeData={sim.episodeData} />
      </div>
    </div>
  )
}