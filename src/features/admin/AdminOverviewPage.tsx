import { DollarSign, AlertTriangle, Users, GraduationCap, TrendingUp, UserPlus, FileText } from 'lucide-react'
import { useAppData } from '../../state/AppDataContext'
import { computeAdminOverview } from '../../domain/selectors'
import { currency } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'
import { Badge } from '../../components/Badge'

interface Props {
  onNavigate: (tabKey: string) => void
}

function mesAtualLabel(): string {
  const [year, month] = MES_ATUAL.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()
}

export function AdminOverviewPage({ onNavigate }: Props) {
  const { profiles, professores, alunos, pagamentos, modalidades } = useAppData()
  const overview = computeAdminOverview({ profiles, professores, alunos, pagamentos })

  const alunosEmAtrasoNoMes = pagamentos.filter(
    (p) => p.mesReferencia === MES_ATUAL && p.status === 'atrasado'
  ).length

  function nomeDoProfessorDoPagamento(pagamentoId: string): string {
    const pagamento = pagamentos.find((p) => p.id === pagamentoId)
    const aluno = pagamento ? alunos.find((a) => a.id === pagamento.alunoId) : undefined
    if (!aluno) return '—'
    return profiles.find((p) => p.id === aluno.professorId)?.fullName ?? '—'
  }

  return (
    <div className="page">
      <section className="panel hero-panel">
        <Badge tone="gold">Painel do Administrador</Badge>
        <div className="hero-card" style={{ marginTop: 'var(--space-3)', marginBottom: 0 }}>
          <div className="hero-card__main">
            <div className="hero-card__emblem">
              <img src="/logo.jpg" alt="Brotherhood Team" className="hero-card__emblem-img" />
            </div>
            <div>
              <div className="hero-card__title">
                BROTHERHOOD <span className="accent">TEAM</span>
              </div>
              <div className="hero-card__subtitle">
                Visão consolidada de desempenho financeiro, repasses de professores e controle de alunos ativos.
              </div>
            </div>
          </div>
          <div className="hero-card__actions">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('professores')}>
              <UserPlus size={16} strokeWidth={2} />
              Novo Professor
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('relatorios')}>
              <FileText size={16} strokeWidth={2} />
              Relatórios PDF
            </button>
          </div>
        </div>
      </section>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Receita Mensal ({mesAtualLabel()})</span>
            <span className="stat-tile__icon stat-tile__icon--gold">
              <DollarSign size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value stat-tile__value--gold">{currency.format(overview.receitaMensal)}</div>
          <div className="stat-tile__hint stat-tile__hint--gold">
            <TrendingUp size={12} strokeWidth={2} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            Meta Prevista: {currency.format(overview.metaMensalPrevista)}
          </div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Pendente / Inadimplência</span>
            <span className="stat-tile__icon stat-tile__icon--primary">
              <AlertTriangle size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value stat-tile__value--primary">{currency.format(overview.valorPendente)}</div>
          <div className="stat-tile__hint">{alunosEmAtrasoNoMes} alunos em atraso este mês</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Total de Alunos</span>
            <span className="stat-tile__icon stat-tile__icon--neutral">
              <Users size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value">{overview.totalAlunosAtivos}</div>
          <div className="stat-tile__hint">Alunos matriculados ativos</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Professores Cadastrados</span>
            <span className="stat-tile__icon stat-tile__icon--neutral">
              <GraduationCap size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value">{overview.totalProfessoresAtivos}</div>
          <div className="stat-tile__hint">Com turmas ativas na academia</div>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel__header">
            <div>
              <div className="panel__title">Desempenho por Professor</div>
              <div className="panel__subtitle">Acompanhamento das turmas e volume financeiro</div>
            </div>
            <button type="button" className="panel__link" onClick={() => onNavigate('professores')}>
              Ver Todos →
            </button>
          </div>

          {overview.rankingProfessores.length === 0 ? (
            <p className="empty-state">Nenhum professor cadastrado ainda.</p>
          ) : (
            <div className="rank-list">
              {overview.rankingProfessores.map((row) => {
                const professor = professores.find((p) => p.profileId === row.professorId)
                const modalidadesNomes =
                  professor?.modalidadeIds
                    .map((id) => modalidades.find((m) => m.id === id)?.nome)
                    .filter(Boolean)
                    .join(' • ') || '—'
                const alunosDoProfessor = alunos.filter((a) => a.professorId === row.professorId && a.status === 'ativo').length
                const pct = overview.receitaMensal > 0 ? Math.round((row.valorArrecadado / overview.receitaMensal) * 100) : 0

                return (
                  <div key={row.professorId}>
                    <div className="rank-row__top">
                      <div>
                        <div className="rank-row__name">{row.nome}</div>
                        <div className="rank-row__meta">
                          {modalidadesNomes} ({alunosDoProfessor} alunos)
                        </div>
                      </div>
                      <div className="rank-row__value">{currency.format(row.valorArrecadado)}</div>
                    </div>
                    <div className="progress-track">
                      <div className="progress-track__fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="rank-row__caption">{pct}% do total da academia</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__header">
            <div className="panel__title">Pagamentos Confirmados</div>
            <span className="badge badge--live">
              <span className="badge__dot" />
              Ao Vivo
            </span>
          </div>

          {overview.feedPagamentosConfirmados.length === 0 ? (
            <p className="empty-state">Nenhum pagamento confirmado neste mês ainda.</p>
          ) : (
            <div className="payment-feed">
              {overview.feedPagamentosConfirmados.map((item) => (
                <div key={item.pagamentoId} className="payment-feed__item">
                  <div>
                    <div className="payment-feed__name">{item.alunoNome}</div>
                    <div className="payment-feed__sub">Prof. {nomeDoProfessorDoPagamento(item.pagamentoId)}</div>
                  </div>
                  <div className="payment-feed__amount">
                    <div className="payment-feed__value">{currency.format(item.valor)}</div>
                    <span className="payment-feed__status">Confirmado</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-block"
            style={{ marginTop: 'var(--space-4)' }}
            onClick={() => onNavigate('pagamentos')}
          >
            Ver Histórico Completo
          </button>
        </section>
      </div>

      <div className="summary-strip">
        <span>Total de Alunos Ativos na Brotherhood Team</span>
        <span className="badge badge--outline">{overview.totalAlunosAtivos} Alunos</span>
      </div>
    </div>
  )
}
