import { useAppData } from '../../state/AppDataContext'
import { computePainelAluno } from '../../domain/selectors'
import { currency, formatMesReferencia } from '../../domain/format'
import { Badge, BeltPill } from '../../components/Badge'
import type { BadgeTone } from '../../components/Badge'
import type { StatusPagamento } from '../../domain/types'

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

const DIA_LABEL: Record<string, string> = {
  domingo: 'Dom',
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
}

export function MeuPainelPage() {
  const { currentAccount, alunos, alunoModalidades, profiles, modalidades, pagamentos, turmas, graduacoesHistorico } = useAppData()
  if (!currentAccount) return null

  const aluno = alunos.find((a) => a.profileId === currentAccount.id)
  if (!aluno) {
    return (
      <div className="page">
        <h1>Meu Painel</h1>
        <p className="empty-state">Nenhum cadastro de aluno vinculado a esta conta.</p>
      </div>
    )
  }

  const painel = computePainelAluno(aluno.id, { alunos, alunoModalidades, profiles, modalidades, pagamentos, turmas, graduacoesHistorico })
  if (!painel) return null

  return (
    <div className="page">
      <h1>Meu Painel</h1>

      {painel.matriculas.length === 0 && <p className="empty-state">Nenhuma modalidade matriculada ainda.</p>}

      {painel.matriculas.map((m) => (
        <section className="panel" key={m.alunoModalidade.id}>
          <h2>{m.modalidadeNome}</h2>

          <div className="cards-grid">
            <div className="card">
              <span className="card__label">Status financeiro do mês</span>
              <span className="card__value">
                <Badge tone={STATUS_FINANCEIRO_TONE[m.statusFinanceiroMes]}>{STATUS_FINANCEIRO_LABEL[m.statusFinanceiroMes]}</Badge>
              </span>
            </div>
            <div className="card">
              <span className="card__label">Mensalidade</span>
              <span className="card__value">{currency.format(m.alunoModalidade.mensalidadeValor)}</span>
              <span className="card__hint">Vencimento: dia {m.alunoModalidade.diaVencimento}</span>
            </div>
            <div className="card">
              <span className="card__label">Graduação</span>
              <span className="card__value">
                <BeltPill faixa={m.alunoModalidade.faixaAtual} /> grau {m.alunoModalidade.grauAtual}
              </span>
            </div>
            <div className="card">
              <span className="card__label">Professor responsável</span>
              <span className="card__value">{m.professorNome}</span>
            </div>
          </div>

          <h3>Grade de horários</h3>
          {m.turmas.length === 0 ? (
            <p className="empty-state">Nenhuma turma matriculada nesta modalidade ainda.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Local</th>
                  <th>Horário</th>
                  <th>Dias</th>
                </tr>
              </thead>
              <tbody>
                {m.turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td>{turma.nome}</td>
                    <td>{turma.local || '—'}</td>
                    <td>
                      {turma.horaInicio}–{turma.horaFim}
                    </td>
                    <td>{turma.diasSemana.map((d) => DIA_LABEL[d]).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Histórico de pagamentos</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Método</th>
              </tr>
            </thead>
            <tbody>
              {m.historicoPagamentos.map((p) => (
                <tr key={p.id}>
                  <td>{formatMesReferencia(p.mesReferencia)}</td>
                  <td>{currency.format(p.valor)}</td>
                  <td>
                    <Badge tone={STATUS_PAGAMENTO_TONE[p.status]}>{STATUS_PAGAMENTO_LABEL[p.status]}</Badge>
                  </td>
                  <td>{p.metodo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
