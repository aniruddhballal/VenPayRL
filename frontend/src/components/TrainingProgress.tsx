interface Props { episode: number; total: number; agentType: string }

export default function TrainingProgress({ episode, total, agentType }: Props) {
  const pct = total > 0 ? Math.round((episode / total) * 100) : 0

  return (
    <div className="card px-5 py-4 space-y-2 fade-in">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Training {agentType}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          {episode} / {total}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: '#0a0a0a' }}
        />
      </div>
      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
        {pct}% complete — reward preview updating live
      </p>
    </div>
  )
}