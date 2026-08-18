import { useMemo, useState } from 'react'
import { useAppData } from '../../state/AppDataContext'
import { computeRelatorioMensal } from '../../domain/selectors'
import { currency, formatMesReferencia } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'

export function RelatoriosPage() {
  const { profiles, professores, alunos, pagamentos } = useAppData()
  const mesesDisponiveis = useMemo(
    () => Array.from(new Set(pagamentos.map((p) => p.mesReferencia))).sort().reverse(),
    [pagamentos]
  )
  const [mesSelecionado, setMesSelecionado] = useState(MES_ATUAL)

  const relatorio = computeRelatorioMensal(mesSelecionado, { profiles, professores, alunos, pagamentos })

  function exportar(formato: 'excel' | 'pdf') {
    alert(`Exportação em ${formato.toUpperCase()} entra na Fase 7 do plano (hoje é só o botão, como no protótipo).`)
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
        <button type="button" className="btn btn-secondary" onClick={() => exportar('excel')}>
          Exportar Excel
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => exportar('pdf')}>
          Exportar PDF
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
            {relatorio.porProfessor.map((row) => (
              <tr key={row.professorId}>
                <td>{row.nome}</td>
                <td>{currency.format(row.arrecadado)}</td>
                <td>{currency.format(row.pendente)}</td>
                <td>{currency.format(row.previsto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
