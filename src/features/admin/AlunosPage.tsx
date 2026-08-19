import { useState } from 'react'
import { useAppData, type NovoAlunoInput } from '../../state/AppDataContext'
import { getStatusFinanceiroAluno } from '../../domain/selectors'
import { currency, formatCpfFull, maskCpf } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'
import { Badge, BeltPill } from '../../components/Badge'
import type { BadgeTone } from '../../components/Badge'

const STATUS_FINANCEIRO_TONE: Record<string, BadgeTone> = {
  adimplente: 'success',
  inadimplente: 'danger',
  sem_cobranca: 'neutral',
}

const STATUS_FINANCEIRO_LABEL: Record<string, string> = {
  adimplente: 'Adimplente',
  inadimplente: 'Inadimplente',
  sem_cobranca: 'Sem cobrança',
}

const EMPTY_FORM: NovoAlunoInput = {
  fullName: '',
  email: '',
  senha: '',
  cpf: '',
  professorId: '',
  modalidadeId: '',
  faixaAtual: '',
  grauAtual: 0,
  mensalidadeValor: 0,
  diaVencimento: 5,
}

export function AlunosPage() {
  const { profiles, professores, alunos, modalidades, pagamentos, createAluno, updateAluno, setAlunoStatus, deleteAluno } =
    useAppData()
  const [busca, setBusca] = useState('')
  const [filtroProfessor, setFiltroProfessor] = useState('')
  const [filtroStatusFinanceiro, setFiltroStatusFinanceiro] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NovoAlunoInput>(EMPTY_FORM)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const emailDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.email ?? '—'
  const nomeModalidade = (id: string) => modalidades.find((m) => m.id === id)?.nome ?? '—'

  const linhas = alunos.filter((aluno) => {
    const termo = busca.toLowerCase()
    const nome = nomeDoProfile(aluno.profileId).toLowerCase()
    const email = emailDoProfile(aluno.profileId).toLowerCase()
    const casaBusca = !termo || nome.includes(termo) || email.includes(termo) || aluno.cpf.includes(termo)
    const casaProfessor = !filtroProfessor || aluno.professorId === filtroProfessor
    const statusFinanceiro = getStatusFinanceiroAluno(aluno.id, MES_ATUAL, pagamentos)
    const casaStatus = !filtroStatusFinanceiro || statusFinanceiro === filtroStatusFinanceiro
    return casaBusca && casaProfessor && casaStatus
  })

  function abrirCadastro() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErro(null)
    setFormOpen(true)
  }

  function abrirEdicao(alunoId: string) {
    const aluno = alunos.find((a) => a.id === alunoId)
    if (!aluno) return
    setEditingId(alunoId)
    setForm({
      fullName: nomeDoProfile(aluno.profileId),
      email: emailDoProfile(aluno.profileId),
      senha: '',
      cpf: aluno.cpf,
      professorId: aluno.professorId,
      modalidadeId: aluno.modalidadeId,
      faixaAtual: aluno.faixaAtual,
      grauAtual: aluno.grauAtual,
      mensalidadeValor: aluno.mensalidadeValor,
      diaVencimento: aluno.diaVencimento,
    })
    setErro(null)
    setFormOpen(true)
  }

  async function salvar() {
    if (!form.fullName || !form.email || !/^\d{11}$/.test(form.cpf) || !form.professorId || !form.modalidadeId) return
    if (form.diaVencimento < 1 || form.diaVencimento > 31) return
    if (!editingId && form.senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setSalvando(true)
    const result = editingId ? await updateAluno(editingId, form) : await createAluno(form)
    setSalvando(false)
    if (!result.success) {
      setErro(result.error ?? 'Não foi possível salvar o aluno.')
      return
    }
    setFormOpen(false)
  }

  async function remover(alunoId: string) {
    if (!window.confirm('Remover este aluno? Essa ação não pode ser desfeita.')) return
    const result = await deleteAluno(alunoId)
    if (!result.success) alert(result.error)
  }

  return (
    <div className="page">
      <h1>Todos Alunos</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar por nome, e-mail ou CPF…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select value={filtroProfessor} onChange={(e) => setFiltroProfessor(e.target.value)}>
          <option value="">Todos os professores</option>
          {professores.map((p) => (
            <option key={p.id} value={p.profileId}>
              {nomeDoProfile(p.profileId)}
            </option>
          ))}
        </select>
        <select value={filtroStatusFinanceiro} onChange={(e) => setFiltroStatusFinanceiro(e.target.value)}>
          <option value="">Qualquer status financeiro</option>
          <option value="adimplente">Adimplente</option>
          <option value="inadimplente">Inadimplente</option>
          <option value="sem_cobranca">Sem cobrança no mês</option>
        </select>
        <button type="button" className="btn btn-primary" onClick={abrirCadastro}>
          + Novo Aluno
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          title="Exportação real será implementada na Fase 7"
          onClick={() => alert('Exportação Excel entra na Fase 7 do plano.')}
        >
          Exportar Excel
        </button>
      </div>

      {formOpen && (
        <section className="form-panel">
          <h2>{editingId ? 'Editar aluno' : 'Novo aluno'}</h2>
          <div className="form-grid">
            <label>
              Nome completo
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </label>
            <label>
              E-mail
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
              CPF (somente números)
              <input
                value={form.cpf}
                maxLength={11}
                onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, '') })}
              />
            </label>
            <label>
              Professor responsável
              <select value={form.professorId} onChange={(e) => setForm({ ...form, professorId: e.target.value })}>
                <option value="">Selecione…</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.profileId}>
                    {nomeDoProfile(p.profileId)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modalidade
              <select value={form.modalidadeId} onChange={(e) => setForm({ ...form, modalidadeId: e.target.value })}>
                <option value="">Selecione…</option>
                {modalidades.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Faixa atual
              <input value={form.faixaAtual} onChange={(e) => setForm({ ...form, faixaAtual: e.target.value })} />
            </label>
            <label>
              Grau (0–4)
              <input
                type="number"
                min={0}
                max={4}
                value={form.grauAtual}
                onChange={(e) => setForm({ ...form, grauAtual: Number(e.target.value) })}
              />
            </label>
            <label>
              Mensalidade (R$)
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.mensalidadeValor}
                onChange={(e) => setForm({ ...form, mensalidadeValor: Number(e.target.value) })}
              />
            </label>
            <label>
              Dia de vencimento (1–31)
              <input
                type="number"
                min={1}
                max={31}
                value={form.diaVencimento}
                onChange={(e) => setForm({ ...form, diaVencimento: Number(e.target.value) })}
              />
            </label>
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
            <th>CPF</th>
            <th>Professor</th>
            <th>Modalidade</th>
            <th>Faixa/Grau</th>
            <th>Mensalidade</th>
            <th>Status financeiro</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((aluno) => {
            const statusFinanceiro = getStatusFinanceiroAluno(aluno.id, MES_ATUAL, pagamentos)
            return (
              <tr key={aluno.id}>
                <td>{nomeDoProfile(aluno.profileId)}</td>
                <td title={formatCpfFull(aluno.cpf)}>{maskCpf(aluno.cpf)}</td>
                <td>{nomeDoProfile(aluno.professorId)}</td>
                <td>{nomeModalidade(aluno.modalidadeId)}</td>
                <td>
                  <BeltPill faixa={aluno.faixaAtual} /> grau {aluno.grauAtual}
                </td>
                <td>{currency.format(aluno.mensalidadeValor)}</td>
                <td>
                  <Badge tone={STATUS_FINANCEIRO_TONE[statusFinanceiro]}>{STATUS_FINANCEIRO_LABEL[statusFinanceiro]}</Badge>
                </td>
                <td className="table__actions">
                  <button type="button" onClick={() => abrirEdicao(aluno.id)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await setAlunoStatus(aluno.id, aluno.status === 'ativo' ? 'inativo' : 'ativo')
                      if (!result.success) alert(result.error)
                    }}
                  >
                    {aluno.status === 'ativo' ? 'Inativar' : 'Reativar'}
                  </button>
                  <button type="button" className="btn-danger" onClick={() => remover(aluno.id)}>
                    Remover
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
