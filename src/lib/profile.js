import { setAccountGroups } from './db'
import { uuid } from './utils'

const PROFILE_KEY = 'psst-profile'
const GROUPS_KEY = 'psst-groups'

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* localStorage indisponible ou corrompu */
  }
  return null
}

/** Écrit le profil complet (utilisé après inscription / connexion). */
export function setProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

export function saveProfile(pseudo) {
  const existing = getProfile()
  const profile = { ...(existing || {}), id: existing?.id || uuid(), pseudo: pseudo.trim() }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

/** Déconnexion : on oublie le profil et les groupes de cet appareil. */
export function clearSession() {
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(GROUPS_KEY)
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

/** Remplace la liste locale (utilisé pour restaurer la session à la connexion). */
export function setJoinedGroupIds(ids) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(ids))
}

export function rememberGroup(groupId) {
  const ids = getJoinedGroupIds()
  if (!ids.includes(groupId)) {
    ids.push(groupId)
    localStorage.setItem(GROUPS_KEY, JSON.stringify(ids))
    syncGroups(ids)
  }
}

export function forgetGroup(groupId) {
  const ids = getJoinedGroupIds().filter((id) => id !== groupId)
  localStorage.setItem(GROUPS_KEY, JSON.stringify(ids))
  syncGroups(ids)
}

/** Pousse la liste des groupes vers le compte cloud (best-effort). */
function syncGroups(ids) {
  const profile = getProfile()
  if (profile?.username) {
    setAccountGroups(profile.username, ids).catch(() => {
      /* hors-ligne : la liste locale reste la référence */
    })
  }
}
