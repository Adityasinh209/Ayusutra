export default function ClerkAuthLayout({ children, eyebrow, wide = false }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        backgroundImage: `
          radial-gradient(ellipse at 20% 20%, rgba(21,128,61,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 80%, rgba(134,239,172,0.12) 0%, transparent 60%)
        `,
      }}
    >
      <img src="/ornament-leaf.svg" alt="" className="absolute -right-16 top-10 w-64 h-64 opacity-[0.05] pointer-events-none" />
      <img src="/ornament-flower.svg" alt="" className="absolute -left-12 bottom-10 w-56 h-56 opacity-[0.05] pointer-events-none" />

      <div className={`relative z-10 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} flex flex-col items-center`}>
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/vecteezy-ayurvedic-logo.jpg"
            alt="AyurSutra"
            className="h-10 w-auto object-contain rounded-md shadow-sm bg-white border border-green-100"
            width="72"
            height="50"
          />
          <div>
            <span className="block text-base font-bold tracking-tight text-green-800">AyurSutra</span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-green-600">
              Panchakarma Centre
            </span>
          </div>
        </div>
        {eyebrow && (
          <p className="text-[13px] font-semibold uppercase tracking-widest text-green-600 mb-4">{eyebrow}</p>
        )}
        {children}
      </div>
    </div>
  )
}
