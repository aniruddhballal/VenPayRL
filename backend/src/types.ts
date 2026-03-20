export interface Invoice {
  id: string;
  vendor: string;
  amount: number;
  dueDate: number;
  penaltyRate: number;
  paid: boolean;
  delayed: number;
}

export interface LogEntry {
  day: number;
  vendor: string;
  action: 'FULL_PAY' | 'PARTIAL_PAY' | 'DELAYED' | 'OVERDUE';
  amount: string;
  reward: string;
}

export interface SimState {
  day: number;
  cash: number;
  totalReward: number;
  invoices: Invoice[];
  log: LogEntry[];
}

export interface AgentAction {
  invoiceId: string;
  type: 'full' | 'partial' | 'delay';
  amount?: number;
}