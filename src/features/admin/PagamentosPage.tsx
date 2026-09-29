import { useMemo, useState } from 'react'
import { useAppData } from '../../state/AppDataContext'
import { currency, formatMesReferencia } from '../../domain/format'
import type { MetodoPagamento, StatusPagamento } from '../../domain/types'
import { Badge } from '../../components/Badge'
import type { BadgeTone } from '../../components/Badge'
import { Pagination, usePagination } from '../../components/Pagination'

const STATUS_PAGAMENTO_TONE: Record<StatusPagamento, BadgeTone> = {
  confirmado: 'success',
  pendente: 'warning',
  atrasado: 'danger',
}

const STATUS_PAGAMENTO_LABEL: Record<StatusPagamento, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
}

export function PagamentosPage() {
  const { profiles, alunos, alunoModalidades, turmas, modalidades, pagamentos, currentAccount, confirmarPagamento } = useAppData()
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroProfessor, setFiltroProfessor] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('pix')

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const nomeModalidade = (id: string) => modalidades.find((m) => m.id === id)?.nome ?? '—'
  const matricula = (alunoModalidadeId: string) => alunoModalidades.find((am) => am.id === alunoModalidadeId)
  const nomeTurmas = (alunoModalidadeId: string) => {
    const am = matricula(alunoModalidadeId)
    if (!am) return '—'
    const nomes = turmas.filter((t) => am.turmaIds.includes(t.id)).map((t) => t.nome)
    return nomes.length > 0 ? nomes.join(', ') : '—'
  }

  const mesesDisponiveis = useMemo(
    () => Array.from(new Set(pagamentos.map((p) => p.mesReferencia))).sort().reverse(),
    [pagamentos]
  )
  const professoresComAluno = useMemo(
    () => Array.from(new Set(alunoModalidades.map((am) => am.professorId))),
    [alunoModalidades]
  )

  const linhas = pagamentos.filter((p) => {
    const am = matricula(p.alunoModalidadeId)
    const casaMes = !filtroMes || p.mesReferencia === filtroMes
    const casaProfessor = !filtroProfessor || am?.professorId === filtroProfessor
    const casaStatus = !filtroStatus || p.status === filtroStatus
    return casaMes && casaProfessor && casaStatus
  })
  const { page, pageSize, setPage, setPageSize } = usePagination(linhas.length)
  const linhasPagina = linhas.slice((page - 1) * pageSize, page * pageSize)

  if (!currentAccount) return null
  const confirmadoPorId = currentAccount.id

  async function confirmar(pagamentoId: string) {
    const result = await confirmarPagamento(pagamentoId, confirmadoPorId, metodoSelecionado)
    if (!result.success) alert(result.error)
    setConfirmandoId(null)
  }

  return (
    <div className="page">
      <h1>Pagamentos Confirmados</h1>

      <div className="toolbar">
        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
          <option value="">Todos os meses</option>
          {mesesDisponiveis.map((mes) => (
            <option key={mes} value={mes}>
              {formatMesReferencia(mes)}
            </option>
          ))}
        </select>
        <select value={filtroProfessor} onChange={(e) => setFiltroProfessor(e.target.value)}>
          <option value="">Todos os professores</option>
          {professoresComAluno.map((profileId) => (
            <option key={profileId} value={profileId}>
              {nomeDoProfile(profileId)}
            </option>
          ))}
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Modalidade</th>
            <th>Professor</th>
            <th>Turma</th>
            <th>Mês</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Confirmado por</th>
            <th>Quando</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {linhasPagina.map((pagamento) => {
            const am = matricula(pagamento.alunoModalidadeId)
            const aluno = am ? alunos.find((a) => a.id === am.alunoId) : undefined
            return (
              <tr key={pagamento.id}>
                <td>{nomeDoProfile(aluno?.profileId)}</td>
                <td>{am ? nomeModalidade(am.modalidadeId) : '—'}</td>
                <td>{nomeDoProfile(am?.professorId)}</td>
                <td>{nomeTurmas(pagamento.alunoModalidadeId)}</td>
                <td>{formatMesReferencia(pagamento.mesReferencia)}</td>
                <td>{currency.format(pagamento.valor)}</td>
                <td>
                  <Badge tone={STATUS_PAGAMENTO_TONE[pagamento.status]}>{STATUS_PAGAMENTO_LABEL[pagamento.status]}</Badge>
                </td>
                <td>{pagamento.confirmadoPor ? nomeDoProfile(pagamento.confirmadoPor) : '—'}</td>
                <td>{pagamento.confirmadoEm ? new Date(pagamento.confirmadoEm).toLocaleString('pt-BR') : '—'}</td>
                <td className="table__actions">
                  {pagamento.status !== 'confirmado' &&
                    (confirmandoId === pagamento.id ? (
                      <>
                        <select value={metodoSelecionado} onChange={(e) => setMetodoSelecionado(e.target.value as MetodoPagamento)}>
                          <option value="pix">Pix</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cartao">Cartão</option>
                          <option value="outro">Outro</option>
                        </select>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => confirmar(pagamento.id)}>
                          OK
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirmandoId(pagamento.id)}>
                        Confirmar
                      </button>
                    ))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Pagination page={page} pageSize={pageSize} total={linhas.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  )
}
