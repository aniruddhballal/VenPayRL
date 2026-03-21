import { CheckCircle2 } from 'lucide-react'

interface Props { totalReward: number }

export default function AllPaidBanner({ totalReward }: Props) {
  return (
    <div className="card-bordered px-5 py-4 flex items-center gap-4 fade-up"
         style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--positive)' }}>
      <CheckCircle2 size={20} style={{ color: 'var(--positive)', flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
          All invoices settled
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Final reward:{' '}
          <span style={{ fontFamily: 'var(--font-display)', color: totalReward >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            {totalReward.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  )
}