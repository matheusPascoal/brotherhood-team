import { useState } from 'react'
import { useAppData, type NovoProfessorInput } from '../../state/AppDataContext'
import { Badge } from '../../components/Badge'

const EMPTY_FORM: NovoProfessorInput = { fullName: '', email: '', senha: '', phone: '', comissaoPercentual: 50, modalidadeIds: [] }

export function ProfessoresPage() {
  const { profiles, professores, modalidades, alunos, createProfessor, updateProfessor, setProfessorStatus, deleteProfessor } =
    useAppData()
  const [busca, setBusca] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NovoProfessorInput>(EMPTY_FORM)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const nomeDoProfile = (profileId: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const emailDoProfile = (profileId: string) => profiles.find((p) => p.id === profileId)?.email ?? '—'
  const alunosCount = (professorProfileId: string) => alunos.filter((a) => a.professorId === professorProfileId).length

  const linhas = professores.filter((p) => {
    const nome = nomeDoProfile(p.profileId).toLowerCase()
    const email = emailDoProfile(p.profileId).toLowerCase()
    const termo = busca.toLowerCase()
    return nome.includes(termo) || email.includes(termo)
  })

  function abrirCadastro() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErro(null)
    setFormOpen(true)
  }

  function abrirEdicao(professorId: string) {
    const professor = professores.find((p) => p.id === professorId)
    if (!professor) return
    setEditingId(professorId)
    setForm({
      fullName: nomeDoProfile(professor.profileId),
      email: emailDoProfile(professor.profileId),
      senha: '',
      phone: profiles.find((p) => p.id === professor.profileId)?.phone ?? '',
      comissaoPercentual: professor.comissaoPercentual,
      modalidadeIds: professor.modalidadeIds,
    })
    setErro(null)
    setFormOpen(true)
  }

  async function salvar() {
    if (!form.fullName || !form.email) return
    if (!editingId && form.senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setSalvando(true)
    const result = editingId ? await updateProfessor(editingId, form) : await createProfessor(form)
    setSalvando(false)
    if (!result.success) {
      setErro(result.error ?? 'Não foi possível salvar o professor.')
      return
    }
    setFormOpen(false)
  }

  async function remover(professorId: string) {
    if (!window.confirm('Remover este professor? Essa ação não pode ser desfeita.')) return
    const result = await deleteProfessor(professorId)
    if (!result.success) alert(result.error)
  }

  function toggleModalidade(modalidadeId: string) {
    setForm((f) => ({
      ...f,
      modalidadeIds: f.modalidadeIds.includes(modalidadeId)
        ? f.modalidadeIds.filter((id) => id !== modalidadeId)
        : [...f.modalidadeIds, modalidadeId],
    }))
  }

  return (
    <div className="page">
      <h1>Professores</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={abrirCadastro}>
          + Novo Professor
        </button>
      </div>

      {formOpen && (
        <section className="form-panel">
          <h2>{editingId ? 'Editar professor' : 'Novo professor'}</h2>
          <div className="form-grid">
            <label>
              Nome completo
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label>
              E-mail de acesso
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            {!editingId && (
              <label>
                Senha inicial
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </label>
            )}
            <label>
              Telefone
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              % de comissão
              <input
                type="number"
                min={0}
                max={100}
                value={form.comissaoPercentual}
                onChange={(e) => setForm({ ...form, comissaoPercentual: Number(e.target.value) })}
              />
            </label>
            <fieldset>
              <legend>Modalidades que leciona</legend>
              {modalidades.map((m) => (
                <label key={m.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.modalidadeIds.includes(m.id)}
                    onChange={() => toggleModalidade(m.id)}
                  />
                  {m.nome}
                </label>
              ))}
            </fieldset>
          </div>
          {erro && <p className="empty-state">{erro}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
          </div>
        </section>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Comissão</th>
            <th>Modalidades</th>
            <th>Alunos</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((professor) => (
            <tr key={professor.id}>
              <td>{nomeDoProfile(professor.profileId)}</td>
              <td>{emailDoProfile(professor.profileId)}</td>
              <td>{professor.comissaoPercentual}%</td>
              <td>
                {professor.modalidadeIds.map((id) => modalidades.find((m) => m.id === id)?.nome).join(', ') || '—'}
              </td>
              <td>{alunosCount(professor.profileId)}</td>
              <td>
                <Badge tone={professor.status === 'ativo' ? 'success' : 'neutral'}>
                  {professor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </td>
              <td className="table__actions">
                <button type="button" onClick={() => abrirEdicao(professor.id)}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await setProfessorStatus(professor.id, professor.status === 'ativo' ? 'inativo' : 'ativo')
                    if (!result.success) alert(result.error)
                  }}
                >
                  {professor.status === 'ativo' ? 'Inativar' : 'Reativar'}
                </button>
                <button type="button" className="btn-danger" onClick={() => remover(professor.id)}>
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
