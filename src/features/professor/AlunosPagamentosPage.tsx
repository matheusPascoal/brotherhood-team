import { useState } from 'react'
import { useAppData, type NovoAlunoInput } from '../../state/AppDataContext'
import { getStatusFinanceiroMatricula } from '../../domain/selectors'
import { currency, formatCpfFull, maskCpf } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'
import type { MetodoPagamento } from '../../domain/types'
import { Badge, BeltPill } from '../../components/Badge'
import type { BadgeTone } from '../../components/Badge'
import { AlunoModalidadesForm } from '../shared/AlunoModalidadesForm'

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
  modalidades: [],
}

export function AlunosPagamentosPage() {
  const {
    currentAccount,
    profiles,
    professores,
    alunos,
    alunoModalidades,
    modalidades,
    turmas,
    pagamentos,
    createAluno,
    updateAluno,
    setAlunoStatus,
    confirmarPagamento,
  } = useAppData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NovoAlunoInput>(EMPTY_FORM)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('pix')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  if (!currentAccount) return null
  const professorId = currentAccount.id

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const nomeModalidade = (id: string) => modalidades.find((m) => m.id === id)?.nome ?? '—'
  const meuProfessor = professores.find((p) => p.profileId === professorId)
  const minhasModalidades = modalidades.filter((m) => meuProfessor?.modalidadeIds.includes(m.id))
  const minhasMatriculasDoAluno = (alunoId: string) =>
    alunoModalidades.filter((am) => am.alunoId === alunoId && am.professorId === professorId)
  const meusAlunos = alunos.filter((a) => minhasMatriculasDoAluno(a.id).length > 0)

  function abrirCadastro() {
    setEditingId(null)
    setForm(EMPTY_FORM)
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
      modalidades: minhasMatriculasDoAluno(alunoId)
        .filter((am) => am.status === 'ativo')
        .map((am) => ({
          id: am.id,
          professorId: am.professorId,
          modalidadeId: am.modalidadeId,
          faixaAtual: am.faixaAtual,
          grauAtual: am.grauAtual,
          mensalidadeValor: am.mensalidadeValor,
          diaVencimento: am.diaVencimento,
          turmaIds: am.turmaIds,
        })),
    })
    setErro(null)
    setFormOpen(true)
  }

  async function salvar() {
    if (!form.fullName || !form.email) {
      setErro('Preencha nome e e-mail.')
      return
    }
    if (!/^\d{11}$/.test(form.cpf)) {
      setErro('Informe um CPF válido com 11 números.')
      return
    }
    if (form.modalidades.length === 0) {
      setErro('Adicione ao menos uma modalidade.')
      return
    }
    if (form.modalidades.some((m) => !m.modalidadeId || m.diaVencimento < 1 || m.diaVencimento > 31)) {
      setErro('Selecione a modalidade e um dia de vencimento válido (1–31) em cada bloco.')
      return
    }
    if (!editingId && form.senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setErro(null)
    setSalvando(true)
    const result = editingId ? await updateAluno(editingId, form, professorId) : await createAluno(form)
    setSalvando(false)
    if (!result.success) {
      setErro(result.error ?? 'Não foi possível salvar o aluno.')
      return
    }
    setFormOpen(false)
  }

  async function confirmarPagamentoDaMatricula(alunoModalidadeId: string) {
    const pagamento = pagamentos.find((p) => p.alunoModalidadeId === alunoModalidadeId && p.mesReferencia === MES_ATUAL)
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
          </div>

          {minhasModalidades.length === 0 ? (
            <p className="empty-state">Você ainda não leciona nenhuma modalidade cadastrada.</p>
          ) : (
            <AlunoModalidadesForm
              value={form.modalidades}
              onChange={(modalidades) => setForm({ ...form, modalidades })}
              professores={professores}
              profiles={profiles}
              modalidades={minhasModalidades}
              turmas={turmas}
              fixedProfessorId={professorId}
            />
          )}

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
            <th>Modalidades (comigo)</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {meusAlunos.map((aluno) => {
            const matriculas = minhasMatriculasDoAluno(aluno.id).filter((am) => am.status === 'ativo')
            return (
              <tr key={aluno.id}>
                <td>{nomeDoProfile(aluno.profileId)}</td>
                <td title={formatCpfFull(aluno.cpf)}>{maskCpf(aluno.cpf)}</td>
                <td>
                  <ul className="feed">
                    {matriculas.map((am) => {
                      const statusFinanceiro = getStatusFinanceiroMatricula(am.id, MES_ATUAL, pagamentos)
                      return (
                        <li key={am.id}>
                          <strong>{nomeModalidade(am.modalidadeId)}</strong> · <BeltPill faixa={am.faixaAtual} /> grau {am.grauAtual} ·{' '}
                          {currency.format(am.mensalidadeValor)} (dia {am.diaVencimento}) ·{' '}
                          <Badge tone={STATUS_FINANCEIRO_TONE[statusFinanceiro]}>{STATUS_FINANCEIRO_LABEL[statusFinanceiro]}</Badge>
                          {statusFinanceiro === 'inadimplente' &&
                            (confirmandoId === am.id ? (
                              <>
                                {' '}
                                <select value={metodoSelecionado} onChange={(e) => setMetodoSelecionado(e.target.value as MetodoPagamento)}>
                                  <option value="pix">Pix</option>
                                  <option value="dinheiro">Dinheiro</option>
                                  <option value="cartao">Cartão</option>
                                  <option value="outro">Outro</option>
                                </select>
                                <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmarPagamentoDaMatricula(am.id)}>
                                  OK
                                </button>
                              </>
                            ) : (
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirmandoId(am.id)}>
                                Confirmar pagamento
                              </button>
                            ))}
                        </li>
                      )
                    })}
                  </ul>
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
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
