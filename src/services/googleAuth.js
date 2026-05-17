const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '684481615293-5ah46hm3dccnfbqj4rbuga2knpvtevma.apps.googleusercontent.com'
let initialized = false

export function getGoogleCredential() {
  const raw = sessionStorage.getItem('google_credential')
  if (!raw) return null
  sessionStorage.removeItem('google_credential')
  try { return JSON.parse(raw) } catch { return null }
}

export function renderGoogleButton(containerId, onSuccess) {
  if (!CLIENT_ID) return
  if (typeof google === 'undefined' || !google.accounts) return

  const container = document.getElementById(containerId)
  if (!container || container.hasChildNodes()) return

  if (!initialized) {
    initialized = true
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          const payload = parseJwt(response.credential)
          sessionStorage.setItem('google_credential', JSON.stringify(payload))
          onSuccess(response.credential)
        }
      },
    })
  }

  google.accounts.id.renderButton(container, {
    type: 'standard',
    shape: 'pill',
    theme: 'outline',
    size: 'large',
  })
}

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}
