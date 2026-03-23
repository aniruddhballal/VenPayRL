import { useState } from 'react'
import { Plus, Trash2, X, Check } from 'lucide-react'
import { createCustomScenario, type CustomInvoiceInput } from '../api'
import type { SimState, ScenarioConfig } from '../types'

interface Props {
  open:    boolean
  onClose: () => void
  onApply: (scenario: ScenarioConfig, state: SimState) => void
}

const DEFAULT_CASH   = 15000
const DEFAULT_INFLOW = 800

const DEFAULT_INVOICES: (CustomInvoiceInput & { id: number })[] = [
  { id: 1, vendor: 'Rent Corp',     amount: 8000, dueDate: 3,  penaltyRate: 12 },
  { id: 2, vendor: 'Tech Supplies', amount: 5000, dueDate: 7,  penaltyRate: 5  },
  { id: 3, vendor: 'Logistics Co',  amount: 3500, dueDate: 10, penaltyRate: 8  },
  { id: 4, vendor: 'Software Ltd',  amount: 6000, dueDate: 14, penaltyRate: 4  },
  { id: 5, vendor: 'Office Goods',  amount: 2000, dueDate: 18, penaltyRate: 6  },
]

let idCounter = DEFAULT_INVOICES.length + 1
const newRow = (): CustomInvoiceInput & { id: number } => ({
  id: idCounter++, vendor: '', amount: 0, dueDate: 14, penaltyRate: 5,
})

export default function CustomScenarioDrawer({ open, onClose, onApply }: Props) {
  const [cash,        setCash]        = useState<number>(DEFAULT_CASH)
  const [cashInflow,  setCashInflow]  = useState<number>(DEFAULT_INFLOW)
  const [invoices,    setInvoices]    = useState<(CustomInvoiceInput & { id: number })[]>(
    DEFAULT_INVOICES.map(i => ({ ...i }))
  )
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const addRow    = () => setInvoices(i => [...i, newRow()])
  const removeRow = (id: number) => setInvoices(i => i.filter(r => r.id !== id))
  const updateRow = (id: number, field: keyof CustomInvoiceInput, value: string | number) =>
    setInvoices(i => i.map(r => r.id === id ? { ...r, [field]: value } : r))

  const resetToDefaults = () => {
    setCash(DEFAULT_CASH)
    setCashInflow(DEFAULT_INFLOW)
    setInvoices(DEFAULT_INVOICES.map(i => ({ ...i })))
    setError(null)
  }

  const validate = (): string | null => {
    if (!cash || cash <= 0)      return 'Cash must be greater than 0'
    for (const inv of invoices) {
      if (!inv.vendor.trim())    return 'All vendors must have a name'
      if (inv.amount <= 0)       return 'All invoice amounts must be greater than 0'
      if (inv.dueDate < 1)       return 'Due date must be at least 1 day'
      if (inv.penaltyRate < 0 || inv.penaltyRate > 100)
                                 return 'Penalty rate must be between 0 and 100'
    }
    return null
  }

  const handleApply = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      const { scenario, state } = await createCustomScenario(cash, invoices, cashInflow || undefined)
      onApply(scenario, state)
      onClose()
    } catch {
      setError('Failed to create scenario — check that the backend is running')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px',
    display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-raised)',
    border: '1px solid var(--border)', borderRadius: '6px',
    padding: '6px 10px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(26,25,22,0.3)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: '520px',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 32px rgba(26,25,22,0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
             style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)' }}>
              Custom Scenario
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pre-filled with a test scenario — edit or clear to enter your own
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="btn-ghost"
              style={{ fontSize: '11px', height: '28px', padding: '0 10px' }}
            >
              Reset defaults
            </button>
            <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Cash */}
          <div>
            <label style={labelStyle}>Starting Cash</label>
            <div className="relative">
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)' }}>$</span>
              <input
                type="number" min={1} value={cash}
                onChange={e => setCash(Number(e.target.value))}
                style={{ ...inputStyle, paddingLeft: '22px' }}
              />
            </div>
          </div>

          {/* Daily cash inflow */}
          <div>
            <label style={labelStyle}>
              Daily Cash Inflow{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                (optional — simulates revenue coming in each day)
              </span>
            </label>
            <div className="relative">
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-muted)' }}>$</span>
              <input
                type="number" min={0} placeholder="0 — no inflow"
                value={cashInflow || ''}
                onChange={e => setCashInflow(Number(e.target.value))}
                style={{ ...inputStyle, paddingLeft: '22px' }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Added to cash each day before the agent acts. Models daily revenue or salary inflows.
            </p>
          </div>

          {/* Summary bar */}
          <div className="flex gap-4 px-4 py-3 rounded-lg flex-wrap"
               style={{ background: 'var(--surface-raised)' }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: '2px' }}>Total Invoiced</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: totalInvoiced > cash ? 'var(--negative)' : 'var(--text-primary)' }}>
                ${totalInvoiced.toLocaleString()}
              </p>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
              <p style={{ ...labelStyle, marginBottom: '2px' }}>Cash After</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: cash - totalInvoiced >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                ${(cash - totalInvoiced).toLocaleString()}
              </p>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
              <p style={{ ...labelStyle, marginBottom: '2px' }}>Invoices</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--text-primary)' }}>
                {invoices.length}
              </p>
            </div>
            {cashInflow > 0 && (
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                <p style={{ ...labelStyle, marginBottom: '2px' }}>Daily Inflow</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--positive)' }}>
                  +${cashInflow.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Invoice table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label style={{ ...labelStyle, marginBottom: 0 }}>Invoices</label>
              <button onClick={addRow} className="btn-ghost"
                      style={{ fontSize: '12px', height: '28px', padding: '0 10px' }}>
                <Plus size={12} /> Add row
              </button>
            </div>

            {/* Column headers */}
            <div className="grid gap-2 mb-1.5"
                 style={{ gridTemplateColumns: '1fr 90px 80px 80px 32px' }}>
              {['Vendor', 'Amount', 'Due (days)', 'Penalty %', ''].map(h => (
                <p key={h} style={{ ...labelStyle, marginBottom: 0 }}>{h}</p>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="grid gap-2 items-center"
                     style={{ gridTemplateColumns: '1fr 90px 80px 80px 32px' }}>
                  <input
                    type="text" placeholder="Vendor name" value={inv.vendor}
                    onChange={e => updateRow(inv.id, 'vendor', e.target.value)}
                    style={inputStyle}
                  />
                  <div className="relative">
                    <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number" min={1} placeholder="0"
                      value={inv.amount || ''}
                      onChange={e => updateRow(inv.id, 'amount', Number(e.target.value))}
                      style={{ ...inputStyle, paddingLeft: '18px' }}
                    />
                  </div>
                  <input
                    type="number" min={1} placeholder="14"
                    value={inv.dueDate || ''}
                    onChange={e => updateRow(inv.id, 'dueDate', Number(e.target.value))}
                    style={inputStyle}
                  />
                  <div className="relative">
                    <input
                      type="number" min={0} max={100} step={0.1} placeholder="5"
                      value={inv.penaltyRate || ''}
                      onChange={e => updateRow(inv.id, 'penaltyRate', Number(e.target.value))}
                      style={{ ...inputStyle, paddingRight: '22px' }}
                    />
                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
                  </div>
                  <button
                    onClick={() => removeRow(inv.id)}
                    disabled={invoices.length === 1}
                    className="btn-ghost"
                    style={{ padding: '6px', opacity: invoices.length === 1 ? 0.3 : 1 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p style={{
              fontSize: '12px', color: 'var(--negative)',
              padding: '8px 12px', background: '#fdf2f2',
              borderRadius: '6px', border: '1px solid #f5c6c6',
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between"
             style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleApply} disabled={loading} className="btn-primary">
            <Check size={13} /> {loading ? 'Applying…' : 'Apply Scenario'}
          </button>
        </div>
      </div>
    </>
  )
}