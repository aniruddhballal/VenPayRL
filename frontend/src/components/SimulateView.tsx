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

export default function SimulateView({ sim }: Props) {
  const allPaid    = sim.state!.invoices.every(i => i.paid)
  const isLearning = sim.agentType === 'qtable' || sim.agentType === 'dqn'
  const needsTrain = isLearning && sim.episodeData.length === 0 && sim.dqnEpisodeData.length === 0

  return (
    <div className="space-y-3">

      {/* Problem context — always visible */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: '8px' }}>
              Vendor Payment Scheduler
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '520px' }}>
              An agent manages a company's cash balance against a set of vendor invoices.
              Each day it decides — pay in full, pay partially, or delay.
              Delays compound into penalties. The goal is to settle all invoices
              while maximising the reward signal.
            </p>
          </div>
          <div className="shrink-0 flex gap-4">
            {[
              { label: 'Actions',   value: '3', sub: 'per invoice'   },
              { label: 'Agents',    value: '5', sub: 'to compare'    },
              { label: 'Scenarios', value: '5', sub: 'environments'  },
            ].map(s => (
              <div key={s.label} className="text-center" style={{ minWidth: '56px' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--text-primary)', lineHeight: 1 }}>
                  {s.value}
                </p>
                <p className="label mt-1">{s.label}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Training nudge */}
      {needsTrain && !sim.trainingRunning && (
        <div className="card-bordered px-5 py-3.5 flex items-center gap-3 fade-up"
             style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--warning)' }}>
          <Zap size={15} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Train this agent first
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              Switch to Analyse mode to run training before simulating.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <Controls
        running={sim.running} allPaid={allPaid} speed={sim.speed}
        onReset={sim.reset} onStep={sim.stepAgent}
        onStart={sim.startAuto} onStop={sim.stopAuto}
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

      {/* Invoices + Charts side by side */}
      <div className="grid grid-cols-2 gap-3">
        <InvoiceTable invoices={sim.state!.invoices} />
        <Charts history={sim.history} />
      </div>

      {/* Heatmap — only after actions exist */}
      {sim.actionHistory.length > 0 && (
        <ActionHeatmap
          invoices={sim.state!.invoices}
          actionHistory={sim.actionHistory}
        />
      )}

      {/* Action log — only after log has entries */}
      {sim.state!.log.length > 0 && (
        <ActionLog log={sim.state!.log} />
      )}

    </div>
  )
}