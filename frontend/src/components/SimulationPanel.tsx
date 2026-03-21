import Controls from './Controls'
import AllPaidBanner from './AllPaidBanner'
import InvoiceTable from './InvoiceTable'
import Charts from './Charts'
import ActionHeatmap from './ActionHeatmap'
import ActionLog from './ActionLog'
import TrainingProgress from './TrainingProgress'
import type { useSimulation } from '../hooks/useSimulation'

interface Props { sim: ReturnType<typeof useSimulation> }

export default function SimulationPanel({ sim }: Props) {
  const allPaid = sim.state!.invoices.every(i => i.paid)
  const isLearning = sim.agentType === 'qtable' || sim.agentType === 'dqn'
  const needsTraining = isLearning && sim.episodeData.length === 0 && sim.dqnEpisodeData.length === 0

  return (
    <div className="space-y-4">
      {/* Training hint for learning agents */}
      {needsTraining && !sim.trainingRunning && (
        <div className="card p-4 flex items-center gap-4 fade-in"
          style={{ borderLeft: '3px solid var(--color-warning)', borderRadius: '12px' }}>
          <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#fef3c7' }}>
            <span style={{ color: 'var(--color-warning)', fontSize: '14px' }}>⚡</span>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Train before simulating
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              This agent learns over episodes. Scroll down to the training panel and run it first for best results.
            </p>
          </div>
        </div>
      )}

      <Controls
        running={sim.running}
        allPaid={allPaid}
        speed={sim.speed}
        onReset={sim.reset}
        onStep={sim.stepAgent}
        onStart={sim.startAuto}
        onStop={sim.stopAuto}
        onSpeedChange={sim.setSpeed}
      />

      {sim.trainingRunning && sim.streamProgress && (
        <TrainingProgress
          episode={sim.streamProgress.episode}
          total={sim.streamProgress.total}
          agentType={sim.agentType}
        />
      )}

      {allPaid && <AllPaidBanner totalReward={sim.state!.totalReward} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <InvoiceTable invoices={sim.state!.invoices} />
        <Charts history={sim.history} />
      </div>

      {sim.actionHistory.length > 0 && (
        <ActionHeatmap invoices={sim.state!.invoices} actionHistory={sim.actionHistory} />
      )}

      {sim.state!.log.length > 0 && (
        <ActionLog log={sim.state!.log} />
      )}
    </div>
  )
}