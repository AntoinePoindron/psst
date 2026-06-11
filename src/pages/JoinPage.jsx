import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProfile } from '../App'
import { findGroupByCode, joinGroup } from '../lib/db'
import { rememberGroup } from '../lib/profile'
import { normalizeCode } from '../lib/utils'

export default function JoinPage() {
  const { code } = useParams()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const group = await findGroupByCode(normalizeCode(code))
        if (cancelled) return
        if (!group) {
          setError("Ce lien d'invitation ne correspond à aucun groupe. Demande un nouveau lien à la personne qui t'a invité·e.")
          return
        }
        await joinGroup(group.id, profile)
        rememberGroup(group.id)
        navigate(`/groupe/${group.id}`, { replace: true })
      } catch {
        if (!cancelled) {
          setError('Impossible de rejoindre le groupe pour le moment. Vérifie ta connexion et recharge la page.')
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [code, profile, navigate])

  if (error) {
    return (
      <div className="empty" style={{ marginTop: 40 }} role="alert">
        {error}
      </div>
    )
  }
  return <div className="page-loading">On t'installe dans le groupe…</div>
}
