interface Props { episode: number; total: number; agentType: string }

export default function TrainingProgress({ episode, total, agentType }: Props) {
  const pct = total > 0 ? Math.round((episode / total) * 100) : 0
  return (
    <div className="card-bordered px-5 py-4 space-y-2.5 fade-up">
      <div className="flex justify-between items-center">
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
          Training {agentType}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {episode} / {total}
        </span>
      </div>
      <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--text-primary)', transition: 'width 300ms ease', borderRadius: '2px' }} />
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        {pct}% — reward preview updating live
      </p>
    </div>
  )
}