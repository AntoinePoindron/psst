import { formatPrice } from '../lib/utils'

export default function ItemCard({
  item,
  isMine,
  myId,
  onEdit,
  onDelete,
  onReserve,
  onCancelReservation,
}) {
  const price = formatPrice(item.price)
  const reserved = Boolean(item.reservedBy)
  const reservedByMe = item.reservedBy === myId
  // Règle d'or : le propriétaire ne voit JAMAIS l'état de réservation
  const showReservation = !isMine

  return (
    <article className={`item-row${showReservation && reserved ? ' is-reserved' : ''}`}>
      <div className="item-thumb">
        {item.photo ? (
          <img src={item.photo} alt={item.name} loading="lazy" />
        ) : (
          <span aria-hidden="true">🎁</span>
        )}
      </div>
      <div className="item-content">
        <h3>{item.name}</h3>
        {item.note && <p className="item-note">{item.note}</p>}
        <div className="item-meta">
          {price && <span className="price-pill">{price}</span>}
          {item.url && (
            <a className="link-out" href={item.url} target="_blank" rel="noopener noreferrer">
              Voir l'article ↗
            </a>
          )}
        </div>

        <div className="item-actions">
          {isMine ? (
            <>
              <button className="btn btn-ghost btn-small" onClick={onEdit}>
                Modifier
              </button>
              <button className="btn btn-danger-ghost btn-small" onClick={onDelete}>
                Retirer
              </button>
            </>
          ) : showReservation && reserved ? (
            reservedByMe ? (
              <>
                <span className="reserved-banner">🤫 Tu offres ce cadeau</span>
                <button className="btn btn-ghost btn-small" onClick={onCancelReservation}>
                  Annuler
                </button>
              </>
            ) : (
              <span className="reserved-banner">🤫 {item.reservedByPseudo} s'en occupe</span>
            )
          ) : (
            <button className="btn btn-soft btn-small" onClick={onReserve}>
              Je l'offre 🎁
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
