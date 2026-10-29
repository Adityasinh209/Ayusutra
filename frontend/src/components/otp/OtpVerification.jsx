import { useEffect, useRef, useState } from 'react'
import Button from '../Button.jsx'
import { canonicalPhone, sendOtp, verifyOtp } from '../../services/otp.js'

export default function OtpVerification({ mobile, purpose, verifiedToken, onVerified, onChangeNumber }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [sent, setSent] = useState(null)
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [busy, setBusy] = useState(false)
  const boxes = useRef([])

  useEffect(() => {
    if (!seconds) return undefined
    const timer = window.setInterval(() => setSeconds((value) => Math.max(value - 1, 0)), 1000)
    return () => window.clearInterval(timer)
  }, [seconds])

  function fillDigit(index, value) {
    const next = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => prev.map((digit, i) => (i === index ? next : digit)))
    if (next && boxes.current[index + 1]) boxes.current[index + 1].focus()
  }

  async function requestCode() {
    setBusy(true)
    setError('')
    try {
      const result = await sendOtp(mobile, purpose)
      setSent(result)
      setSeconds(result.resendAfterSeconds || 30)
      setDigits(['', '', '', '', '', ''])
      onVerified('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmCode() {
    setBusy(true)
    setError('')
    try {
      const result = await verifyOtp(mobile, purpose, digits.join(''))
      onVerified(result.verificationToken)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  let ready = false
  try {
    canonicalPhone(mobile)
    ready = true
  } catch {
    ready = false
  }

  if (verifiedToken) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Mobile number verified.
        <button type="button" className="ml-3 font-semibold underline" onClick={onChangeNumber}>Change Mobile Number</button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-warm-200 bg-warm-50 p-4">
      <p className="text-sm font-semibold text-warm-800">Verify mobile number</p>
      <p className="mt-1 text-xs text-warm-500">Registration stays incomplete until this 6-digit OTP is verified. Demo code: 123456.</p>
      {sent?.debugOtp && <p className="mt-2 text-xs font-semibold text-green-700">Demo OTP: {sent.debugOtp}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!sent ? (
        <Button type="button" className="mt-3" disabled={!ready || busy} onClick={requestCode}>Send OTP</Button>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => { boxes.current[index] = node }}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                aria-label={`OTP digit ${index + 1}`}
                onChange={(e) => fillDigit(index, e.target.value)}
                className="h-12 w-10 rounded-xl border border-warm-300 text-center text-lg font-bold text-warm-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100"
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy || digits.join('').length !== 6} onClick={confirmCode}>Verify OTP</Button>
            <Button type="button" variant="secondary" disabled={busy || seconds > 0} onClick={requestCode}>
              {seconds > 0 ? `Resend OTP (${seconds}s)` : 'Resend OTP'}
            </Button>
            <Button type="button" variant="ghost" onClick={onChangeNumber}>Change Mobile Number</Button>
          </div>
        </div>
      )}
    </div>
  )
}
