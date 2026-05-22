const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '684481615293-5ah46hm3dccnfbqj4rbuga2knpvtevma.apps.googleusercontent.com'
const NONCE_KEY = 'google_oauth_nonce'

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

function generateNonce() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('')
}

export function getGoogleCredential() {
  const hash = window.location.hash
  if (!hash || !hash.includes('id_token=')) return null

  const params = new URLSearchParams(hash.replace('#', '?'))
  const token = params.get('id_token')
  if (!token) return null

  const savedNonce = sessionStorage.getItem(NONCE_KEY)
  sessionStorage.removeItem(NONCE_KEY)

  history.replaceState(null, '', window.location.pathname + window.location.search)

  try {
    const payload = parseJwt(token)
    if (savedNonce && payload.nonce !== savedNonce) return null
    return token
  } catch {
    return null
  }
}

export function renderGoogleButton(containerId, onSuccess) {
  if (!CLIENT_ID) return

  const container = document.getElementById(containerId)
  if (!container || container.hasChildNodes()) return

  const btn = document.createElement('button')
  btn.setAttribute('type', 'button')
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-2.5 7-9 12-17.3 12-9.9 0-18-8.1-18-18s8.1-18 18-18c4.6 0 8.8 1.7 12 4.5L33 7.3C28.8 3.8 23.2 1.5 17 1.5 7.6 1.5 0 9.1 0 18.5S7.6 35.5 17 35.5c8.3 0 15.4-5.4 17.7-13H17v-2.4h26.6z"/><path fill="#FF3D00" d="M2.5 11.3 8.7 15.9C11.1 10.6 16.2 7 22.1 7c4.6 0 8.8 1.7 12 4.5l5.7-5.7C35.7 2.7 29.2 0 22.1 0 13.2 0 5.5 4.8 2.5 11.3z"/><path fill="#4CAF50" d="M17 35.5c-6.5 0-12.2-4-14.5-9.7l-7.4 5.8C2.7 38.7 9.5 44 17 44c7.3 0 13.4-3.7 17.1-9.3l-6.8-5.3c-2.3 3.3-5.9 5.4-10.3 5.4z"/><path fill="#1976D2" d="M46.1 18.5H44V18H24v8h11.3c-1.2 3.3-3.6 6.1-6.7 7.8l.1.1 6.5 5c4.7-4.4 7.7-10.8 7.7-17.9 0-1.1-.1-2.2-.3-3.3z"/></svg> Sign in with Google`
  btn.className = 'flex items-center justify-center gap-2 w-full border border-gray-300 bg-white text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 hover:shadow-sm active:bg-gray-100 transition-all cursor-pointer'
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    const nonce = generateNonce()
    sessionStorage.setItem(NONCE_KEY, nonce)
    const redirectUri = window.location.origin + window.location.pathname
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce,
      access_type: 'online',
    })
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString()
  })
  container.appendChild(btn)
}
