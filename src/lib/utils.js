// Alphabet sans caractères ambigus (pas de 0/O, 1/I/L)
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateGroupCode(length = 6) {
  let code = ''
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  }
  return code
}

export function normalizeCode(input) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Compresse une image en JPEG base64 pour la stocker directement dans
 * Firestore (limite de 1 Mo par document). Réduit la dimension et la
 * qualité jusqu'à passer sous maxChars.
 */
export async function compressImage(file, { maxDim = 720, quality = 0.75, maxChars = 380_000 } = {}) {
  const dataUrl = await readAsDataURL(file)
  const img = await loadImage(dataUrl)

  let dim = maxDim
  let q = quality
  let result = drawToJpeg(img, dim, q)

  while (result.length > maxChars && (dim > 240 || q > 0.4)) {
    if (q > 0.4) q -= 0.1
    else dim = Math.round(dim * 0.8)
    result = drawToJpeg(img, dim, q)
  }

  if (result.length > maxChars) {
    throw new Error("L'image est trop lourde, même compressée. Essaie une photo plus petite.")
  }
  return result
}

function drawToJpeg(img, maxDim, quality) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Ce fichier n'est pas une image valide"))
    img.src = src
  })
}

export function formatPrice(value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (Number.isNaN(num)) return null
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num)
}
