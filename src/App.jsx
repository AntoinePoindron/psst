import { createContext, useContext, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GroupPage from './pages/GroupPage'
import JoinPage from './pages/JoinPage'
import PseudoModal from './components/PseudoModal'
import AuthGate from './components/AuthGate'
import {
  clearSession,
  getProfile,
  saveProfile,
  setJoinedGroupIds,
  setProfile as storeProfile,
} from './lib/profile'
import { setAccountPseudo } from './lib/db'

const ProfileContext = createContext(null)
export const useProfile = () => useContext(ProfileContext)

export default function App() {
  const [profile, setProfile] = useState(getProfile)
  const [editingPseudo, setEditingPseudo] = useState(false)

  // Inscription ou connexion réussie : on installe la session localement.
  const handleAuthenticated = ({ profile, groupIds }) => {
    storeProfile(profile)
    setJoinedGroupIds(groupIds)
    setProfile(profile)
  }

  const updatePseudo = (pseudo) => {
    const next = saveProfile(pseudo)
    setProfile(next)
    setEditingPseudo(false)
    if (next.username) {
      setAccountPseudo(next.username, next.pseudo).catch(() => {
        /* synchro best-effort : le pseudo local reste à jour */
      })
    }
  }

  const logout = () => {
    clearSession()
    setProfile(null)
  }

  // Première visite : créer un compte ou se reconnecter.
  if (!profile) {
    return <AuthGate onAuthenticated={handleAuthenticated} />
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      <div className="shell">
        <header className="topbar">
          <Link to="/" className="brand">
            Psst<em>&nbsp;!</em>
          </Link>
          <div className="topbar-actions">
            <button
              className="whoami"
              onClick={() => setEditingPseudo(true)}
              title="Changer mon prénom"
            >
              <span aria-hidden="true">🙂</span> {profile.pseudo}
            </button>
            <button className="btn-ghost btn-small" onClick={logout} title="Se déconnecter">
              Déconnexion
            </button>
          </div>
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
