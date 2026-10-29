const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
let token = ''

export function setApiToken(value) {
  token = value || ''
}

export function hasApiToken() {
  return Boolean(token)
}

/** Remote API is used only when configured and a Clerk token is present. */
export function remoteReady() {
  return Boolean(base) && Boolean(token)
}

export async function apiUpload(path, formData) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(typeof data.detail === 'string' ? data.detail : 'Upload failed.')
    err.status = res.status
    throw err
  }
  return data
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(typeof data.detail === 'string' ? data.detail : 'Request failed.')
    err.status = res.status
    throw err
  }
  return data
}
