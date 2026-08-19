import { useState } from 'react'
import { useAppData, type NovoAlunoInput } from '../../state/AppDataContext'
import { getStatusFinanceiroAluno } from '../../domain/selectors'
import { currency, formatCpfFull, maskCpf } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'
import type { MetodoPagamento } from '../../domain/types'
import { Badge } from '../../components/Badge'
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

function emptyForm(professorId: string): NovoAlunoInput {
  return {
    fullName: '',
    email: '',
    senha: '',
    cpf: '',
    professorId,
    modalidadeId: '',
    faixaAtual: '',
    grauAtual: 0,
    mensalidadeValor: 0,
    diaVencimento: 5,
  }
}

export function AlunosPagamentosPage() {
  const { currentAccount, profiles, alunos, modalidades, pagamentos, createAluno, updateAluno, setAlunoStatus, confirmarPagamento } =
    useAppData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NovoAlunoInput>(emptyForm(currentAccount?.id ?? ''))
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('pix')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  if (!currentAccount) return null
  const professorId = currentAccount.id

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const nomeModalidade = (id: string) => modalidades.find((m) => m.id === id)?.nome ?? '—'
  const meusAlunos = alunos.filter((a) => a.professorId === professorId)

  function abrirCadastro() {
    setEditingId(null)
    setForm(emptyForm(professorId))
    setErro(null)
    setFormOpen(true)
  }

  function abrirEdicao(alunoId: string) {
    const aluno = meusAlunos.find((a) => a.id === alunoId)
    if (!aluno) return
    setEditingId(alunoId)
    setForm({
      fullName: nomeDoProfile(aluno.profileId),
      email: profiles.find((p) => p.id === aluno.profileId)?.email ?? '',
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
    if (!form.fullName || !form.email || !/^\d{11}$/.test(form.cpf) || !form.modalidadeId) return
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

  async function confirmarPagamentoDoAluno(alunoId: string) {
    const pagamento = pagamentos.find((p) => p.alunoId === alunoId && p.mesReferencia === MES_ATUAL)
    if (!pagamento) return
    const result = await confirmarPagamento(pagamento.id, professorId, metodoSelecionado)
    if (!result.success) alert(result.error)
    setConfirmandoId(null)
  }

  return (
    <div className="page">
      <h1>Alunos & Pagamentos</h1>

      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={abrirCadastro}>
          + Novo Aluno
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
              <input value={form.cpf} maxLength={11} onChange={(e) => setForm({ ...form, cpf: e.target.value.replace(/\D/g, '') })} />
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
              <input type="number" min={0} max={4} value={form.grauAtual} onChange={(e) => setForm({ ...form, grauAtual: Number(e.target.value) })} />
            </label>
            <label>
              Mensalidade (R$)
              <input type="number" min={0} step="0.01" value={form.mensalidadeValor} onChange={(e) => setForm({ ...form, mensalidadeValor: Number(e.target.value) })} />
            </label>
            <label>
              Dia de vencimento (1–31)
              <input type="number" min={1} max={31} value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: Number(e.target.value) })} />
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
            <th>Modalidade</th>
            <th>Mensalidade</th>
            <th>Vencimento</th>
            <th>Status do mês</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {meusAlunos.map((aluno) => {
            const statusFinanceiro = getStatusFinanceiroAluno(aluno.id, MES_ATUAL, pagamentos)
            return (
              <tr key={aluno.id}>
                <td>{nomeDoProfile(aluno.profileId)}</td>
                <td title={formatCpfFull(aluno.cpf)}>{maskCpf(aluno.cpf)}</td>
                <td>{nomeModalidade(aluno.modalidadeId)}</td>
                <td>{currency.format(aluno.mensalidadeValor)}</td>
                <td>dia {aluno.diaVencimento}</td>
                <td>
                  <Badge tone={STATUS_FINANCEIRO_TONE[statusFinanceiro]}>{STATUS_FINANCEIRO_LABEL[statusFinanceiro]}</Badge>
                </td>
                <td>
                  <Badge tone={aluno.status === 'ativo' ? 'success' : 'neutral'}>
                    {aluno.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
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
                  {statusFinanceiro === 'inadimplente' &&
                    (confirmandoId === aluno.id ? (
                      <>
                        <select value={metodoSelecionado} onChange={(e) => setMetodoSelecionado(e.target.value as MetodoPagamento)}>
                          <option value="pix">Pix</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cartao">Cartão</option>
                          <option value="outro">Outro</option>
                        </select>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmarPagamentoDoAluno(aluno.id)}>
                          OK
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirmandoId(aluno.id)}>
                        Confirmar pagamento
                      </button>
                    ))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
