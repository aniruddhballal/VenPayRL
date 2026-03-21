export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
         style={{ background: '#fafafa' }}>
      <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
        <span className="text-white text-[10px] font-semibold">VP</span>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
        Loading VenPayRL...
      </p>
    </div>
  )
}