import { useState, useRef } from 'react'
import { getState, resetSim, agentStep } from '../api'
import type { SimState, HistoryPoint } from '../types'

export function useSimulation() {
  const [state, setState] = useState<SimState | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(600)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    const s = await getState()
    setState(s)
    setHistory([{ day: s.day, cash: s.cash, reward: s.totalReward }])
  }

  const reset = async () => {
    stopAuto()
    const s = await resetSim(10000)
    setState(s)
    setHistory([{ day: 0, cash: s.cash, reward: 0 }])
  }

  const stepAgent = async () => {
    const { state: s } = await agentStep()
    setState(s)
    setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
  }

  const startAuto = () => {
    setRunning(true)
    intervalRef.current = setInterval(async () => {
      const { state: s } = await agentStep()
      setState(s)
      setHistory(h => [...h, { day: s.day, cash: s.cash, reward: s.totalReward }])
      if (s.invoices.every(i => i.paid)) stopAuto()
    }, speed)
  }

  const stopAuto = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  return { state, history, running, speed, setSpeed, load, reset, stepAgent, startAuto, stopAuto }
}