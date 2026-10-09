import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Keep frontend unit tests hermetic: never hit live Groq.
vi.stubEnv('VITE_GROQ_API_KEY', '')

// Mock localStorage for tests
class LocalStorageMock {
  constructor() {
    this.store = {}
  }
  clear() { this.store = {} }
  getItem(key) { return this.store[key] ?? null }
  setItem(key, value) { this.store[key] = String(value) }
  removeItem(key) { delete this.store[key] }
}

global.localStorage = new LocalStorageMock()

beforeEach(() => {
  localStorage.clear()
})
