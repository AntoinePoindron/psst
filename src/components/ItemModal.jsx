import { useEffect, useRef, useState } from 'react'
import { compressImage } from '../lib/utils'

export default function ItemModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [price, setPrice] = useState(initial?.price ?? '')
  const [url, setUrl] = useState(initial?.url || '')
  const [note, setNote] = useState(initial?.note || '')
  const [photo, setPhoto] = useState(initial?.photo || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleFile = async (file) => {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      setPhoto(await compressImage(file))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async () => {
    if (name.trim().length < 2) return
    if (url && !/^https?:\/\//i.test(url.trim())) {
      setError('Le lien doit commencer par http:// ou https://')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({ name, price, url, note, photo })
    } catch {
      setError("L'enregistrement n'a pas abouti. Vérifie ta connexion et réessaie.")
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={initial ? 'Modifier une idée' : 'Ajouter une idée'}>
        <h2>{initial ? 'Modifier cette idée' : 'Une nouvelle envie ?'}</h2>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="item-name">Nom du cadeau *</label>
          <input
            id="item-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Casque Sony WH-1000XM5"
            maxLength={80}
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="item-price">Prix approximatif (€)</label>
          <input
            id="item-price"
            className="input"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="49.90"
          />
        </div>

        <div className="field">
          <label htmlFor="item-url">Lien pour l'acheter</label>
          <input
            id="item-url"
            className="input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="field">
          <label htmlFor="item-note">Petite précision</label>
          <textarea
            id="item-note"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Couleur noire de préférence, taille M…"
            maxLength={200}
          />
        </div>

        <div className="field">
          <label>Photo</label>
          {photo ? (
            <div className="photo-preview">
              <img src={photo} alt="Aperçu du cadeau" />
              <button className="btn btn-secondary btn-small" onClick={() => setPhoto(null)}>
                Retirer
              </button>
            </div>
          ) : (
            <div
              className="photo-drop"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFile(e.dataTransfer.files?.[0])
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
            >
              {busy ? 'Compression de la photo…' : '📷 Clique ou dépose une photo ici'}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <p className="hint">La photo est compressée automatiquement, pas besoin de la retoucher.</p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={busy || name.trim().length < 2}>
            {busy ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter à ma liste'}
          </button>
        </div>
      </div>
    </div>
  )
}
