import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Card from '../../components/Card.jsx'
import Button from '../../components/Button.jsx'
import { answerQuestion } from '../../services/assistant.js'

const INITIAL_MESSAGES = [
  {
    sender: 'assistant',
    text: 'Namaste! I am the AyurSutra Panchakarma Assistant. You can ask me anything about your therapy, what to do before a session, what to eat, or after-care. I will explain in simple words, step by step. How may I help you today?',
    time: 'Just now',
    source: 'local-no-key',
  },
]

const QUICK_PROMPTS = [
  'What are the 5 classical Panchakarma procedures?',
  'What should I eat before my therapy session?',
  'What to do before Basti?',
  'How should I prepare for Abhyanga?',
  'What should I avoid after a Shirodhara session?',
  'What is Samsarjana Krama diet after cleansing?',
  'When is my next session?',
  'What specialized rooms are available in AyurSutra?',
]

export default function AssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  async function handleSend(promptText) {
    const textToSend = (promptText || input).trim()
    if (!textToSend || isTyping) return

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!promptText) setInput('')
    setIsTyping(true)

    try {
      const ans = await answerQuestion(textToSend, user)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: ans.text,
          source: ans.source,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I could not answer just now. Please try again, or ask the front desk for help.',
          source: 'error',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }



  return (
    <div className="w-full -mx-4 lg:-mx-8 px-4 lg:px-8 space-y-6">
      <PageHeader
        title="AyurSutra Panchakarma Assistant"
        subtitle="AI clinical information assistant for Panchakarma therapies, preparatory regimens, and follow-up guidance"
      />

      {/* Governance & Disclaimer */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <span></span>
        <div>
          <span className="font-bold">Clinical &amp; RBAC Safety Notice:</span>
          <p className="text-amber-800 mt-0.5">
            This assistant provides educational information and preparation instructions. Under strict clinical safety guidelines, it does not diagnose medical conditions, prescribe herbal medicines, or bypass doctor prescriptions.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5 items-stretch">
        {/* Chat window — covers the major part of the screen */}
        <Card className="lg:col-span-3 flex flex-col h-[72vh] min-h-[600px] border-stone-200">
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
                    className={`flex items-center justify-end gap-1.5 text-[9.5px] mt-1 text-right ${
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
                <span className="animate-pulse">Thinking about your question…</span>
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

        {/* Frequently Inquired Topics — slim side column, same height as chat */}
        <Card className="lg:col-span-1 flex flex-col h-[72vh] min-h-[600px]">
          <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-3">
            Frequently Inquired Topics
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="w-full text-left p-3 rounded-lg border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-xs text-stone-700 transition-all cursor-pointer block"
              >
                 {prompt}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}


