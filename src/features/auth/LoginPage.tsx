import { useState, type FormEvent } from 'react'
import { useAppData } from '../../state/AppDataContext'

const CONTAS_DE_TESTE = [
  { email: 'carlos.eduardo@brotherhoodteam.test', papel: 'Admin' },
  { email: 'marcos.silva@brotherhoodteam.test', papel: 'Professor' },
  { email: 'lucas.santos@brotherhoodteam.test', papel: 'Aluno' },
]

export function LoginPage() {
  const { login } = useAppData()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = login(email, password)
    setError(result.success ? null : (result.error ?? 'Não foi possível entrar.'))
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__emblem">
          <img src="/logo.jpg" alt="Brotherhood Team" className="login-card__emblem-img" />
        </div>
        <h1>
          BROTHERHOOD <span className="accent">TEAM</span>
        </h1>
        <p className="login-card__subtitle">
          Login provisório (mock) — a senha não é validada ainda. Isso será trocado pelo Supabase Auth na Fase 2.
        </p>

        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="login-card__error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block">
          Entrar
        </button>

        <div className="login-card__hint">
          <strong>Contas de teste</strong> (qualquer senha):
          <ul>
            {CONTAS_DE_TESTE.map((conta) => (
              <li key={conta.email}>
                {conta.email} — {conta.papel}
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  )
}
