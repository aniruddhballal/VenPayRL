import { Zap } from 'lucide-react'
import Controls         from './Controls'
import AllPaidBanner    from './AllPaidBanner'
import InvoiceTable     from './InvoiceTable'
import Charts           from './Charts'
import ActionHeatmap    from './ActionHeatmap'
import ActionLog        from './ActionLog'
import TrainingProgress from './TrainingProgress'
import type { useSimulation } from '../hooks/useSimulation'

interface Props { sim: ReturnType<typeof useSimulation> }

export default function SimulationPanel({ sim }: Props) {
  const allPaid    = sim.state!.invoices.every(i => i.paid)
  const isLearning = sim.agentType === 'qtable' || sim.agentType === 'dqn'
  const needsTrain = isLearning && sim.episodeData.length === 0 && sim.dqnEpisodeData.length === 0

  return (
    <div className="space-y-3">
      {needsTrain && !sim.trainingRunning && (
        <div className="card-bordered px-5 py-4 flex items-center gap-4 fade-up"
             style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--warning)' }}>
          <Zap size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Train before simulating
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              This agent learns over episodes. Open the training panel below and run it first.
            </p>
          </div>
        </div>
      )}

      <Controls
        running={sim.running} allPaid={allPaid} speed={sim.speed}
        onReset={sim.reset} onStep={sim.stepAgent}
        onStart={sim.startAuto} onStop={sim.stopAuto} onSpeedChange={sim.setSpeed}
      />

      {sim.trainingRunning && sim.streamProgress && (
        <TrainingProgress episode={sim.streamProgress.episode} total={sim.streamProgress.total} agentType={sim.agentType} />
      )}

      {allPaid && <AllPaidBanner totalReward={sim.state!.totalReward} />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
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