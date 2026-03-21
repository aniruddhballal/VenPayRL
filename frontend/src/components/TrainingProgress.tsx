interface Props {
  episode: number
  total: number
  agentType: string
}

export default function TrainingProgress({ episode, total, agentType }: Props) {
  const pct = total > 0 ? Math.round((episode / total) * 100) : 0

  return (
    <div className="bg-gray-900 border border-violet-800 rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Training {agentType} — episode {episode} of {total}</span>
        <span className="font-mono text-violet-300">{pct}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}