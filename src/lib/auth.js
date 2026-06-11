import { createAccount, getAccount } from './db'
import { uuid } from './utils'

/*
 * Authentification « simple » par nom d'utilisateur + mot de passe.
 *
 * Un compte est un document Firestore `accounts/{username}` qui conserve
 * l'identité stable de la personne (profileId, réutilisé partout comme
 * identifiant de membre / propriétaire d'article) ainsi que la liste de ses
 * groupes. Se connecter sur un autre appareil restaure donc toute la session.
 *
 * Note de sécurité : le mot de passe est dérivé côté client (PBKDF2 + sel) et
 * seul le hash est envoyé à Firestore. C'est volontairement léger et adapté à
 * une petite app entre proches — ce n'est pas un système d'auth de niveau
 * bancaire (pas de vérification serveur, base lisible selon les règles
 * Firestore). Pour durcir, on passerait à Firebase Authentication.
 */

const enc = new TextEncoder()
const PBKDF2_ITERATIONS = 100_000

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

function randomSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes)
}

async function hashPassword(password, saltHex) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  return toHex(bits)
}

export function normalizeUsername(input) {
  return input.trim().toLowerCase()
}

/** Crée un compte et renvoie la session { profile, groupIds }. */
export async function register({ username, password, pseudo }) {
  const id = normalizeUsername(username)
  if (id.length < 3) throw new Error('Le nom d’utilisateur doit faire au moins 3 caractères.')
  if (password.length < 4) throw new Error('Le mot de passe doit faire au moins 4 caractères.')
  if (pseudo.trim().length < 2) throw new Error('Indique un prénom ou surnom.')

  if (await getAccount(id)) {
    throw new Error('Ce nom d’utilisateur est déjà pris.')
  }

  const salt = randomSalt()
  const passwordHash = await hashPassword(password, salt)
  const profileId = uuid()

  await createAccount(id, {
    usernameDisplay: username.trim(),
    pseudo: pseudo.trim(),
    profileId,
    salt,
    passwordHash,
    groupIds: [],
  })

  return {
    profile: { id: profileId, pseudo: pseudo.trim(), username: id },
    groupIds: [],
  }
}

/** Vérifie les identifiants et renvoie la session { profile, groupIds }. */
export async function login({ username, password }) {
  const id = normalizeUsername(username)
  const account = await getAccount(id)
  if (!account) {
    throw new Error('Aucun compte ne correspond à ce nom d’utilisateur.')
  }

  const hash = await hashPassword(password, account.salt)
  if (hash !== account.passwordHash) {
    throw new Error('Mot de passe incorrect.')
  }

  return {
    profile: { id: account.profileId, pseudo: account.pseudo, username: id },
    groupIds: account.groupIds || [],
  }
}
