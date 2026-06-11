import { useState } from 'react'
import { login, register } from '../lib/auth'

export default function AuthGate({ onAuthenticated }) {
  const [mode, setMode] = useState('register')

  return (
    <div className="shell">
      <div className="onboard">
        <div className="wave" aria-hidden="true">
          👋
        </div>
        <h1>Bienvenue sur Psst&nbsp;!</h1>
        <p>
          Ici, chacun note ses envies de cadeaux, et les autres s'organisent en
          secret. Crée un compte pour retrouver tes listes sur tous tes appareils.
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Créer un compte
          </button>
          <button
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Se connecter
          </button>
        </div>

        {mode === 'register' ? (
          <AuthForm key="register" mode="register" onAuthenticated={onAuthenticated} />
        ) : (
          <AuthForm key="login" mode="login" onAuthenticated={onAuthenticated} />
        )}
      </div>
    </div>
  )
}

function AuthForm({ mode, onAuthenticated }) {
  const isRegister = mode === 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const session = isRegister
        ? await register({ username, password, pseudo })
        : await login({ username, password })
      onAuthenticated(session)
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Réessaie.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="auth-username">Nom d'utilisateur</label>
        <input
          id="auth-username"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="antoine42"
          autoComplete="username"
          maxLength={32}
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="auth-password">Mot de passe</label>
        <input
          id="auth-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
      </div>

      {isRegister && (
        <div className="field">
          <label htmlFor="auth-pseudo">Mon prénom ou surnom</label>
          <input
            id="auth-pseudo"
            className="input"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Antoine, Mamie Jo, Tonton…"
            maxLength={24}
          />
          <p className="hint">C'est ce que tes proches verront dans les groupes.</p>
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy
          ? 'Un instant…'
          : isRegister
            ? 'Créer mon compte 🎁'
            : 'Me connecter'}
      </button>
    </form>
  )
}
