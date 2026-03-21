import { useState } from 'react'
import EpisodeChart from './EpisodeChart'
import DQNPanel from './DQNPanel'
import BenchmarkTable from './BenchmarkTable'
import ScenarioDashboard from './ScenarioDashboard'
import HyperparamSweep from './HyperparamSweep'
import HealthCheck from './HealthCheck'
import ExportButton from './ExportButton'
import type { useSimulation } from '../hooks/useSimulation'

interface Props { sim: ReturnType<typeof useSimulation> }

function Section({
  title, hint, children, defaultOpen = false
}: {
  title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#fafafa]"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </span>
          {hint && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
              {hint}
            </span>
          )}
        </div>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 200ms ease' }}>
          ▼
        </span>
      </button>
      <div className={`accordion-content ${open ? 'open' : 'closed'}`}>
        <div className="px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function AnalysisPanel({ sim }: Props) {
  const isDqn = sim.agentType === 'dqn'
  const hasRun = sim.state!.log.length > 0 || sim.episodeData.length > 0

  return (
    <div className="space-y-3">

      {/* Contextual nudge after simulation */}
      {hasRun && sim.benchmarkResults.length === 0 && (
        <div className="card p-4 flex items-center gap-4 fade-in"
          style={{ borderLeft: '3px solid #0a0a0a' }}>
          <div className="shrink-0 w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <span className="text-white text-xs">→</span>
          </div>
          <div>
            <p className="text-sm font-medium">Ready to benchmark?</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Expand the benchmark panel below to compare all agents across all scenarios.
            </p>
          </div>
        </div>
      )}

      <Section
        title={isDqn ? 'DQN Training' : 'Episode Training'}
        hint={isDqn ? 'Neural network' : 'Q-table'}
        defaultOpen={true}
      >
        {isDqn ? (
          <DQNPanel
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
        ) : (
          <EpisodeChart
            data={sim.episodeData}
            episodeCount={sim.episodeCount}
            trainingRunning={sim.trainingRunning}
            onEpisodeCountChange={sim.setEpisodeCount}
            onStartTraining={sim.startTraining}
            agentType={sim.agentType}
            rawResults={sim.rawEpisodeResults}
          />
        )}
      </Section>

      <Section title="Benchmark" hint="All agents × all scenarios">
        <BenchmarkTable
          results={sim.benchmarkResults}
          experimentRunning={sim.experimentRunning}
          seeds={sim.experimentSeeds}
          trainingEpisodes={sim.episodeCount}
          onSeedsChange={sim.setExperimentSeeds}
          onRun={sim.startExperiment}
        />
        {sim.benchmarkResults.length > 0 && (
          <div className="mt-4">
            <ScenarioDashboard results={sim.benchmarkResults} />
          </div>
        )}
      </Section>

      <Section title="Hyperparameter Sweep" hint="Q-table · DQN">
        <HyperparamSweep
          sweepResults={sim.sweepResults}
          sweepRunning={sim.sweepRunning}
          scenarioId={sim.scenarioId}
          onRun={sim.startSweep}
        />
      </Section>

      <Section title="Health Check" hint="Pre-demo sanity check">
        <HealthCheck
          results={sim.healthResults}
          running={sim.healthRunning}
          onRun={sim.startHealthCheck}
        />
      </Section>

      <ExportButton
        benchmarkResults={sim.benchmarkResults}
        episodeData={sim.episodeData}
      />

    </div>
  )
}