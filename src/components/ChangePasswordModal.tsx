import { useState, type FormEvent } from 'react'
import { useAppData } from '../state/AppDataContext'

interface Props {
  onClose: () => void
}

export function ChangePasswordModal({ onClose }: Props) {
  const { changePassword } = useAppData()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (novaSenha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }
    setSalvando(true)
    const result = await changePassword(novaSenha)
    setSalvando(false)
    if (!result.success) {
      setErro(result.error ?? 'Não foi possível alterar a senha.')
      return
    }
    setErro(null)
    setSucesso(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Alterar senha</h2>
        {sucesso ? (
          <>
            <p className="empty-state">Senha alterada com sucesso.</p>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Nova senha
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                  disabled={salvando}
                />
              </label>
              <label>
                Confirmar nova senha
                <input
                  type="password"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  disabled={salvando}
                />
              </label>
            </div>
            {erro && <p className="empty-state">{erro}</p>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar nova senha'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={salvando}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
