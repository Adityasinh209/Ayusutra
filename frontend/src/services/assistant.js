/**
 * AyurSutra Assistant service — live answers only, nothing is stored.
 *
 * Flow: answerQuestion(query, user)
 *   1. Build personal context (patient profile, active plan, next appointment)
 *   2. If a Groq key is configured → call openai/gpt-oss-120b (live)
 *   3. On any failure / no key → expanded local knowledge base (all 11 therapies)
 *   4. formatReply() → plain human chat text, no markdown symbols.
 *
 * WHERE TO PUT YOUR KEY: repo-root .env → VITE_GROQ_API_KEY=gsk_...,
 * then restart the dev server.
 */

import { THERAPIES, THERAPY_ROOMS } from '../mocks/seed.js'
import { getPatient } from './patients.js'
import { getPlansForPatient } from './plans.js'
import { getAppointmentsForPatient } from './appointments.js'
import { getTherapy } from './therapies.js'
import { getRoom } from './rooms.js'

// ─── Paste your Groq key here for quick testing (option B) ────────────────
const GROQ_API_KEY = ''

export const GROQ_MODEL = 'openai/gpt-oss-120b'
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export function getApiKey() {
  try {
    const stored = localStorage.getItem('ayursutra:groq-key')
    if (stored) return stored
  } catch { /* ignore */ }
  const envKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GROQ_API_KEY : ''
  if (envKey) return envKey
  if (GROQ_API_KEY) return GROQ_API_KEY
  return ''
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem('ayursutra:groq-key', key)
    else localStorage.removeItem('ayursutra:groq-key')
  } catch { /* ignore */ }
}

export function hasApiKey() {
  return !!getApiKey()
}

// ─── Personal context ─────────────────────────────────────────────────────

export async function buildPersonalContext(user) {
  const patientId = user?.patientId
  if (!patientId) return null
  try {
    const [profile, plans, appts] = await Promise.all([
      getPatient(patientId).catch(() => null),
      getPlansForPatient(patientId).catch(() => []),
      getAppointmentsForPatient(patientId).catch(() => []),
    ])
    if (!profile && plans.length === 0 && appts.length === 0) return null
    const activePlan = plans.find((p) => p.status === 'In Progress' || p.status === 'Active') || plans[0] || null
    const upcoming = appts.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed')
    const nextAppt = upcoming[0] || null
    let nextTherapy = null
    let nextRoom = null
    if (nextAppt) {
      ;[nextTherapy, nextRoom] = await Promise.all([
        getTherapy(nextAppt.therapyId).catch(() => null),
        getRoom(nextAppt.roomId).catch(() => null),
      ])
    }
    return { profile, activePlan, nextAppt, nextTherapy, nextRoom }
  } catch {
    return null
  }
}

function personalSummary(ctx) {
  if (!ctx) return 'No personal treatment record available for this user.'
  const lines = []
  if (ctx.profile) {
    lines.push(`Patient: ${ctx.profile.fullName}, Prakriti (body constitution): ${ctx.profile.prakriti || 'Vata-Pitta'}, Agni (digestion): ${ctx.profile.agniType || 'Sama Agni'}.`)
  }
  if (ctx.activePlan) {
    lines.push(`Active plan: ${ctx.activePlan.procedureName || ctx.activePlan.primaryPanchakarma} in stage ${ctx.activePlan.treatmentStage}, progress ${ctx.activePlan.completedSessions || 0} of ${ctx.activePlan.totalSessions || 7} sessions. Diet: ${ctx.activePlan.dietPlan || 'light warm foods'}. Doctor note: ${ctx.activePlan.doctorInstructions || 'follow classical protocol'}.`)
  }
  if (ctx.nextAppt) {
    lines.push(`Next session: ${ctx.nextTherapy?.name || 'therapy'} on ${ctx.nextAppt.date} at ${ctx.nextAppt.startTime} in ${ctx.nextRoom?.name || 'therapy room'}.`)
  } else {
    lines.push('No upcoming session currently scheduled.')
  }
  return lines.join('\n')
}

function therapyFacts() {
  return THERAPIES.map((t) => (
    `${t.name} (${t.category}, ${t.stage}, ${t.defaultDurationMins} min, usually ${t.defaultSessionCount} sessions): ${t.description} Before: ${t.preparationRequirements} After: ${t.postTreatmentInstructions}`
  )).join('\n')
}

// ─── Groq call ────────────────────────────────────────────────────────────

function systemPrompt(ctx) {
  return [
    'You are AyurSutra Assistant, a warm and friendly Panchakarma clinic helper chatting with a patient like a caring person, not a robot.',
    'Use simple everyday English that any patient can understand. When you use an Ayurvedic Hindi word, always add its meaning in brackets the first time, for example Peya (thin rice water), Agni (digestive fire), Abhyanga (warm oil massage).',
    '',
    'STRICT SAFETY: You give general education only. You never diagnose disease, never prescribe medicines or doses, never change a doctor plan. If asked about that, politely say to ask their Vaidya (doctor). You never invent appointment slots or room availability.',
    '',
    'PATIENT CONTEXT (use it when the question says my, mine, tomorrow, my diet, my plan):',
    personalSummary(ctx),
    '',
    'THERAPY FACTS (ground your answers in these, do not invent prep or diet rules):',
    therapyFacts(),
    '',
    'FORMAT RULES (very important):',
    '1. Plain text only. Never use markdown symbols like asterisks, hash, backticks, or bullet dots. Never write **bold** or *italic*.',
    '2. For short questions (what is X, how long, how many sessions): reply in one friendly paragraph of 3 to 4 lines.',
    '3. For long or how-to questions (preparation, what to eat, after-care, steps): start with one warm intro line, then give simple numbered points like 1. 2. 3. Each point one line.',
    '4. Keep it short enough to read easily on a phone. Avoid heavy words.',
  ].join('\n')
}

export async function callGroq(query, ctx, signal) {
  const key = getApiKey()
  if (!key) {
    const err = new Error('Groq API key not configured.')
    err.code = 'NO_KEY'
    throw err
  }
  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemPrompt(ctx) },
        { role: 'user', content: query },
      ],
    }),
  })
  if (!res.ok) {
    const err = new Error(`Groq request failed with status ${res.status}.`)
    err.code = 'GROQ_ERROR'
    err.status = res.status
    throw err
  }
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content?.trim()
  if (!text) {
    const err = new Error('Empty response from assistant.')
    err.code = 'EMPTY'
    throw err
  }
  return text
}

// ─── Offline local knowledge base (fallback + no-key mode) ────────────────

const THERAPY_ALIASES = [
  { names: ['abhyanga', 'oil massage', 'oil massge'], therapy: 'Abhyanga' },
  { names: ['shirodhara', 'shiro dhara', 'forehead oil'], therapy: 'Shirodhara' },
  { names: ['basti', 'vasti', 'basti therapy', 'enema'], therapy: 'Basti' },
  { names: ['nasya', 'nasyam', 'nasal'], therapy: 'Nasya' },
  { names: ['swedana', 'swedan', 'steam', 'bashpa'], therapy: 'Swedana' },
  { names: ['vamana', 'vaman', 'emesis', 'vomiting therapy'], therapy: 'Vamana' },
  { names: ['virechana', 'virechan', 'purgation', 'purgative'], therapy: 'Virechana' },
  { names: ['kizhi', 'kidi', 'potli', 'patra pinda', 'leaf bundle'], therapy: 'Kizhi (Patra Pinda Sweda)' },
  { names: ['kati basti', 'kati vasti', 'lower back oil', 'back pain therapy'], therapy: 'Kati Basti' },
  { names: ['janu basti', 'janu vasti', 'knee oil', 'knee pain therapy'], therapy: 'Janu Basti' },
  { names: ['udvartana', 'udvarthana', 'powder massage', 'weight massage'], therapy: 'Udvartana' },
  { names: ['pizhichil', 'pizhichal', 'oil bath'], therapy: 'Pizhichil' },
  { names: ['raktamokshana', 'blood letting', 'bloodletting'], therapy: 'Raktamokshana' },
]

export function detectTherapy(query) {
  const q = query.toLowerCase()
  for (const entry of THERAPY_ALIASES) {
    if (entry.names.some((n) => q.includes(n))) {
      const found = THERAPIES.find((t) => t.name.toLowerCase().includes(entry.therapy.toLowerCase().split(' ')[0]))
      return found || { name: entry.therapy }
    }
  }
  return null
}

export function detectIntent(query) {
  const q = query.toLowerCase()
  if (/(my next|my session|my appointment|when is my|tomorrow.*(my|session|therapy)|my schedule)/.test(q)) return 'my-next'
  if (/(my plan|my treatment|my progress|my diet plan|my prakriti|my stage)/.test(q)) return 'my-plan'
  if (/(what.*eat|eat before|food before|diet before|meal before|can i eat|hungry|empty stomach)/.test(q)) return 'eat-before'
  if (/(samsarjana|diet after|food after|eat after|post.*diet)/.test(q)) return 'diet-after'
  if (/(before|prepare|preparation|what to do before|ready for|night before|morning of)/.test(q)) return 'before'
  if (/(after|aftercare|avoid after|care after|what.*after|post therapy|precaution)/.test(q)) return 'after'
  if (/(how long|duration|how much time|how many sessions|how many days|sittings)/.test(q)) return 'duration'
  if (/(benefit|good for|useful for|helps with|what.*cure|why.*done)/.test(q)) return 'benefits'
  if (/(safe|side effect|painful|pain|risk|pregnan|periods|safe for)/.test(q)) return 'safety'
  if (/(room|shala|facility|kutir|where.*done|centre)/.test(q)) return 'rooms'
  if (/(panchakarma|5.*(procedure|karma)|stages|purva|pradhana|paschat|dosha|prakriti|ama|agni)/.test(q)) return 'basics'
  if (/(what is|what are|tell me about|explain|meaning of|which therapy)/.test(q)) return 'what-is'
  return 'general'
}

function therapyByName(name) {
  if (!name) return null
  const first = name.toLowerCase().split(' ')[0]
  return THERAPIES.find((t) => t.name.toLowerCase().includes(first)) || null
}

// Human, plain-text answers. No markdown symbols anywhere here.
export function answerLocal(query, ctx) {
  const therapyHit = detectTherapy(query)
  const therapy = therapyByName(therapyHit?.name)
  const intent = detectIntent(query)
  const firstName = ctx?.profile?.fullName?.split(' ')[0]

  if (intent === 'my-next') {
    if (ctx?.nextAppt) {
      return `Hello${firstName ? ' ' + firstName : ''}, here is your next session. 1. Your ${ctx.nextTherapy?.name || 'therapy'} is on ${ctx.nextAppt.date} at ${ctx.nextAppt.startTime} in ${ctx.nextRoom?.name || 'the therapy room'}. 2. Please reach 10 minutes early and carry light cotton clothes. 3. Eat only a light warm meal at least 2 hours before, and drink warm water after. If you feel unwell, please inform the clinic before coming.`
    }
    return `Hello${firstName ? ' ' + firstName : ''}, I could not find any upcoming session in your record. Please check My Therapy Sessions or ask the front desk to schedule your next visit. In the meantime eat light warm food and keep yourself warm and rested.`
  }

  if (intent === 'my-plan') {
    if (ctx?.activePlan) {
      const p = ctx.activePlan
      return `Hello${firstName ? ' ' + firstName : ''}, this is your current plan in simple words. 1. Your therapy is ${p.procedureName || p.primaryPanchakarma} and you are in the ${p.treatmentStage} stage. 2. You have finished ${p.completedSessions || 0} out of ${p.totalSessions || 7} sessions. 3. Your prescribed diet is ${p.dietPlan || 'light warm freshly cooked food'}. 4. Your doctor note says ${p.doctorInstructions || 'follow rest and warm food after sessions'}. Please follow this only, and ask your Vaidya (doctor) before changing anything.`
    }
    return `Hello${firstName ? ' ' + firstName : ''}, I could not find an active plan in your record right now. Your Vaidya (doctor) will create it after your assessment. You can check My Treatment Plan again after your visit.`
  }

  if (therapy && intent === 'eat-before') {
    const heavy = ['Vamana', 'Virechana'].some((n) => therapy.name.includes(n))
    if (therapy.name.includes('Basti')) {
      return `Namaste, good question about food before ${therapy.name}. 1. For oil Basti (Anuvasana), take a light warm semi solid meal like thin Khichdi 2 to 3 hours before. 2. For decoction Basti (Niruha), usually it is done on a light or empty stomach, so follow exactly what your Vaidya (doctor) told you. 3. Avoid cold milk, curd, fried food, and heavy non veg the night before. 4. Drink only warm water, and come with a calm and empty feeling, not full stomach.`
    }
    if (heavy) {
      return `Namaste, food before ${therapy.name} is very strict, so please listen carefully. 1. Your doctor will give you ghee (Snehapana) for a few days before, take it exactly as told. 2. The previous evening take only the Kapha increasing light food your doctor suggests, nothing extra. 3. On the therapy morning, do not eat on your own, the doctor will guide you at the centre. 4. This therapy happens only with doctor presence, so reach on time and on an empty, calm stomach.`
    }
    return `Namaste, here is what to eat before your ${therapy.name} session. 1. Take a light warm meal like Khichdi, vegetable soup (Yusha), or dal rice at least 2 hours before. 2. Avoid cold drinks, curd, fried snacks, and heavy sweets. 3. Drink a glass of warm water 30 minutes before, and pass urine before entering. 4. Come feeling light, not full and not fully hungry, that gives the best result.`
  }

  if (intent === 'eat-before') {
    return `Namaste, here is the simple food rule before any therapy session. 1. Eat a light warm meal like Khichdi or vegetable soup at least 2 hours before. 2. Avoid cold drinks, curd, fried food, bakery, and heavy non veg. 3. Drink warm water, not cold, and come with a light stomach. 4. For Basti, Vamana, and Virechana the rule is stricter, so always follow your Vaidya (doctor) instruction for those.`
  }

  if (intent === 'diet-after') {
    return `Namaste, after cleansing therapies your Agni (digestive fire) becomes very soft, so we rebuild it slowly with Samsarjana Krama (step by step diet). 1. Days 1 and 2 take only Peya (thin warm rice water) with a pinch of rock salt. 2. Days 3 and 4 take Vilepi (soft thick rice gruel) with cumin and a little ghee. 3. Days 5 to 7 take Yusha (green gram soup) with soft rice and ghee. 4. Avoid cold water, raw salad, curd, fried food, and day sleep during this week. If you feel heaviness or loose motions, inform your doctor at once.`
  }

  if (therapy && intent === 'before') {
    return `Namaste, here is how to prepare for your ${therapy.name} session. 1. ${simplify(therapy.preparationRequirements)} 2. Eat only light warm food 2 hours before and drink warm water. 3. Wear loose cotton clothes and keep your hair clean and open as needed. 4. Reach 10 minutes early, and tell your therapist about allergy, skin cut, fever, or dizziness. Take care, we will take good care of you.`
  }

  if (therapy && intent === 'after') {
    return `Namaste, here is your after care for ${therapy.name}. 1. ${simplify(therapy.postTreatmentInstructions)} 2. Keep yourself warm, avoid AC wind, cold water, and heavy exercise for the day. 3. Eat only light warm food and drink warm cumin water. 4. Take full rest and avoid loud noise and long mobile use. If anything feels unusual, please call the clinic.`
  }

  if (therapy && intent === 'duration') {
    return `Your ${therapy.name} session takes about ${therapy.defaultDurationMins} minutes, and usually ${therapy.defaultSessionCount} sessions are planned. The exact number can change as per your Vaidya (doctor) advice and your progress, so please follow your plan dates.`
  }

  if (therapy && intent === 'benefits') {
    return `Namaste, ${therapy.name} in simple words is like this. ${simplify(therapy.description)} It is done in the ${therapy.stage} stage of your treatment. Your doctor selected it for your body type and problem, so regular sessions give the best and safest result.`
  }

  if (therapy && (intent === 'what-is' || intent === 'general' || intent === 'basics')) {
    return `Namaste, ${therapy.name} is easy to understand. ${simplify(therapy.description)} It takes about ${therapy.defaultDurationMins} minutes per sitting. Before it, ${lowerFirst(simplify(therapy.preparationRequirements))} After it, ${lowerFirst(simplify(therapy.postTreatmentInstructions))} Please follow your doctor plan for the number of sittings.`
  }

  if (intent === 'safety') {
    return `Namaste, your safety is our first care. 1. All therapies here are done by trained therapists under doctor guidance. 2. Please inform us about pregnancy, periods, fever, heart problem, high BP, allergy, or any new medicine before the session. 3. Mild tiredness or sleepiness after therapy is common and settles with rest and warm food. 4. If you get strong pain, vomiting, giddiness, or rash, tell the therapist at once and meet your Vaidya (doctor).`
  }

  if (intent === 'rooms') {
    const names = THERAPY_ROOMS.map((r) => r.name).join(', ')
    return `Namaste, our centre has separate clean rooms for each therapy for your comfort and hygiene. 1. Our rooms are ${names}. 2. Each room has its own Droni (therapy table), oil warmer, and attached wash. 3. The front desk will tell you your room name before the session, please wait in the calm waiting area. We keep everything warm and private for you.`
  }

  if (intent === 'basics') {
    return `Namaste, Panchakarma in simple words means five step deep cleansing of the body. 1. The five main cleansings are Vamana (gentle vomiting to clear Kapha), Virechana (loose motions to clear Pitta), Basti (medicated enema, best for Vata), Nasya (nose drops for head and sinus), and Raktamokshana (blood purification). 2. Treatment moves in three stages, Purva Karma (oil and steam preparation), Pradhana Karma (main cleansing), and Paschat Karma (diet and rest to rebuild strength). 3. Your Prakriti (birth constitution) and Vikriti (current imbalance) decide which therapy suits you. Your doctor plan already has this selected for you.`
  }

  if (therapy) {
    return `Namaste, here is ${therapy.name} in simple words. ${simplify(therapy.description)} Before the session, ${lowerFirst(simplify(therapy.preparationRequirements))} After the session, ${lowerFirst(simplify(therapy.postTreatmentInstructions))} Each sitting is about ${therapy.defaultDurationMins} minutes. Please follow your doctor plan and ask us anytime you have doubt.`
  }

  return `Namaste${firstName ? ' ' + firstName : ''}, thank you for asking. Every treatment here is planned as per your Prakriti (body constitution) and your current stage, so the safest advice is personal. Please ask me the therapy name, for example what to do before Abhyanga, what to eat before Basti, or what to avoid after Shirodhara, and I will explain step by step in simple words. For medicine changes or health problems, please meet your Vaidya (doctor).`
}

function simplify(text) {
  if (!text) return 'please follow your doctor instruction'
  return text.replace(/\s+/g, ' ').trim().replace(/\.$/, '')
}

function lowerFirst(text) {
  if (!text) return text
  return text.charAt(0).toLowerCase() + text.slice(1)
}

// ─── Formatting: clean human chat text, never markdown ────────────────────

export function cleanText(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[•·▪▶-]\s+/gm, '')
    .replace(/[•·▪▶]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatReply(raw, query = '') {
  const text = cleanText(raw)
  if (!text) return 'Namaste, I am here to help. Please ask about your therapy, food, or preparation, and I will explain in simple words.'
  // Already numbered → just return cleaned
  if (/\n?\d\.\s/.test(text)) return text
  const words = text.split(/\s+/).length
  const isLong = words > 60 || /before|after|prepare|diet|eat|steps|care|avoid/i.test(query + ' ' + text.slice(0, 120))
  if (!isLong) return text
  // Convert sentence list into gentle numbered points
  const parts = text.split(/(?<=[.])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean)
  if (parts.length <= 2) return text
  const [intro, ...rest] = parts
  return `${intro}\n${rest.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
}

// ─── Main entry — live answers only, nothing is stored ─────────────────────

export async function answerQuestion(query, user, opts = {}) {
  const q = (query || '').trim()
  if (!q) throw new Error('Please type a question.')
  const timeoutMs = opts.timeoutMs || 20000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let ctx = null
  try {
    ctx = await buildPersonalContext(user)
  } catch { ctx = null }

  if (hasApiKey()) {
    try {
      const raw = await callGroq(q, ctx, controller.signal)
      clearTimeout(timer)
      return { text: formatReply(raw, q), source: 'groq', model: GROQ_MODEL, personal: !!ctx }
    } catch (err) {
      if (err?.name === 'AbortError') {
        clearTimeout(timer)
        return { text: formatReply(answerLocal(q, ctx), q), source: 'local-timeout', model: 'offline', personal: !!ctx }
      }
      // NO_KEY / GROQ_ERROR / network fail → fall through to local below
    }
  }

  clearTimeout(timer)
  return { text: formatReply(answerLocal(q, ctx), q), source: hasApiKey() ? 'local-fallback' : 'local-no-key', model: 'offline', personal: !!ctx }
}

// Backwards-compatible export used by older tests/pages
export async function generateAyurvedicResponse(query, user) {
  const ans = await answerQuestion(query, user)
  return ans.text
}
