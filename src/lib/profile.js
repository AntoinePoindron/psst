const PROFILE_KEY = 'psst-profile'
const GROUPS_KEY = 'psst-groups'

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* localStorage indisponible ou corrompu */
  }
  return null
}

export function saveProfile(pseudo) {
  const existing = getProfile()
  const profile = { id: existing?.id || uuid(), pseudo: pseudo.trim() }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

export function getJoinedGroupIds() {
  try {
    const raw = localStorage.getItem(GROUPS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return []
}

export function rememberGroup(groupId) {
  const ids = getJoinedGroupIds()
  if (!ids.includes(groupId)) {
    ids.push(groupId)
    localStorage.setItem(GROUPS_KEY, JSON.stringify(ids))
  }
}

export function forgetGroup(groupId) {
  const ids = getJoinedGroupIds().filter((id) => id !== groupId)
  localStorage.setItem(GROUPS_KEY, JSON.stringify(ids))
}
