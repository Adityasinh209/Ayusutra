import { describe, it, expect } from 'vitest'
import {
  cleanText,
  formatReply,
  detectTherapy,
  detectIntent,
  answerLocal,
  answerQuestion,
  generateAyurvedicResponse,
  GROQ_MODEL,
} from '../services/assistant.js'

const NO_MARKDOWN = (t) => {
  expect(t).not.toMatch(/\*\*/),
  expect(t).not.toMatch(/(^|\n)#{1,6}\s/),
  expect(t).not.toContain('`')
}

describe('Assistant formatter', () => {
  it('uses the locked Groq model', () => {
    expect(GROQ_MODEL).toBe('openai/gpt-oss-120b')
  })

  it('strips markdown bold and bullets', () => {
    const out = cleanText('**Hello** *world* • point\n# Title\n`code`')
    expect(out).not.toContain('**')
    expect(out).not.toContain('*')
    expect(out).not.toContain('#')
    expect(out).not.toContain('`')
    expect(out).toContain('Hello')
  })

  it('keeps short answers as a paragraph', () => {
    const out = formatReply('Your Abhyanga session takes about 60 minutes in total.', 'how long is abhyanga?')
    NO_MARKDOWN(out)
    expect(out.split('\n').length).toBeLessThanOrEqual(3)
  })

  it('formats long how-to answers as numbered points', () => {
    const raw = 'Namaste, here is how to prepare for Abhyanga. Eat light warm food 2 hours before. Wear loose cotton clothes. Reach 10 minutes early. Tell your therapist about allergy.'
    const out = formatReply(raw, 'what to do before abhyanga?')
    NO_MARKDOWN(out)
    expect(out).toMatch(/1\./)
  })
})

describe('Assistant understanding', () => {
  it('detects all major therapies', () => {
    expect(detectTherapy('what to do before basti?')?.name).toMatch(/Basti/)
    expect(detectTherapy('oil massage preparation')?.name).toMatch(/Abhyanga/)
    expect(detectTherapy('food before nasya')?.name).toMatch(/Nasya/)
    expect(detectTherapy('after shirodhara care')?.name).toMatch(/Shirodhara/)
    expect(detectTherapy('prepare for vamana')?.name).toMatch(/Vamana/)
    expect(detectTherapy('diet for virechana')?.name).toMatch(/Virechana/)
  })

  it('detects intents for prep, diet, after-care, personal', () => {
    expect(detectIntent('what should I eat before my therapy?')).toBe('eat-before')
    expect(detectIntent('how should I prepare for abhyanga?')).toBe('before')
    expect(detectIntent('what to avoid after shirodhara?')).toBe('after')
    expect(detectIntent('when is my next session?')).toBe('my-next')
    expect(detectIntent('what are the 5 procedures?')).toBe('basics')
  })
})

describe('Assistant local answers', () => {
  const therapyQuestions = [
    'what is abhyanga?',
    'what to do before shirodhara?',
    'what to eat before basti?',
    'what to do before nasya?',
    'what to do before swedana?',
    'how to prepare for vamana?',
    'what to eat before virechana?',
    'what is kizhi?',
    'what to do before kati basti?',
    'what to do before janu basti?',
    'what is udvartana?',
  ]

  for (const q of therapyQuestions) {
    it(`answers without markdown: ${q}`, () => {
      const out = answerLocal(q, null)
      expect(out.length).toBeGreaterThan(40)
      NO_MARKDOWN(out)
    })
  }

  it('answers personal next-session from profile', async () => {
    const ans = await answerQuestion('when is my next session?', { patientId: 'patient-1' })
    expect(ans.text.length).toBeGreaterThan(20)
    expect(ans.personal).toBe(true)
    NO_MARKDOWN(ans.text)
  })

  it('answers eat-before question via any source (groq live or offline)', async () => {
    const ans = await answerQuestion('what should I eat before therapy?', { patientId: 'patient-1' })
    expect(['groq', 'local-no-key', 'local-fallback', 'local-timeout']).toContain(ans.source)
    expect(ans.text.length).toBeGreaterThan(20)
    NO_MARKDOWN(ans.text)
  })

  it('offline fallback works with no key configured', () => {
    const out = answerLocal('what should I eat before therapy?', null)
    expect(out.length).toBeGreaterThan(20)
    NO_MARKDOWN(out)
  })

  it('legacy generateAyurvedicResponse returns clean string', async () => {
    const text = await generateAyurvedicResponse('what is basti?', { patientId: 'patient-1' })
    expect(typeof text).toBe('string')
    expect(text.length).toBeGreaterThan(20)
    NO_MARKDOWN(text)
  })
})
