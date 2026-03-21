export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3"
         style={{ background: 'var(--bg)' }}>
      <div className="w-7 h-7 rounded flex items-center justify-center"
           style={{ background: 'var(--text-primary)' }}>
        <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>VP</span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading VenPayRL</p>
    </div>
  )
}