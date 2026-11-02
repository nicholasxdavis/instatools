export const API_ORIGIN = 'https://instatools-api.nic-58f.workers.dev'
export const SESSION_KEY = 'instatools.session'

export function getSession() {
  try {
    return localStorage.getItem(SESSION_KEY) || ''
  } catch {
    return ''
  }
}

export function setSession(token) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  const auth = token === undefined ? getSession() : token
  if (auth) headers.Authorization = `Bearer ${auth}`
  if (body) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${API_ORIGIN}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed')
    error.status = response.status
    error.data = data
    throw error
  }
  return data
}
