import type { BenchmarkResult, EpisodePoint } from '../types'

interface Props {
  benchmarkResults: BenchmarkResult[]
  episodeData: EpisodePoint[]
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ExportButton({ benchmarkResults, episodeData }: Props) {
  const exportBenchmarkCSV = () => {
    const rows: string[][] = [['scenario', 'agent', 'avgReward', 'stdReward', 'avgFinalCash', 'avgPenalties', 'winner']]
    for (const b of benchmarkResults) {
      for (const s of b.stats) {
        rows.push([b.scenarioId, s.agentType, String(s.avgReward), String(s.stdReward), String(s.avgFinalCash), String(s.avgPenalties), String(s.winner)])
      }
    }
    downloadCSV(rows, 'venpayrl_benchmark.csv')
  }

  const exportEpisodesCSV = () => {
    const rows: string[][] = [['episode', 'reward', 'movingAvg']]
    for (const e of episodeData) {
      rows.push([String(e.episode), String(e.reward), String(e.movingAvg)])
    }
    downloadCSV(rows, 'venpayrl_episodes.csv')
  }

  const exportJSON = () => {
    downloadJSON({ benchmarkResults, episodeData }, 'venpayrl_export.json')
  }

  const hasData = benchmarkResults.length > 0 || episodeData.length > 0

  if (!hasData) return null

  return (
    <div className="flex gap-2 justify-end">
      {episodeData.length > 0 && (
        <button
          onClick={exportEpisodesCSV}
          className="px-3 py-1.5 text-xs border border-gray-700 rounded hover:border-gray-500 text-gray-400 hover:text-gray-200 transition-colors"
        >
          ↓ Episodes CSV
        </button>
      )}
      {benchmarkResults.length > 0 && (
        <button
          onClick={exportBenchmarkCSV}
          className="px-3 py-1.5 text-xs border border-gray-700 rounded hover:border-gray-500 text-gray-400 hover:text-gray-200 transition-colors"
        >
          ↓ Benchmark CSV
        </button>
      )}
      <button
        onClick={exportJSON}
        className="px-3 py-1.5 text-xs border border-gray-700 rounded hover:border-gray-500 text-gray-400 hover:text-gray-200 transition-colors"
      >
        ↓ Full JSON
      </button>
    </div>
  )
}