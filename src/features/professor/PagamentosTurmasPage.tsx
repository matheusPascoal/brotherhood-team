import { useMemo, useState } from 'react'
import { useAppData } from '../../state/AppDataContext'
import { getAlunosDaTurma, getStatusFinanceiroAluno } from '../../domain/selectors'
import { currency, formatMesReferencia } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'
import type { DiaSemana, MetodoPagamento } from '../../domain/types'
import { Badge } from '../../components/Badge'
import type { BadgeTone } from '../../components/Badge'

const STATUS_FINANCEIRO_TONE: Record<string, BadgeTone> = {
  adimplente: 'success',
  inadimplente: 'danger',
  sem_cobranca: 'neutral',
}

const STATUS_FINANCEIRO_LABEL: Record<string, string> = {
  adimplente: 'Pago',
  inadimplente: 'Não pago',
  sem_cobranca: 'Não pago',
}

const DIA_LABEL: Record<DiaSemana, string> = {
  domingo: 'Dom',
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
}

export function PagamentosTurmasPage() {
  const { currentAccount, profiles, alunos, turmas, modalidades, pagamentos, definirPagamento } = useAppData()
  const [mesReferencia, setMesReferencia] = useState(MES_ATUAL)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('pix')

  if (!currentAccount) return null
  const professorId = currentAccount.id

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const nomeModalidade = (id: string) => modalidades.find((m) => m.id === id)?.nome ?? '—'
  const minhasTurmas = turmas.filter((t) => t.professorId === professorId)

  const mesesDisponiveis = useMemo(() => {
    const meusAlunosIds = new Set(alunos.filter((a) => a.professorId === professorId).map((a) => a.id))
    const meses = new Set(pagamentos.filter((p) => meusAlunosIds.has(p.alunoId)).map((p) => p.mesReferencia))
    meses.add(MES_ATUAL)
    return Array.from(meses).sort().reverse()
  }, [alunos, pagamentos, professorId])

  async function marcarComoPago(alunoId: string) {
    const result = await definirPagamento(alunoId, mesReferencia, true, professorId, metodoSelecionado)
    if (!result.success) alert(result.error)
    setConfirmandoId(null)
  }

  async function marcarComoNaoPago(alunoId: string) {
    if (!window.confirm('Marcar este pagamento como não pago?')) return
    const result = await definirPagamento(alunoId, mesReferencia, false, professorId)
    if (!result.success) alert(result.error)
  }

  return (
    <div className="page">
      <h1>Pagamentos por Turma</h1>

      <div className="toolbar">
        <select value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)}>
          {mesesDisponiveis.map((mes) => (
            <option key={mes} value={mes}>
              {formatMesReferencia(mes)}
            </option>
          ))}
        </select>
      </div>

      {minhasTurmas.length === 0 && <p className="empty-state">Você ainda não tem turmas cadastradas.</p>}

      {minhasTurmas.map((turma) => {
        const alunosDaTurma = getAlunosDaTurma(turma, alunos)
        return (
          <section className="panel" key={turma.id}>
            <h2>
              {turma.nome} · {nomeModalidade(turma.modalidadeId)} · {turma.horaInicio}–{turma.horaFim} ·{' '}
              {turma.diasSemana.map((d) => DIA_LABEL[d]).join(', ')}
            </h2>
            {alunosDaTurma.length === 0 ? (
              <p className="empty-state">Nenhum aluno ativo nesta turma.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Mensalidade</th>
                    <th>Status do mês</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {alunosDaTurma.map((aluno) => {
                    const status = getStatusFinanceiroAluno(aluno.id, mesReferencia, pagamentos)
                    const pago = status === 'adimplente'
                    return (
                      <tr key={aluno.id}>
                        <td>{nomeDoProfile(aluno.profileId)}</td>
                        <td>{currency.format(aluno.mensalidadeValor)}</td>
                        <td>
                          <Badge tone={STATUS_FINANCEIRO_TONE[status]}>{STATUS_FINANCEIRO_LABEL[status]}</Badge>
                        </td>
                        <td className="table__actions">
                          {pago ? (
                            <button type="button" onClick={() => marcarComoNaoPago(aluno.id)}>
                              Marcar como não pago
                            </button>
                          ) : confirmandoId === aluno.id ? (
                            <>
                              <select value={metodoSelecionado} onChange={(e) => setMetodoSelecionado(e.target.value as MetodoPagamento)}>
                                <option value="pix">Pix</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="cartao">Cartão</option>
                                <option value="outro">Outro</option>
                              </select>
                              <button type="button" className="btn btn-primary btn-sm" onClick={() => marcarComoPago(aluno.id)}>
                                OK
                              </button>
                            </>
                          ) : (
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirmandoId(aluno.id)}>
                              Marcar como pago
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>
        )
      })}
    </div>
  )
}
