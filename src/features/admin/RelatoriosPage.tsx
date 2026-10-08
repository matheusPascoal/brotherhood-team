import { useMemo, useState } from 'react'
import { useAppData } from '../../state/AppDataContext'
import { computeRelatorioMensal } from '../../domain/selectors'
import { currency, formatMesReferencia } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'
import { Pagination, usePagination } from '../../components/Pagination'

const STATUS_PAGAMENTO_LABEL: Record<string, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
}

export function RelatoriosPage() {
  const { profiles, professores, alunos, alunoModalidades, turmas, modalidades, pagamentos } = useAppData()
  const mesesDisponiveis = useMemo(
    () => Array.from(new Set(pagamentos.map((p) => p.mesReferencia))).sort().reverse(),
    [pagamentos]
  )
  const [mesSelecionado, setMesSelecionado] = useState(MES_ATUAL)

  const relatorio = computeRelatorioMensal(mesSelecionado, { profiles, professores, alunos, alunoModalidades, pagamentos })
  const { page, pageSize, setPage, setPageSize } = usePagination(relatorio.porProfessor.length)
  const linhasPagina = relatorio.porProfessor.slice((page - 1) * pageSize, page * pageSize)

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'

  async function exportarExcel() {
    // Import dinâmico: a lib inteira só entra no bundle quando alguém de
    // fato clica em exportar, não no carregamento normal da tela.
    const XLSX = await import('xlsx')
    const pagamentosDoMes = pagamentos.filter((p) => p.mesReferencia === mesSelecionado)

    const wb = XLSX.utils.book_new()

    const wsResumo = XLSX.utils.aoa_to_sheet([
      ['Relatório Mensal — Brotherhood Team'],
      ['Mês de referência', formatMesReferencia(mesSelecionado)],
      [],
      ['Arrecadado', relatorio.arrecadado],
      ['Pendente', relatorio.pendente],
      ['Previsto total', relatorio.previstoTotal],
      ['Taxa de arrecadação (%)', relatorio.taxaArrecadacao],
    ])
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

    const wsProfessor = XLSX.utils.json_to_sheet(
      relatorio.porProfessor.map((row) => ({
        Professor: row.nome,
        Arrecadado: row.arrecadado,
        Pendente: row.pendente,
        Previsto: row.previsto,
      }))
    )
    XLSX.utils.book_append_sheet(wb, wsProfessor, 'Por Professor')

    const wsPagamentos = XLSX.utils.json_to_sheet(
      pagamentosDoMes.map((p) => {
        const am = alunoModalidades.find((m) => m.id === p.alunoModalidadeId)
        const aluno = am ? alunos.find((a) => a.id === am.alunoId) : undefined
        const nomesTurmas = am ? turmas.filter((t) => am.turmaIds.includes(t.id)).map((t) => t.nome).join(', ') : ''
        return {
          Aluno: nomeDoProfile(aluno?.profileId),
          Modalidade: am ? (modalidades.find((m) => m.id === am.modalidadeId)?.nome ?? '—') : '—',
          Professor: am ? nomeDoProfile(am.professorId) : '—',
          Turma: nomesTurmas || '—',
          Valor: p.valor,
          Status: STATUS_PAGAMENTO_LABEL[p.status] ?? p.status,
          Método: p.metodo ?? '—',
          'Confirmado por': p.confirmadoPor ? nomeDoProfile(p.confirmadoPor) : '—',
          'Confirmado em': p.confirmadoEm ? new Date(p.confirmadoEm).toLocaleString('pt-BR') : '—',
        }
      })
    )
    XLSX.utils.book_append_sheet(wb, wsPagamentos, 'Pagamentos do Mês')

    XLSX.writeFile(wb, `relatorio-brotherhood-team-${mesSelecionado}.xlsx`)
  }

  return (
    <div className="page">
      <h1>Relatórios Mensais</h1>

      <div className="toolbar">
        <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
          {mesesDisponiveis.map((mes) => (
            <option key={mes} value={mes}>
              {formatMesReferencia(mes)}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-secondary" onClick={exportarExcel}>
          Exportar Excel
        </button>
      </div>

      <div className="cards-grid">
        <div className="card">
          <span className="card__label">Arrecadado</span>
          <span className="card__value">{currency.format(relatorio.arrecadado)}</span>
        </div>
        <div className="card">
          <span className="card__label">Pendente</span>
          <span className="card__value card__value--warning">{currency.format(relatorio.pendente)}</span>
        </div>
        <div className="card">
          <span className="card__label">Previsto total</span>
          <span className="card__value">{currency.format(relatorio.previstoTotal)}</span>
        </div>
        <div className="card">
          <span className="card__label">Taxa de arrecadação</span>
          <span className="card__value">{relatorio.taxaArrecadacao}%</span>
        </div>
      </div>

      <section className="panel">
        <h2>Detalhamento por professor</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Professor</th>
              <th>Arrecadado</th>
              <th>Pendente</th>
              <th>Previsto</th>
            </tr>
          </thead>
          <tbody>
            {linhasPagina.map((row) => (
              <tr key={row.professorId}>
                <td>{row.nome}</td>
                <td>{currency.format(row.arrecadado)}</td>
                <td>{currency.format(row.pendente)}</td>
                <td>{currency.format(row.previsto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={relatorio.porProfessor.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </section>
    </div>
  )
}
