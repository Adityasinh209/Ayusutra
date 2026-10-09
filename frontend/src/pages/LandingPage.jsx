import { useNavigate } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import TextReveal from '../components/TextReveal.jsx'

// ─── Palette — 80% White / 20% Green Ayurvedic (matches Dashboard) ───────────
// Primary:  #15803d / #166534 (green-700/800)
// Accent:   #86efac / #dcfce7 (green-300/100)  — 20% green, 80% white breathing
// BG:       #ffffff / #f0fdf4 (white / green-50)
// Text:     #14532d (green-900) / #57534e

const SERVICES = [
  { icon: '', title: 'Panchakarma', desc: 'A comprehensive Ayurvedic detoxification process consisting of five therapeutic procedures that eliminate toxins and restore the body\'s natural balance.' },
  { icon: '', title: 'Abhyanga', desc: 'A therapeutic full-body oil massage that improves circulation, relaxes muscles, and prepares the body for deeper Panchakarma treatments.' },
  { icon: '', title: 'Shirodhara', desc: 'A therapy in which warm medicated oil is gently poured over the forehead to promote mental relaxation, reduce stress, and improve sleep quality.' },
  { icon: '', title: 'Vasti (Basti)', desc: 'A medicated enema therapy used to cleanse the colon, balance Vata dosha, and treat several chronic health conditions.' },
  { icon: '', title: 'Nasya', desc: 'Administration of herbal medicines through the nasal passages to improve respiratory health and treat disorders affecting the head and neck.' },
  { icon: '', title: 'Kaya Kalpa', desc: 'A rejuvenation therapy focused on improving vitality, strengthening body tissues, and promoting long-term wellness.' },
]

const ABOUT_FEATURES = [
  { title: 'Digital Health Records', desc: 'Maintain secure Electronic Medical Records (EMR) containing patient history, diagnoses, prescribed therapies, medications, and follow-up information in one centralized system.' },
  { title: 'AI-Assisted Scheduling', desc: 'Recommend suitable therapists and available appointment slots based on therapist availability, existing bookings, and the prescribed therapy, making appointment scheduling faster and more efficient.' },
  { title: 'Multi-Role Dashboard', desc: 'Dedicated dashboards for Receptionists, Therapists, Patients, and Administrators ensure smooth coordination across every stage of the treatment journey.' },
  { title: 'Billing & Patient Management', desc: 'Manage appointments, patient check-ins, billing, payments, and treatment progress through a unified digital platform designed specifically for Panchakarma centers.' },
]

const WHY_US = [
  { icon: '', title: 'AI-Assisted Scheduling', desc: 'The platform recommends suitable therapists and available appointment slots based on therapist availability and existing bookings, helping reduce scheduling conflicts and save administrative time.' },
  { icon: '', title: 'Digital Patient Records', desc: 'Store patient consultations, diagnoses, therapy plans, prescriptions, and treatment history securely in Electronic Medical Records (EMR), making information easily accessible to authorized healthcare professionals.' },
  { icon: '', title: 'Multi-Role Collaboration', desc: 'Therapists, receptionists, patients, and administrators work together through dedicated dashboards, ensuring better coordination throughout the treatment process.' },
  { icon: '', title: 'Complete Clinic Management', desc: 'Manage patient registration, appointments, therapy sessions, billing, inventory, follow-up care, and reporting through one integrated web platform designed specifically for Panchakarma centers.' },
]

const TESTIMONIALS = [
  { name: 'Ram Nath Kovind', title: 'Former President of India', quote: 'My experience at this Panchakarma centre has been truly remarkable. The serene environment, skilled practitioners, and holistic approach have made a significant impact on my wellbeing.' },
  { name: 'H. D. Deve Gowda', title: 'Former Prime Minister of India', quote: 'The dedication and hospitality of the therapists and staff, their sincere service, treatment with humanity and professional ethics — these qualities are very well seen and truly laudable.' },
  { name: 'Gopinath Balakrishnan', title: 'Patient', quote: 'My 14-day treatment was an exceptional and truly memorable experience. From the compassionate guidance of the therapy team to the personalised care — every aspect reflected outstanding dedication.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const heroSectionRef = useRef(null)
  const heroTextRef = useRef(null)

  // Scroll-driven typography: slide up + fade out on scroll down, slide down + fade in on scroll up
  // Lightweight rAF scroll listener — always active (CSS view timeline as progressive enhancement)
  useEffect(() => {
    const text = heroTextRef.current
    const section = heroSectionRef.current
    if (!text || !section) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        // Start fading when section top is 70% down the viewport, complete over ~520px
        // This makes animation visible while hero is fully in view (not only after it passes top)
        const rect = section.getBoundingClientRect()
        const vh = window.innerHeight
        const start = vh * 0.65 // hero top at 65% viewport height = start fading
        const distance = start - rect.top // 0 at start, 520 at fully faded
        const progress = Math.min(Math.max(distance / 520, 0), 1)
        text.style.transform = `translate3d(0, ${-progress * 84}px, 0)`
        text.style.opacity = String(1 - progress)
        text.style.willChange = 'transform, opacity'
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff', fontFamily: "'Work Sans', sans-serif", color: '#14532d' }}>

      {/* ── NAVBAR ── 80% white / 20% green */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 py-4 shadow-sm" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #dcfce7' }}>
        <div className="flex items-center gap-3">
          <img src="/vecteezy-ayurvedic-logo.jpg" alt="Ayurvedic logo - Modern Medical and health care center" className="h-10 w-auto object-contain rounded-md shadow-sm bg-white border border-green-100" width="72" height="50" />
          <div>
            <span className="block text-base font-bold tracking-tight" style={{ color: '#166534' }}>AyurSutra</span>
            <span className="block text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: '#16a34a' }}>Panchakarma Centre</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#166534' }}>
          <a href="#about" className="hover:text-green-700 hover:opacity-70 transition-colors">About</a>
          <a href="#services" className="hover:text-green-700 hover:opacity-70 transition-colors">Therapies</a>
          <a href="#why" className="hover:text-green-700 hover:opacity-70 transition-colors">Why Us</a>
          <a href="#contact" className="hover:text-green-700 hover:opacity-70 transition-colors">Contact</a>
        </nav>
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-all hover:opacity-90 cursor-pointer" style={{ backgroundColor: '#15803d', color: '#ffffff', border: 'none' }}>
          Sign In →
        </button>
      </header>

      {/* ── HERO ── green gradient + leaf ornaments */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14532d 100%)', minHeight: '88vh' }}>
        <img src="/ornament-leaf.svg" alt="" className="absolute -right-12 -top-10 w-80 h-80 opacity-10 pointer-events-none leaf-float" />
        <img src="/ornament-flower.svg" alt="" className="absolute -left-12 -bottom-12 w-72 h-72 opacity-10 pointer-events-none leaf-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-10" style={{ backgroundColor: '#86efac' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-10" style={{ backgroundColor: '#bbf7d0' }} />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[88vh] text-center px-6 lg:px-16 py-24">
          <TextReveal delay={0.1}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6" style={{ backgroundColor: 'rgba(240,253,244,0.14)', color: '#bbf7d0', border: '1px solid rgba(187,247,208,0.35)' }}>
              Panchakarma Management System
            </span>
          </TextReveal>

          <TextReveal as="h1" delay={0.2} className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl mb-6" style={{ color: '#ffffff' }}>
            Digitizing Panchakarma Care.
            <br />
            <span style={{ color: '#bbf7d0' }}>Smarter Appointments. Better Patient Experience.</span>
          </TextReveal>

          <TextReveal as="p" delay={0.3} className="text-base md:text-lg max-w-3xl mb-10 leading-relaxed" style={{ color: 'rgba(240,253,244,0.88)' }}>
            AyurSutra is an AI-enabled web platform designed to simplify the daily operations of Panchakarma treatment centers.
            From patient registration and Electronic Medical Records (EMR) to therapy management, billing, and follow-up care,
            the platform provides a centralized solution for therapists, receptionists, and patients. Its AI-assisted
            scheduling feature recommends suitable therapists and available appointment slots, reducing manual effort while
            improving operational efficiency.
          </TextReveal>

          <TextReveal delay={0.4} className="flex flex-col sm:flex-row gap-4">
            <button onClick={() => navigate('/login')} className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:bg-green-50 cursor-pointer shadow-lg bg-white text-green-800 border border-white">
              Book Consultation
            </button>
            <a href="#about" className="px-8 py-3.5 rounded-full text-sm font-semibold transition-all cursor-pointer bg-white/10 text-white border border-white/25 hover:bg-white/20" style={{ textDecoration: 'none' }}>
              Explore Features
            </a>
          </TextReveal>

          <div className="flex flex-wrap justify-center gap-10 mt-20 pt-10" style={{ borderTop: '1px solid rgba(240,253,244,0.14)' }}>
            {[
              { value: '5+', label: 'User Roles' },
              { value: '9', label: 'Core Modules' },
              { value: 'AI', label: 'Smart Scheduling' },
              { value: '100%', label: 'Digital Patient Records' },
            ].map((s, idx) => (
              <TextReveal key={s.label} staggerIndex={idx} staggerStep={0.1} className="text-center">
                <div className="text-3xl font-bold" style={{ color: '#bbf7d0' }}>{s.value}</div>
                <div className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'rgba(240,253,244,0.65)' }}>{s.label}</div>
              </TextReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORNAMENTAL DIVIDER ── */}
      <div className="flex items-center justify-center py-8" style={{ backgroundColor: '#ffffff' }}>
        <img src="/ornament-divider.svg" alt="" className="w-full max-w-md h-8 opacity-60" />
      </div>

      {/* ── ABOUT SECTION ── 80% white / 20% green + ayurvedic leaf */}
      <section id="about" className="relative overflow-hidden px-6 lg:px-16 py-20 max-w-6xl mx-auto">
        {/* subtle leaf watermark */}
        <img src="/ornament-leaf.svg" alt="" className="absolute -right-16 top-6 w-64 h-64 opacity-[0.04] pointer-events-none" />
        <img src="/ornament-flower.svg" alt="" className="absolute left-0 bottom-0 w-40 h-40 opacity-[0.05] pointer-events-none leaf-float" />
        <div className="relative grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <TextReveal delay={0.1}>
              <span className="inline-flex items-center gap-2 text-sm md:text-[15px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>
                <img src="/ornament-flower.svg" alt="" className="w-4 h-4 opacity-60" /> About AyurSutra
              </span>
            </TextReveal>

            <TextReveal as="h2" delay={0.2} className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold mb-6 leading-snug" style={{ color: '#14532d' }}>
              A Complete Digital Solution
              <br />for Panchakarma Centers
            </TextReveal>

            <TextReveal as="p" delay={0.3} className="text-base md:text-[17px] leading-relaxed mb-4" style={{ color: '#44403c' }}>
              AyurSutra is an AI-powered patient management platform built specifically for Panchakarma treatment centers.
              Unlike traditional hospital management systems, it is designed around Ayurveda-specific workflows, enabling
              healthcare professionals to efficiently manage consultations, therapy planning, appointments, Electronic
              Medical Records (EMR), billing, inventory, and follow-up care through a single integrated platform.
            </TextReveal>

            <TextReveal as="p" delay={0.4} className="text-base md:text-[17px] leading-relaxed mb-6" style={{ color: '#44403c' }}>
              The system improves coordination between therapists, receptionists, and patients while reducing
              paperwork and manual scheduling. With AI-assisted therapist recommendations and digital treatment records,
              AyurSutra helps treatment centers deliver organized, efficient, and patient-centric healthcare services.
            </TextReveal>

            {/* Panchakarma therapy gallery – moved from dashboards to About (80% white / 20% green) */}
            <TextReveal delay={0.42} className="mb-8">
              <p className="text-sm md:text-[15px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#15803d' }}>Authentic Panchakarma Therapies</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/shirodhara.jpg" alt="Shirodhara" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/abhyanga-face.jpg" alt="Abhyanga" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/kizhi.jpg" alt="Kizhi" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/pizhichil.jpg" alt="Pizhichil" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/panchakarma-room.jpg" alt="Panchakarma Suite" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/spine-therapy.jpg" alt="Spine Therapy" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/spa-therapy.jpg" alt="Swedana" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
                <div className="overflow-hidden rounded-xl border border-green-100"><img src="/images/therapies/ayurveda-massage.jpg" alt="Ayurveda Massage" className="w-full h-24 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" /></div>
              </div>
              <p className="text-[13px] sm:text-sm mt-2 text-center font-medium" style={{ color: '#15803d' }}>Shirodhara · Abhyanga · Kizhi · Pizhichil · Panchakarma Suite · Spine Therapy · Swedana · Ayurveda Massage</p>
            </TextReveal>

            <TextReveal delay={0.5} className="flex gap-4">
              <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 cursor-pointer shadow-sm" style={{ backgroundColor: '#15803d', color: '#ffffff' }}>
                Book Consultation
              </button>
            </TextReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ABOUT_FEATURES.map((f, idx) => (
              <TextReveal key={f.title} staggerIndex={idx} staggerStep={0.1} className="p-5 md:p-6 rounded-2xl bg-white border border-green-100 hover:border-green-200 hover:shadow-md transition-all" style={{ backgroundColor: '#ffffff', borderColor: '#dcfce7' }}>
                <h4 className="text-[17px] md:text-lg font-bold mb-1.5 leading-snug" style={{ color: '#14532d' }}>{f.title}</h4>
                <p className="text-[15px] md:text-base leading-relaxed" style={{ color: '#44403c' }}>{f.desc}</p>
              </TextReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-center py-4">
        <img src="/ornament-divider.svg" alt="" className="w-full max-w-xl h-8 opacity-50" />
      </div>

      {/* ── PANCHAKARMA THERAPIES — Full-width 1800×913 scroll-driven hero (charaka.org) ── */}
      <section
        ref={heroSectionRef}
        className="relative w-full overflow-hidden flex items-center justify-center"
        style={{
          width: '100%',
          maxWidth: '1800px',
          height: 'min(913px, 56vw)',
          minHeight: '420px',
          maxHeight: '913px',
          aspectRatio: '1800 / 913',
          margin: '0 auto',
          backgroundColor: '#052e16',
        }}
      >
        {/* Background image — clean, full-bleed */}
        <img
          src="/images/therapies/panchakarma-room.jpg"
          alt="Panchakarma therapies"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 38%' }}
          loading="lazy"
          width={1800}
          height={913}
        />
        {/* Soft green overlay for elegant contrast - 80% white / 20% green harmony */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(5,46,22,0.45) 55%, rgba(5,46,22,0.62) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(5,46,22,0.25) 100%)' }} />

        {/* Centered serif heading with scroll animation */}
        <h2
          ref={heroTextRef}
          className="relative z-10 text-center font-normal px-6 select-none panchakarma-hero-text"
          style={{
            fontFamily: "'Work Sans', sans-serif",
            fontSize: 'clamp(2.2rem, 7vw, 5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 2px 18px rgba(0,0,0,0.28), 0 1px 2px rgba(0,0,0,0.35)',
            willChange: 'transform, opacity',
            transform: 'translate3d(0,0,0)',
            opacity: 1,
          }}
        >
          Panchakarma Therapies
        </h2>
        {/* Scroll hint — helps discover animation */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 pointer-events-none">
          <span className="text-[9.5px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.75)' }}>Scroll</span>
          <span className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5" style={{ borderColor: 'rgba(255,255,255,0.45)' }}>
            <span className="w-1 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDuration: '1.4s' }} />
          </span>
        </div>

        {/* CSS Scroll-driven animation (when supported) — buttery smooth without JS */}
        <style>{`
          @supports (animation-timeline: view()) {
            .panchakarma-hero-text {
              animation: panchakarma-hero-fade linear both;
              animation-timeline: view();
              animation-range: entry 0% exit 85%;
            }
            @keyframes panchakarma-hero-fade {
              from { transform: translate3d(0, 0, 0); opacity: 1; }
              to { transform: translate3d(0, -72px, 0); opacity: 0; }
            }
          }
          @media (max-width: 640px) {
            @supports (animation-timeline: view()) {
              @keyframes panchakarma-hero-fade {
                from { transform: translate3d(0, 0, 0); opacity: 1; }
                to { transform: translate3d(0, -48px, 0); opacity: 0; }
              }
            }
          }
        `}</style>
      </section>

      {/* ── THERAPIES / SERVICES — green-50 80% white */}
      <section id="services" className="px-6 lg:px-16 py-20" style={{ backgroundColor: '#f0fdf4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <TextReveal delay={0.1}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>
                <img src="/ornament-leaf.svg" alt="" className="w-4 h-4 opacity-50" /> Our Therapies
              </span>
            </TextReveal>
            <TextReveal as="h2" delay={0.2} className="text-3xl md:text-5xl font-bold" style={{ color: '#14532d' }}>
              Panchakarma Therapies Managed by AyurSutra
            </TextReveal>
            <TextReveal as="p" delay={0.3} className="mt-4 text-[16px] max-w-2xl mx-auto leading-relaxed" style={{ color: '#57534e' }}>
              AyurSutra helps healthcare professionals digitally manage every stage of Panchakarma treatment,
              from consultation and therapy planning to appointment scheduling, treatment tracking, and patient follow-up.
            </TextReveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, idx) => (
              <TextReveal key={s.title} staggerIndex={idx} staggerStep={0.08} className="group p-6 rounded-2xl transition-all hover:shadow-md cursor-default bg-white border border-green-100 hover:border-green-200" style={{ backgroundColor: '#ffffff', borderColor: '#dcfce7' }}>
                <h3 className="text-[20px] font-bold mb-2" style={{ color: '#14532d' }}>{s.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#57534e' }}>{s.desc}</p>
              </TextReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US — white with green accents */}
      <section id="why" className="px-6 lg:px-16 py-20" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f0fdf4', borderBottom: '1px solid #f0fdf4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <TextReveal delay={0.1}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>
                <img src="/ornament-flower.svg" alt="" className="w-4 h-4 opacity-50" /> Why AyurSutra
              </span>
            </TextReveal>
            <TextReveal as="h2" delay={0.2} className="text-3xl md:text-5xl font-bold" style={{ color: '#14532d' }}>
              Built for Modern Panchakarma Centers
            </TextReveal>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((w, idx) => (
              <TextReveal key={w.title} staggerIndex={idx} staggerStep={0.1} className="text-center p-5 rounded-2xl bg-green-50/50 border border-green-100">
                <h4 className="text-[18px] font-semibold mb-2" style={{ color: '#14532d' }}>{w.title}</h4>
                <p className="text-[14px] leading-relaxed" style={{ color: '#57534e' }}>{w.desc}</p>
              </TextReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS — green tint */}
      <section className="px-6 lg:px-16 py-20" style={{ backgroundColor: '#f0fdf4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <TextReveal delay={0.1}>
              <span className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>Patient Stories</span>
            </TextReveal>
            <TextReveal as="h2" delay={0.2} className="text-3xl md:text-5xl font-bold" style={{ color: '#14532d' }}>
              Words from Those We've Healed
            </TextReveal>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, idx) => (
              <TextReveal key={t.name} staggerIndex={idx} staggerStep={0.12} className="p-6 rounded-2xl bg-white border border-green-100" style={{ backgroundColor: '#ffffff', borderColor: '#dcfce7' }}>
                <div className="text-3xl mb-4" style={{ color: '#86efac' }}>"</div>
                <p className="text-sm leading-relaxed mb-6 italic" style={{ color: '#14532d' }}>{t.quote}</p>
                <div className="flex items-center gap-3" style={{ borderTop: '1px solid #dcfce7', paddingTop: '16px' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#15803d' }}>{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#14532d' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#16a34a' }}>{t.title}</p>
                  </div>
                </div>
              </TextReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER — green gradient */}
      <section className="relative overflow-hidden px-6 lg:px-16 py-20 text-center" style={{ background: 'linear-gradient(135deg, #15803d 0%, #166534 60%, #14532d 100%)' }}>
        <img src="/ornament-leaf.svg" alt="" className="absolute left-6 top-6 w-32 h-32 opacity-10 pointer-events-none" />
        <img src="/ornament-flower.svg" alt="" className="absolute right-6 bottom-6 w-40 h-40 opacity-10 pointer-events-none" />
        <TextReveal as="h2" delay={0.1} className="text-3xl md:text-5xl font-bold text-white mb-4">
          Begin Your Healing Journey Today
        </TextReveal>
        <TextReveal as="p" delay={0.2} className="text-sm max-w-xl mx-auto mb-8" style={{ color: 'rgba(240,253,244,0.85)' }}>
          Free medical consultation is available at our hospitals and across India at 27 branch clinics. Video and e-mail consultations also available.
        </TextReveal>
        <TextReveal delay={0.3}>
          <button onClick={() => navigate('/login')} className="px-10 py-4 rounded-full text-sm font-bold transition-all hover:bg-green-50 cursor-pointer shadow-lg bg-white text-green-800 border border-white">
            Access Patient Portal →
          </button>
        </TextReveal>
      </section>

      {/* ── FOOTER — green-950 */}
      <footer id="contact" style={{ backgroundColor: '#052e16', color: 'rgba(240,253,244,0.78)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-16 py-16 grid md:grid-cols-3 gap-10">
          <TextReveal delay={0.1}>
            <div className="flex items-center gap-3 mb-4">
              <img src="/vecteezy-ayurvedic-logo.jpg" alt="Ayurvedic logo" className="h-9 w-auto object-contain rounded-md shadow-sm bg-white" width="64" height="44" />
              <div>
                <span className="block text-sm font-bold text-white">AyurSutra</span>
                <span className="block text-[9.5px] font-semibold uppercase tracking-widest" style={{ color: '#86efac' }}>Panchakarma Centre</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed">Practising and propagating authentic Ayurveda since 1902. A charitable institution committed to the health and wellbeing of all.</p>
          </TextReveal>

          <TextReveal delay={0.2}>
            <h5 className="text-sm font-semibold text-white mb-4">Contact Us</h5>
            <div className="space-y-2 text-xs">
              <p> Head Office, Kottakkal (PO), Malappuram Dist., Kerala – 676 503, INDIA</p>
              <p> +91 483 2808000</p>
              <p> info@ayursutra.dev</p>
              <p className="mt-4 font-medium" style={{ color: '#86efac' }}>Branch Clinics: 27 locations across India</p>
            </div>
          </TextReveal>

          <TextReveal delay={0.3}>
            <h5 className="text-sm font-semibold text-white mb-4">Quick Links</h5>
            <div className="flex flex-col gap-2 text-xs">
              {['Video Consultation', 'E-mail Consultation', 'Locate a Dealer', 'Our Publications', 'R&D Activities', 'Career'].map((l) => (
                <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </TextReveal>
        </div>

        <div className="text-center py-4 text-xs" style={{ borderTop: '1px solid rgba(240,253,244,0.12)', color: 'rgba(240,253,244,0.45)' }}>
          © 2024 AyurSutra Panchakarma Centre. All rights reserved. · Inspired by classical Kerala Panchakarma traditions.
        </div>
      </footer>
    </div>
  )
}
