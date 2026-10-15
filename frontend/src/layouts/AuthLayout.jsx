import TextReveal from '../components/TextReveal.jsx'

export default function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        backgroundColor: '#ffffff',
        fontFamily: "'Work Sans', sans-serif",
        color: '#14532d',
        backgroundImage: `
          radial-gradient(ellipse at 20% 20%, rgba(21,128,61,0.07) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 80%, rgba(134,239,172,0.12) 0%, transparent 60%)
        `,
      }}
    >
      <img src="/ornament-leaf.svg" alt="" className="absolute -right-16 top-10 w-64 h-64 opacity-[0.05] pointer-events-none" />
      <img src="/ornament-flower.svg" alt="" className="absolute -left-12 bottom-10 w-56 h-56 opacity-[0.05] pointer-events-none leaf-float" />
      {/* Decorative top text */}
      <TextReveal className="mb-8 text-center relative" delay={0.1}>
        <p className="text-[14.5px] font-semibold uppercase tracking-widest" style={{ color: '#16a34a' }}>
           Authentic Ayurveda Since 1902 
        </p>
      </TextReveal>

      {children}

      {/* Bottom tagline */}
      <TextReveal as="p" className="mt-8 text-sm md:text-[15px] text-center relative font-medium" style={{ color: '#15803d' }} delay={0.3}>
        AyurSutra Panchakarma Centre · Healing Body, Mind &amp; Spirit
      </TextReveal>
    </div>
  )
}
