import { Download } from 'lucide-react'
import type { BenchmarkResult, EpisodePoint } from '../types'

interface Props { benchmarkResults: BenchmarkResult[]; episodeData: EpisodePoint[] }

function dl(data: unknown, filename: string, type = 'application/json') {
  const content = type === 'text/csv'
    ? (data as string[][]).map(r => r.join(',')).join('\n')
    : JSON.stringify(data, null, 2)
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type })),
    download: filename,
  })
  a.click(); URL.revokeObjectURL(a.href)
}

export default function ExportButton({ benchmarkResults, episodeData }: Props) {
  if (!benchmarkResults.length && !episodeData.length) return null

  return (
    <div className="flex gap-2 justify-end">
      {episodeData.length > 0 && (
        <button className="btn-ghost" onClick={() =>
          dl([['episode','reward','movingAvg'], ...episodeData.map(e => [e.episode, e.reward, e.movingAvg])], 'venpayrl_episodes.csv', 'text/csv')
        }>
          <Download size={13} /> Episodes CSV
        </button>
      )}
      {benchmarkResults.length > 0 && (
        <button className="btn-ghost" onClick={() =>
          dl([['scenario','agent','avgReward','stdReward','avgFinalCash','avgPenalties','winner'],
              ...benchmarkResults.flatMap(b => b.stats.map(s => [b.scenarioId, s.agentType, s.avgReward, s.stdReward, s.avgFinalCash, s.avgPenalties, s.winner]))
          ], 'venpayrl_benchmark.csv', 'text/csv')
        }>
          <Download size={13} /> Benchmark CSV
        </button>
      )}
      <button className="btn-ghost" onClick={() =>
        dl({ benchmarkResults, episodeData }, 'venpayrl_export.json')
      }>
        <Download size={13} /> Full JSON
      </button>
    </div>
  )
}