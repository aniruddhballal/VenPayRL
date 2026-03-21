import { ArrowRight, CheckCircle2 } from 'lucide-react'
import EpisodeChart      from './EpisodeChart'
import DQNPanel          from './DQNPanel'
import QConfigPanel      from './QConfigPanel'
import BenchmarkTable    from './BenchmarkTable'
import ScenarioDashboard from './ScenarioDashboard'
import HyperparamSweep   from './HyperparamSweep'
import HealthCheck       from './HealthCheck'
import ExportButton      from './ExportButton'
import type { useSimulation } from '../hooks/useSimulation'

interface Props { sim: ReturnType<typeof useSimulation> }

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {hint && (
        <span style={{
          fontSize: '10px', fontWeight: 500, padding: '2px 7px',
          borderRadius: '20px', background: 'var(--surface-raised)',
          color: 'var(--text-muted)', border: '1px solid var(--border)',
          letterSpacing: '0.04em',
        }}>
          {hint}
        </span>
      )}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
}

export default function AnalyseView({ sim }: Props) {
  const isDqn     = sim.agentType === 'dqn'
  const hasResult = sim.benchmarkResults.length > 0

  return (
    <div className="space-y-3">

      {/* Q / DQN config — top of analyse, not in sidebar */}
      {(sim.agentType === 'qtable' || sim.agentType === 'dqn') && (
        <div className="card p-5">
          <SectionHeader
            title={isDqn ? 'DQN Configuration' : 'Q-Table Configuration'}
            hint={isDqn ? 'neural' : 'tabular'}
          />
          <QConfigPanel config={sim.qConfig} onSave={sim.saveQConfig} />
        </div>
      )}

      {/* Training */}
      <div className="card p-5">
        <SectionHeader
          title={isDqn ? 'DQN Training' : 'Episode Training'}
          hint={isDqn ? 'neural' : 'q-table'}
        />
        {isDqn
          ? <DQNPanel
              data={sim.dqnEpisodeData}
              episodeCount={sim.episodeCount}
              trainingRunning={sim.trainingRunning}
              config={sim.dqnConfig}
              epsilon={sim.epsilon}
              loss={sim.loss}
              onEpisodeCountChange={sim.setEpisodeCount}
              onStartTraining={sim.startTraining}
              onSaveConfig={sim.saveDQNConfig}
            />
          : <EpisodeChart
              data={sim.episodeData}
              episodeCount={sim.episodeCount}
              trainingRunning={sim.trainingRunning}
              onEpisodeCountChange={sim.setEpisodeCount}
              onStartTraining={sim.startTraining}
              agentType={sim.agentType}
              rawResults={sim.rawEpisodeResults}
            />
        }
      </div>

      <Divider />

      {/* Benchmark nudge — context-aware */}
      {!hasResult ? (
        <div className="card-bordered px-5 py-3.5 flex items-center gap-3"
             style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--text-primary)' }}>
          <ArrowRight size={14} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Run the experiment below to compare all agents across all scenarios with stability analysis.
          </p>
        </div>
      ) : (
        <div className="card-bordered px-5 py-3.5 flex items-center gap-3"
             style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--positive)' }}>
          <CheckCircle2 size={14} style={{ color: 'var(--positive)', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Benchmark complete — results loaded. For demos, keep this page open
            so judges see results instantly without waiting for a re-run.
          </p>
        </div>
      )}

      {/* Benchmark */}
      <div className="card p-5">
        <SectionHeader title="Benchmark" hint="all agents × all scenarios" />
        <BenchmarkTable
          results={sim.benchmarkResults}
          experimentRunning={sim.experimentRunning}
          seeds={sim.experimentSeeds}
          trainingEpisodes={sim.episodeCount}
          onSeedsChange={sim.setExperimentSeeds}
          onRun={sim.startExperiment}
        />
        {hasResult && (
          <>
            <Divider />
            <div className="mt-4">
              <ScenarioDashboard results={sim.benchmarkResults} />
            </div>
          </>
        )}
      </div>

      <Divider />

      {/* Hyperparameter sweep */}
      <div className="card p-5">
        <SectionHeader title="Hyperparameter Sweep" hint="q-table · dqn" />
        <HyperparamSweep
          sweepResults={sim.sweepResults}
          sweepRunning={sim.sweepRunning}
          scenarioId={sim.scenarioId}
          onRun={sim.startSweep}
        />
      </div>

      <Divider />

      {/* Health check */}
      <div className="card p-5">
        <SectionHeader title="Health Check" hint="pre-demo" />
        <HealthCheck
          results={sim.healthResults}
          running={sim.healthRunning}
          onRun={sim.startHealthCheck}
        />
      </div>

      {/* Export */}
      <div className="pt-1">
        <ExportButton
          benchmarkResults={sim.benchmarkResults}
          episodeData={sim.episodeData}
        />
      </div>

    </div>
  )
}