import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../App'
import { createGroup, findGroupByCode, getGroup, joinGroup } from '../lib/db'
import { getJoinedGroupIds, forgetGroup, rememberGroup } from '../lib/profile'
import { normalizeCode } from '../lib/utils'

const GROUP_EMOJIS = ['🎁', '🎂', '🎄', '✨', '🥳', '💝', '🎈', '🪅']

export default function HomePage() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [groups, setGroups] = useState(null)

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const ids = getJoinedGroupIds()
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await getGroup(id)
          } catch {
            return null
          }
        })
      )
      if (cancelled) return
      // Nettoie les groupes supprimés côté serveur
      ids.forEach((id, i) => {
        if (results[i] === null) forgetGroup(id)
      })
      setGroups(results.filter(Boolean))
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreate = async () => {
    if (newName.trim().length < 2) return
    setCreating(true)
    setError(null)
    try {
      const { id } = await createGroup(newName, profile)
      rememberGroup(id)
      navigate(`/groupe/${id}`)
    } catch {
      setError("La création n'a pas abouti. Vérifie ta connexion et réessaie.")
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    const clean = normalizeCode(code)
    if (clean.length < 4) return
    setJoining(true)
    setError(null)
    try {
      const group = await findGroupByCode(clean)
      if (!group) {
        setError("Aucun groupe ne correspond à ce code. Vérifie-le auprès de la personne qui te l'a envoyé.")
        setJoining(false)
        return
      }
      await joinGroup(group.id, profile)
      rememberGroup(group.id)
      navigate(`/groupe/${group.id}`)
    } catch {
      setError("Impossible de rejoindre le groupe pour l'instant. Réessaie dans un moment.")
      setJoining(false)
    }
  }

  return (
    <main>
      <section className="hero">
        <span className="doodle" aria-hidden="true">🎁</span>
        <h1>
          Des cadeaux qui font <em>vraiment</em> plaisir
        </h1>
        <p>
          Chacun note ses envies. Les autres réservent en secret, et personne ne
          reçoit deux fois la même chose.
        </p>
      </section>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="home-actions">
        <div className="card action-card">
          <h2>
            Créer un <em>groupe</em>
          </h2>
          <p>Famille, Noël, anniversaire… puis invite tes proches avec le code.</p>
          <div className="field">
            <label htmlFor="group-name">Nom du groupe</label>
            <input
              id="group-name"
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Noël famille Dupont"
              maxLength={40}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <button
            className="btn btn-primary btn-block"
            onClick={handleCreate}
            disabled={creating || newName.trim().length < 2}
          >
            {creating ? 'Création…' : 'Créer le groupe'}
          </button>
        </div>

        <div className="card action-card">
          <h2>
            Rejoindre avec un <em>code</em>
          </h2>
          <p>Entre le code à 6 caractères que l'on t'a partagé.</p>
          <div className="field">
            <label htmlFor="join-code">Code du groupe</label>
            <input
              id="join-code"
              className="input input-code"
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value).slice(0, 6))}
              placeholder="ABC123"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>
          <button
            className="btn btn-soft btn-block"
            onClick={handleJoin}
            disabled={joining || normalizeCode(code).length < 4}
          >
            {joining ? 'Recherche…' : 'Rejoindre'}
          </button>
        </div>
      </div>

      <h2 className="section-title">Mes groupes</h2>
      {groups === null ? (
        <div className="page-loading">Chargement de tes groupes…</div>
      ) : groups.length === 0 ? (
        <div className="empty">
          <span className="doodle" aria-hidden="true">📭</span>
          <strong>Aucun groupe pour l'instant.</strong>
          <br />
          Crée ton premier groupe ci-dessus, ou rejoins celui d'un proche avec son code.
        </div>
      ) : (
        <div className="group-list">
          {groups.map((g, i) => (
            <Link key={g.id} to={`/groupe/${g.id}`} className="group-card">
              <span className="emoji" aria-hidden="true">
                {GROUP_EMOJIS[i % GROUP_EMOJIS.length]}
              </span>
              <span>
                <strong>{g.name}</strong>
                <span>Code {g.code}</span>
              </span>
              <span className="chev" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
