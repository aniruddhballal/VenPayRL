import { useEffect } from 'react'
import { useSimulation } from './hooks/useSimulation'
import LoadingScreen     from './components/LoadingScreen'
import Header            from './components/Header'
import Controls          from './components/Controls'
import AllPaidBanner     from './components/AllPaidBanner'
import InvoiceTable      from './components/InvoiceTable'
import Charts            from './components/Charts'
import ActionLog         from './components/ActionLog'
import AgentSelector     from './components/AgentSelector'
import ScenarioSelector  from './components/ScenarioSelector'
import MetricsPanel      from './components/MetricsPanel'
import EpisodeChart      from './components/EpisodeChart'
import BenchmarkTable    from './components/BenchmarkTable'
import QConfigPanel      from './components/QConfigPanel'
import ExportButton      from './components/ExportButton'

export default function App() {
  const sim = useSimulation()

  useEffect(() => { sim.load() }, [])

  if (!sim.state) return <LoadingScreen />

  const allPaid     = sim.state.invoices.every(i => i.paid)
  const initialCash = 10000

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-mono p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <Header state={sim.state} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <AgentSelector
              agentType={sim.agentType}
              epsilon={sim.epsilon}
              onChange={sim.setAgentType}
            />
            <ScenarioSelector
              scenarioId={sim.scenarioId}
              seed={sim.seed}
              onChange={sim.setScenarioId}
              onSeedChange={sim.setSeed}
            />
            <MetricsPanel
              state={sim.state}
              initialCash={initialCash}
            />
            {sim.agentType === 'qtable' && (
              <QConfigPanel
                config={sim.qConfig}
                onSave={sim.saveQConfig}
              />
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
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
            {allPaid && <AllPaidBanner totalReward={sim.state.totalReward} />}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <InvoiceTable invoices={sim.state.invoices} />
              <Charts history={sim.history} />
            </div>
            <EpisodeChart
              data={sim.episodeData}
              episodeCount={sim.episodeCount}
              trainingRunning={sim.trainingRunning}
              onEpisodeCountChange={sim.setEpisodeCount}
              onStartTraining={sim.startTraining}
              agentType={sim.agentType}
            />
            <BenchmarkTable
              results={sim.benchmarkResults}
              experimentRunning={sim.experimentRunning}
              seeds={sim.experimentSeeds}
              trainingEpisodes={sim.episodeCount}
              onSeedsChange={sim.setExperimentSeeds}
              onRun={sim.startExperiment}
            />
            <ExportButton
              benchmarkResults={sim.benchmarkResults}
              episodeData={sim.episodeData}
            />
            <ActionLog log={sim.state.log} />
          </div>

        </div>
      </div>
    </div>
  )
}