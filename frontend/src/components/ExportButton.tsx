import type { BenchmarkResult, EpisodePoint } from '../types'

interface Props { benchmarkResults: BenchmarkResult[]; episodeData: EpisodePoint[] }

function downloadCSV(rows: string[][], filename: string) {
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  a.click(); URL.revokeObjectURL(a.href)
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  a.click(); URL.revokeObjectURL(a.href)
}

export default function ExportButton({ benchmarkResults, episodeData }: Props) {
  const hasData = benchmarkResults.length > 0 || episodeData.length > 0
  if (!hasData) return null

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    height: '32px', padding: '0 12px', borderRadius: '8px',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    border: '1px solid var(--color-border)',
    background: 'white', color: 'var(--color-text-secondary)',
    transition: 'all 150ms ease',
  }

  return (
    <div className="flex gap-2 justify-end">
      {episodeData.length > 0 && (
        <button style={btnStyle}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                onClick={() => {
                  const rows = [['episode', 'reward', 'movingAvg'], ...episodeData.map(e => [String(e.episode), String(e.reward), String(e.movingAvg)])]
                  downloadCSV(rows, 'venpayrl_episodes.csv')
                }}>
          ↓ Episodes CSV
        </button>
      )}
      {benchmarkResults.length > 0 && (
        <button style={btnStyle}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                onClick={() => {
                  const rows = [['scenario', 'agent', 'avgReward', 'stdReward', 'avgFinalCash', 'avgPenalties', 'winner'],
                    ...benchmarkResults.flatMap(b => b.stats.map(s => [b.scenarioId, s.agentType, String(s.avgReward), String(s.stdReward), String(s.avgFinalCash), String(s.avgPenalties), String(s.winner)]))]
                  downloadCSV(rows, 'venpayrl_benchmark.csv')
                }}>
          ↓ Benchmark CSV
        </button>
      )}
      <button style={btnStyle}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              onClick={() => downloadJSON({ benchmarkResults, episodeData }, 'venpayrl_export.json')}>
        ↓ Full JSON
      </button>
    </div>
  )
}