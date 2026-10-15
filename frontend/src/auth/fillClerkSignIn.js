function isVisibleField(el) {
  if (!el) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function setReactInputValue(el, value) {
  if (!el) return false
  el.focus()
  const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
  descriptor?.set?.call(el, value)
  el.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      composed: true,
      data: value,
      inputType: 'insertFromPaste',
    }),
  )
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return el.value === value
}

export function getClerkIdentifierInput() {
  return document.querySelector('#identifier-field, input[name="identifier"]')
}

export function getClerkPasswordInput() {
  return document.querySelector('#password-field, input[name="password"], input[type="password"]')
}

export function fillClerkIdentifier(email) {
  const el = getClerkIdentifierInput()
  if (!isVisibleField(el) || el.value === email) return Boolean(el && el.value === email)
  return setReactInputValue(el, email)
}

export function fillClerkPassword(password) {
  const el = getClerkPasswordInput()
  if (!isVisibleField(el) || el.value === password) return Boolean(el && el.value === password)
  return setReactInputValue(el, password)
}

export function isClerkPasswordStepVisible() {
  return isVisibleField(getClerkPasswordInput())
}

export function isClerkContinueButton(target) {
  const button = target?.closest?.('button')
  if (!button) return false
  const label = (button.textContent || button.getAttribute('aria-label') || '').toLowerCase()
  return label.includes('continue') || label.includes('sign in')
}
