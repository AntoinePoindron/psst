import { useEffect, useState } from 'react'

export default function PseudoModal({ current, onSave, onClose }) {
  const [value, setValue] = useState(current)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Changer mon prénom">
        <h2>Changer mon prénom</h2>
        <div className="field">
          <label htmlFor="pseudo-edit">Comment tes proches t'appellent-ils ?</label>
          <input
            id="pseudo-edit"
            className="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={24}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && value.trim().length >= 2 && onSave(value)}
          />
          <p className="hint">Ton nouveau prénom sera mis à jour dans tes groupes à ta prochaine visite.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={() => onSave(value)} disabled={value.trim().length < 2}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
