interface Props {
  totalReward: number
}

export default function AllPaidBanner({ totalReward }: Props) {
  return (
    <div className="bg-emerald-950 border border-emerald-700 rounded-lg px-5 py-3 text-emerald-400 text-center text-sm">
      ✅ All invoices settled — Final reward: <strong>{totalReward.toFixed(2)}</strong>
    </div>
  )
}