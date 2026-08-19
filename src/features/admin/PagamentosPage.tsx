import { useMemo, useState } from 'react'
import { useAppData } from '../../state/AppDataContext'
import { currency, formatMesReferencia } from '../../domain/format'
import type { MetodoPagamento, StatusPagamento } from '../../domain/types'
import { Badge } from '../../components/Badge'
import type { BadgeTone } from '../../components/Badge'

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
  const { profiles, alunos, pagamentos, currentAccount, confirmarPagamento } = useAppData()
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroProfessor, setFiltroProfessor] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoPagamento>('pix')

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'

  const mesesDisponiveis = useMemo(
    () => Array.from(new Set(pagamentos.map((p) => p.mesReferencia))).sort().reverse(),
    [pagamentos]
  )
  const professoresComAluno = useMemo(
    () => Array.from(new Set(alunos.map((a) => a.professorId))),
    [alunos]
  )

  const linhas = pagamentos.filter((p) => {
    const aluno = alunos.find((a) => a.id === p.alunoId)
    const casaMes = !filtroMes || p.mesReferencia === filtroMes
    const casaProfessor = !filtroProfessor || aluno?.professorId === filtroProfessor
    const casaStatus = !filtroStatus || p.status === filtroStatus
    return casaMes && casaProfessor && casaStatus
  })

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
            <th>Mês</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Confirmado por</th>
            <th>Quando</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((pagamento) => {
            const aluno = alunos.find((a) => a.id === pagamento.alunoId)
            return (
              <tr key={pagamento.id}>
                <td>{nomeDoProfile(aluno?.profileId)}</td>
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
    </div>
  )
}
