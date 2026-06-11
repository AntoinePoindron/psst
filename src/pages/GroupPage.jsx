import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProfile } from '../App'
import ItemCard from '../components/ItemCard'
import ItemModal from '../components/ItemModal'
import {
  addItem,
  cancelReservation,
  deleteItem,
  listenGroup,
  listenItems,
  listenMembers,
  reserveItem,
  updateItem,
  updateMemberPseudo,
} from '../lib/db'
import { rememberGroup } from '../lib/profile'

export default function GroupPage() {
  const { groupId } = useParams()
  const { profile } = useProfile()

  const [group, setGroup] = useState(undefined) // undefined = chargement, null = introuvable
  const [members, setMembers] = useState([])
  const [items, setItems] = useState([])
  const [activeId, setActiveId] = useState(profile.id)
  const [modal, setModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', item }
  const [copied, setCopied] = useState(null)
  const copyTimer = useRef(null)

  useEffect(() => {
    const offGroup = listenGroup(groupId, setGroup)
    const offMembers = listenMembers(groupId, setMembers)
    const offItems = listenItems(groupId, setItems)
    return () => {
      offGroup()
      offMembers()
      offItems()
    }
  }, [groupId])

  // Garde le pseudo du membre synchronisé si l'utilisateur l'a changé
  useEffect(() => {
    if (group && members.some((m) => m.id === profile.id && m.pseudo !== profile.pseudo)) {
      updateMemberPseudo(groupId, profile)
    }
  }, [group, members, profile, groupId])

  useEffect(() => {
    if (group) rememberGroup(group.id)
  }, [group])

  // Si le membre actif a disparu, on revient sur soi
  useEffect(() => {
    if (members.length > 0 && !members.some((m) => m.id === activeId)) {
      setActiveId(profile.id)
    }
  }, [members, activeId, profile.id])

  const itemsByOwner = useMemo(() => {
    const map = {}
    for (const item of items) {
      ;(map[item.ownerId] ||= []).push(item)
    }
    return map
  }, [items])

  const orderedMembers = useMemo(() => {
    const me = members.filter((m) => m.id === profile.id)
    const others = members.filter((m) => m.id !== profile.id)
    return [...me, ...others]
  }, [members, profile.id])

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(null), 2500)
    } catch {
      /* clipboard indisponible : on ignore */
    }
  }

  const handleSave = async (data) => {
    if (modal?.mode === 'edit') {
      await updateItem(groupId, modal.item.id, data)
    } else {
      await addItem(groupId, profile, data)
    }
    setModal(null)
  }

  const handleDelete = async (item) => {
    if (window.confirm(`Retirer « ${item.name} » de ta liste ?`)) {
      await deleteItem(groupId, item.id)
    }
  }

  if (group === undefined) {
    return <div className="page-loading">Ouverture du groupe…</div>
  }
  if (group === null) {
    return (
      <div className="empty" style={{ marginTop: 40 }}>
        <span className="doodle" aria-hidden="true">
          🫥
        </span>
        <strong>Ce groupe n'existe plus.</strong>
        <br />
        Il a peut-être été supprimé, ou le lien est erroné.
      </div>
    )
  }

  const inviteLink = `${window.location.origin}/rejoindre/${group.code}`
  const activeMember = orderedMembers.find((m) => m.id === activeId)
  const isMe = activeId === profile.id
  const activeItems = itemsByOwner[activeId] || []

  return (
    <main>
      <div className="group-header">
        <h1>{group.name}</h1>
        <p className="members-line">
          {members.length} membre{members.length > 1 ? 's' : ''}
        </p>
        <div className="code-row">
          <div className="code-chip">
            <span className="tag-label">Code</span>
            <span className="tag-code">{group.code}</span>
          </div>
          <div className="code-actions">
            <button className="btn btn-on-blue btn-small" onClick={() => copy(group.code, 'code')}>
              Copier le code
            </button>
            <button className="btn btn-on-blue btn-small" onClick={() => copy(inviteLink, 'lien')}>
              Copier le lien
            </button>
            {copied && (
              <span className="copy-feedback">
                ✓ {copied === 'code' ? 'Code copié' : "Lien d'invitation copié"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="member-tabs" role="tablist" aria-label="Listes des membres">
        {orderedMembers.map((member) => {
          const mine = member.id === profile.id
          const count = (itemsByOwner[member.id] || []).length
          return (
            <button
              key={member.id}
              role="tab"
              aria-selected={member.id === activeId}
              className={`member-tab${member.id === activeId ? ' active' : ''}`}
              onClick={() => setActiveId(member.id)}
            >
              <span className="avatar">
                {member.pseudo.slice(0, 1).toUpperCase()}
                {count > 0 && <span className="badge">{count}</span>}
              </span>
              {mine ? 'Moi' : member.pseudo}
            </button>
          )
        })}
      </div>

      <div className="list-heading">
        <h2>{isMe ? 'Ma liste' : `Liste de ${activeMember?.pseudo ?? '…'}`}</h2>
        <span className="count">
          {activeItems.length} idée{activeItems.length > 1 ? 's' : ''}
        </span>
      </div>

      {activeItems.length === 0 ? (
        <div className="empty">
          <span className="doodle" aria-hidden="true">
            {isMe ? '✍️' : '⏳'}
          </span>
          {isMe ? (
            <>
              <strong>Ta liste est vide.</strong>
              <br />
              Ajoute une première idée : un nom suffit, le reste est optionnel.
            </>
          ) : (
            <>{activeMember?.pseudo} n'a pas encore noté d'idée. Repasse plus tard&nbsp;!</>
          )}
        </div>
      ) : (
        <div className="item-list">
          {activeItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isMine={isMe}
              myId={profile.id}
              onEdit={() => setModal({ mode: 'edit', item })}
              onDelete={() => handleDelete(item)}
              onReserve={() => reserveItem(groupId, item.id, profile)}
              onCancelReservation={() => cancelReservation(groupId, item.id)}
            />
          ))}
        </div>
      )}

      {isMe && (
        <div className="bottom-cta">
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>
            + Ajouter une idée
          </button>
        </div>
      )}

      {modal && (
        <ItemModal
          initial={modal.mode === 'edit' ? modal.item : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </main>
  )
}
