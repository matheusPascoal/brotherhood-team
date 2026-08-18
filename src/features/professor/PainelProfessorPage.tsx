import { useAppData } from '../../state/AppDataContext'
import { computePainelProfessor } from '../../domain/selectors'
import { currency } from '../../domain/format'

interface Props {
  onNavigate: (tabKey: string) => void
}

export function PainelProfessorPage({ onNavigate }: Props) {
  const { currentAccount, alunos, pagamentos, turmas } = useAppData()
  if (!currentAccount) return null

  const painel = computePainelProfessor(currentAccount.id, { alunos, pagamentos, turmas })

  return (
    <div className="page">
      <h1>Painel do Professor</h1>

      <div className="cards-grid">
        <div className="card">
          <span className="card__label">Meus alunos</span>
          <span className="card__value">{painel.meusAlunos}</span>
        </div>
        <div className="card">
          <span className="card__label">Turmas ativas</span>
          <span className="card__value">{painel.turmasAtivas}</span>
        </div>
        <div className="card">
          <span className="card__label">Arrecadado no mês</span>
          <span className="card__value">{currency.format(painel.arrecadadoMes)}</span>
        </div>
        <div className="card">
          <span className="card__label">Pagamentos pendentes</span>
          <span className="card__value card__value--warning">{painel.pagamentosPendentes}</span>
        </div>
      </div>

      <section className="panel">
        <h2>Atalhos</h2>
        <div className="shortcuts">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('alunos-pagamentos')}>
            Cadastrar Aluno
          </button>
          <button type="button" className="btn btn-gold" onClick={() => onNavigate('presencas')}>
            Fazer Chamada
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => onNavigate('horarios')}>
            Organizar Horários
          </button>
        </div>
      </section>
    </div>
  )
}
