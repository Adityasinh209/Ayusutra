const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
let token = ''
/** @type {() => Promise<string>} */
let resolveBearerToken = async () => token

export function setApiToken(value) {
  token = value || ''
}

export function setApiTokenGetter(getter) {
  resolveBearerToken = getter || (async () => token)
}

export function hasApiToken() {
  return Boolean(token)
}

/** Remote API is used only when configured and a Clerk token is present. */
export function remoteReady() {
  return Boolean(base) && Boolean(token)
}

function apiMessage(data, fallback) {
  const detail = data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((item) => item.msg || item.message || String(item)).join(' ')
  }
  return fallback
}

function isNetworkError(err) {
  const message = String(err?.message || err || '')
  return err instanceof TypeError || /failed to fetch|networkerror|load failed|network request failed/i.test(message)
}

function isAuthRetry(err) {
  const message = String(err?.message || '')
  return err?.status === 401 && /session expired|invalid token|could not verify sign-in|missing token/i.test(message)
}

async function bearerAuthorization() {
  let value = ''
  try {
    value = (await resolveBearerToken()) || token
  } catch {
    value = token
  }
  if (!value && base) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    try {
      value = (await resolveBearerToken()) || token
    } catch {
      value = token
    }
  }
  if (value) token = value
  return value ? `Bearer ${value}` : ''
}

async function requestWithRetry(run) {
  let last
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await run()
    } catch (err) {
      last = err
      const network = isNetworkError(err)
      const authRetry = isAuthRetry(err) && attempt < 2
      if (!(network || authRetry) || attempt === 2) break
      await new Promise((resolve) => setTimeout(resolve, network ? 2500 * (attempt + 1) : 400))
    }
  }
  if (isNetworkError(last)) {
    const err = new Error(
      'Could not reach the clinic API. If Render is waking up, wait 30 seconds and try again. Confirm Vercel VITE_API_URL matches your live Render URL.',
    )
    err.status = 0
    throw err
  }
  throw last
}

async function parseResponse(res, fallback) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(apiMessage(data, fallback))
    err.status = res.status
    throw err
  }
  return data
}

export async function apiUpload(path, formData) {
  return requestWithRetry(async () => {
    const auth = await bearerAuthorization()
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: auth ? { Authorization: auth } : {},
      body: formData,
    })
    return parseResponse(res, 'Upload failed.')
  })
}

export async function api(path, { method = 'GET', body } = {}) {
  return requestWithRetry(async () => {
    const auth = await bearerAuthorization()
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    return parseResponse(res, 'Request failed.')
  })
}
