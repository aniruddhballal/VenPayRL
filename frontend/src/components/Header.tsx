import type { SimState } from '../types'

interface Props {
  state: SimState
}

export default function Header({ state }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
      <h1 className="text-2xl font-bold text-violet-400 tracking-widest uppercase">
        VenPayRL
      </h1>
      <div className="flex gap-6 text-sm text-gray-400">
        <span>Day <strong className="text-gray-100 text-base ml-1">{state.day}</strong></span>
        <span>Cash <strong className="text-green-400 text-base ml-1">${state.cash.toLocaleString()}</strong></span>
        <span>Reward <strong className={`text-base ml-1 ${state.totalReward >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
          {state.totalReward.toFixed(1)}
        </strong></span>
      </div>
    </div>
  )
}