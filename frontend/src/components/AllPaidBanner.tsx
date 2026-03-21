interface Props { totalReward: number }

export default function AllPaidBanner({ totalReward }: Props) {
  return (
    <div className="card px-5 py-4 flex items-center gap-4 fade-in"
         style={{ borderLeft: '3px solid var(--color-positive)', borderRadius: '12px' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
           style={{ background: '#f0fdf4' }}>
        <span style={{ color: 'var(--color-positive)', fontSize: '14px' }}>✓</span>
      </div>
      <div>
        <p className="text-sm font-medium">All invoices settled</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          Final reward:{' '}
          <span style={{ fontFamily: 'var(--font-display)', color: totalReward >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
            {totalReward.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  )
}