import type { ScenarioConfig } from './types'

export const scenarios: ScenarioConfig[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Standard starting point — reasonable cash, mixed deadlines',
    cash: 10000,
    invoices: [
      { vendor: 'Acme Corp',   amount: 2000, dueDate: 5,  penaltyRate: 0.05 },
      { vendor: 'BuildCo',     amount: 3500, dueDate: 8,  penaltyRate: 0.03 },
      { vendor: 'SupplyMax',   amount: 1500, dueDate: 12, penaltyRate: 0.08 },
      { vendor: 'TechVendors', amount: 4000, dueDate: 15, penaltyRate: 0.04 },
      { vendor: 'LogiTrans',   amount: 800,  dueDate: 20, penaltyRate: 0.06 },
    ],
  },
  {
    id: 'tight-cash',
    label: 'Tight Cash',
    description: 'Low cash relative to total invoices — every delay hurts',
    cash: 4000,
    invoices: [
      { vendor: 'Acme Corp',   amount: 2000, dueDate: 3,  penaltyRate: 0.07 },
      { vendor: 'BuildCo',     amount: 2500, dueDate: 6,  penaltyRate: 0.05 },
      { vendor: 'SupplyMax',   amount: 1800, dueDate: 10, penaltyRate: 0.09 },
      { vendor: 'TechVendors', amount: 3000, dueDate: 14, penaltyRate: 0.06 },
    ],
  },
  {
    id: 'high-penalty',
    label: 'High Penalty',
    description: 'Aggressive penalty rates — timing is everything',
    cash: 12000,
    invoices: [
      { vendor: 'Acme Corp',   amount: 1500, dueDate: 4,  penaltyRate: 0.15 },
      { vendor: 'BuildCo',     amount: 2000, dueDate: 7,  penaltyRate: 0.20 },
      { vendor: 'SupplyMax',   amount: 2500, dueDate: 9,  penaltyRate: 0.18 },
      { vendor: 'TechVendors', amount: 3000, dueDate: 13, penaltyRate: 0.12 },
      { vendor: 'LogiTrans',   amount: 1000, dueDate: 16, penaltyRate: 0.25 },
    ],
  },
  {
    id: 'many-invoices',
    label: 'Many Invoices',
    description: 'High invoice count — juggling many vendors at once',
    cash: 15000,
    invoices: [
      { vendor: 'Vendor A', amount: 800,  dueDate: 3,  penaltyRate: 0.05 },
      { vendor: 'Vendor B', amount: 1200, dueDate: 5,  penaltyRate: 0.04 },
      { vendor: 'Vendor C', amount: 900,  dueDate: 7,  penaltyRate: 0.07 },
      { vendor: 'Vendor D', amount: 1500, dueDate: 9,  penaltyRate: 0.06 },
      { vendor: 'Vendor E', amount: 2000, dueDate: 11, penaltyRate: 0.08 },
      { vendor: 'Vendor F', amount: 1100, dueDate: 13, penaltyRate: 0.05 },
      { vendor: 'Vendor G', amount: 1800, dueDate: 15, penaltyRate: 0.09 },
      { vendor: 'Vendor H', amount: 700,  dueDate: 18, penaltyRate: 0.03 },
    ],
  },
  {
    id: 'stochastic',
    label: 'Stochastic',
    description: 'Random late fee variance + daily cash inflow — noisy environment',
    cash: 8000,
    stochastic: true,
    lateFeeVariance: 0.2,
    cashInflowMean: 200,
    invoices: [
      { vendor: 'Acme Corp',   amount: 2000, dueDate: 5,  penaltyRate: 0.05 },
      { vendor: 'BuildCo',     amount: 3000, dueDate: 9,  penaltyRate: 0.06 },
      { vendor: 'SupplyMax',   amount: 1500, dueDate: 13, penaltyRate: 0.08 },
      { vendor: 'TechVendors', amount: 2500, dueDate: 17, penaltyRate: 0.05 },
    ],
  },
]

export function getScenario(id: string): ScenarioConfig {
  return scenarios.find(s => s.id === id) ?? scenarios[0]!
}