import { createContext, useContext, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GroupPage from './pages/GroupPage'
import JoinPage from './pages/JoinPage'
import PseudoModal from './components/PseudoModal'
import { getProfile, saveProfile } from './lib/profile'

const ProfileContext = createContext(null)
export const useProfile = () => useContext(ProfileContext)

export default function App() {
  const [profile, setProfile] = useState(getProfile)
  const [editingPseudo, setEditingPseudo] = useState(false)

  const updatePseudo = (pseudo) => {
    setProfile(saveProfile(pseudo))
    setEditingPseudo(false)
  }

  // Premier passage : on demande juste un prénom, rien d'autre.
  if (!profile) {
    return (
      <div className="shell">
        <div className="onboard">
          <div className="wave" aria-hidden="true">
            👋
          </div>
          <h1>Bienvenue sur Psst&nbsp;!</h1>
          <p>
            Ici, chacun note ses envies de cadeaux, et les autres s'organisent en
            secret. Comment tes proches t'appellent-ils&nbsp;?
          </p>
          <PseudoForm onSubmit={updatePseudo} />
        </div>
      </div>
    )
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      <div className="shell">
        <header className="topbar">
          <Link to="/" className="brand">
            Psst<em>&nbsp;!</em>
          </Link>
          <button
            className="whoami"
            onClick={() => setEditingPseudo(true)}
            title="Changer mon prénom"
          >
            <span aria-hidden="true">🙂</span> {profile.pseudo}
          </button>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/groupe/:groupId" element={<GroupPage />} />
          <Route path="/rejoindre/:code" element={<JoinPage />} />
        </Routes>
      </div>

      {editingPseudo && (
        <PseudoModal
          current={profile.pseudo}
          onSave={updatePseudo}
          onClose={() => setEditingPseudo(false)}
        />
      )}
    </ProfileContext.Provider>
  )
}

function PseudoForm({ onSubmit }) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (value.trim().length >= 2) onSubmit(value)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <div className="field">
        <label htmlFor="pseudo">Mon prénom ou surnom</label>
        <input
          id="pseudo"
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Antoine, Mamie Jo, Tonton…"
          maxLength={24}
          autoFocus
        />
        <p className="hint">Pas de compte, pas de mot de passe. C'est tout.</p>
      </div>
      <button type="submit" className="btn btn-primary" disabled={value.trim().length < 2} style={{ width: '100%' }}>
        C'est parti 🎁
      </button>
    </form>
  )
}
