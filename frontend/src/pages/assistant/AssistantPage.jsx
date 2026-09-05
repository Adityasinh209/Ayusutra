import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'

const INITIAL_MESSAGES = [
  {
    sender: 'assistant',
    text: 'Namaste! I am the AyurSutra Panchakarma Assistant. I can assist you with Panchakarma educational principles, pre-therapy preparation guidelines, daily session schedules, and post-cleanse Samsarjana Krama diets. How may I assist your Panchakarma journey today?',
    time: 'Just now',
  },
]

const QUICK_PROMPTS = [
  'What are the 5 classical Panchakarma procedures?',
  'How should I prepare for my morning Abhyanga & Swedana?',
  'What is Samsarjana Krama post-Basti diet?',
  'What should I avoid after a Shirodhara session?',
  'What specialized rooms are available in AyurSutra?',
]

export default function AssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  function handleSend(promptText) {
    const textToSend = promptText || input
    if (!textToSend.trim()) return

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!promptText) setInput('')
    setIsTyping(true)

    setTimeout(() => {
      const reply = generateAyurvedicResponse(textToSend, user)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
      setIsTyping(false)
    }, 600)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="AyurSutra Panchakarma Assistant"
        subtitle="AI clinical information assistant for Panchakarma therapies, preparatory regimens, and follow-up guidance"
      />

      {/* Governance & Disclaimer */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <span>⚖️</span>
        <div>
          <span className="font-bold">Clinical &amp; RBAC Safety Notice:</span>
          <p className="text-amber-800 mt-0.5">
            This assistant provides educational information, preparation instructions, and scheduled session reminders. Under strict clinical safety guidelines, it does not diagnose medical conditions, prescribe herbal medicines, or bypass doctor prescriptions.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat window */}
        <Card className="lg:col-span-2 flex flex-col h-[560px] border-stone-200">
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-none'
                      : 'bg-stone-100 text-stone-800 rounded-tl-none border border-stone-200/60'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span
                    className={`block text-[10px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-emerald-200' : 'text-stone-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1.5 text-stone-400 text-xs py-2 px-3">
                <span className="animate-pulse">Consulting classical Panchakarma texts…</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Panchakarma procedures, prep instructions, diets…"
                className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <Button type="submit" disabled={!input.trim()}>
                Send
              </Button>
            </form>
          </div>
        </Card>

        {/* Quick Question Prompts */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
              Frequently Inquired Topics
            </h3>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left p-2.5 rounded-lg border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-xs text-stone-700 transition-all cursor-pointer block"
                >
                  💬 {prompt}
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-stone-50 border-stone-200 text-xs space-y-2">
            <h4 className="font-bold text-stone-900">Current User Scope</h4>
            <p className="text-stone-600">
              Logged in as: <strong className="text-stone-900">{user?.name}</strong> ({user?.roleLabel || user?.role})
            </p>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Role permissions strictly enforced. Access to clinical EMR records and treatment adjustments restricted to authorized Vaidya accounts.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function generateAyurvedicResponse(query, user) {
  const q = query.toLowerCase()

  if (q.includes('5') || q.includes('classical') || q.includes('procedures')) {
    return `The classical 5 Pradhana Karma cleansing procedures (Panchakarma) are:\n\n1. **Vamana** (Therapeutic Emesis) — Clears deep-seated Kapha dosha from the chest and stomach.\n2. **Virechana** (Therapeutic Purgation) — Eliminates excess Pitta from the liver, gallbladder, and small intestine.\n3. **Basti** (Medicated Enema) — The supreme therapy pacifying Vata dosha across the colon and nervous system.\n4. **Nasya** (Transnasal Medication) — Cleanses toxins from head, neck, eyes, and sinuses (Urdhva Jatrugata).\n5. **Raktamokshana** (Therapeutic Bloodletting) — Purifies toxic blood in chronic dermatological & vascular conditions.`
  }

  if (q.includes('abhyanga') || q.includes('prepare') || q.includes('swedana')) {
    return `**Pre-Therapy Preparation for Abhyanga & Swedana:**\n\n• Ensure a light meal at least 2 hours prior to the session.\n• Wear comfortable, loose cotton attire that you do not mind touching medicated oils.\n• Arrive 10 minutes early to rest and normalize your resting heart rate.\n• Please inform your assigned therapist of any skin sensitivities, localized tenderness, or recent dizziness before starting.`
  }

  if (q.includes('samsarjana') || q.includes('diet') || q.includes('basti')) {
    return `**Samsarjana Krama (Post-Cleanse Graduated Diet):**\n\nFollowing internal cleansing (such as Basti or Virechana), the digestive fire (Agni) is delicate:\n\n1. **Phase 1 (Days 1–2):** Thin warm rice water (*Peya*) with rock salt.\n2. **Phase 2 (Days 3–4):** Semi-solid rice gruel (*Vilepi*) prepared with mild digestive cumin.\n3. **Phase 3 (Days 5–7):** Green gram soup (*Yusha*) with unpolished rice and cow's ghee.\n\nStrictly avoid: Cold beverages, raw salads, curd, fermented bakery foods, and day sleep.`
  }

  if (q.includes('shirodhara') || q.includes('avoid')) {
    return `**Post-Shirodhara Care Guidelines:**\n\n• Keep your head warmly covered with a soft cloth; avoid exposure to direct breeze, fan, or AC.\n• Avoid looking at bright mobile screens, TVs, or reading for at least 2 hours.\n• Do not wash your hair immediately; let the herbal oil nourish the scalp for 1–2 hours before a lukewarm shower.\n• Maintain a quiet, meditative environment to maximize nervous system pacification.`
  }

  if (q.includes('room') || q.includes('facility') || q.includes('shala')) {
    return `AyurSutra features dedicated specialized Panchakarma therapy chambers:\n\n• **Abhyanga Shala 1 & 2** — Authentic Dronis with synchronized therapist facilities\n• **Shirodhara Kutir** — Soundproof chamber with precision brass dhara vessels\n• **Bashpa Swedana Kaksha** — Herbal steam generators and Nadi Sweda\n• **Basti & Chikitsa Shala** — Dedicated sterile en-suite therapy room\n• **Nasya & Vamana Shala** — Reclining ergonomic chairs and emesis monitoring stations\n• **General Panchakarma Shala** — Multi-purpose room for Kati & Janu Basti dough rings`
  }

  return `Thank you for your question regarding "${query}". In Panchakarma, every treatment is customized to the patient's unique Prakriti (constitution) and Vikriti (imbalance). Please ensure you consult Dr. Meera Nair or your assigned Vaidya before altering any prescribed therapy or diet schedule.`
}
