import type { AlunoModalidadeInput } from '../../state/AppDataContext'
import type { Modalidade, Profile, Professor, Turma } from '../../domain/types'

interface AlunoModalidadesFormProps {
  value: AlunoModalidadeInput[]
  onChange: (next: AlunoModalidadeInput[]) => void
  professores: Professor[]
  profiles: Profile[]
  modalidades: Modalidade[]
  turmas: Turma[]
  // Contexto do professor: cada bloco novo já nasce com o professor fixo e o
  // select de professor some (o professor só matricula em si mesmo).
  fixedProfessorId?: string
}

function blocoVazio(fixedProfessorId?: string): AlunoModalidadeInput {
  return {
    professorId: fixedProfessorId ?? '',
    modalidadeId: '',
    faixaAtual: '',
    grauAtual: 0,
    mensalidadeValor: 0,
    diaVencimento: 5,
    turmaIds: [],
  }
}

// Sub-formulário repetível de matrícula: cada bloco é uma modalidade que o
// aluno pratica, com seu próprio professor, faixa/grau, mensalidade e
// turma(s). Compartilhado entre o cadastro de aluno do admin e do professor.
export function AlunoModalidadesForm({
  value,
  onChange,
  professores,
  profiles,
  modalidades,
  turmas,
  fixedProfessorId,
}: AlunoModalidadesFormProps) {
  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'

  function atualizarBloco(index: number, patch: Partial<AlunoModalidadeInput>) {
    onChange(value.map((bloco, i) => (i === index ? { ...bloco, ...patch } : bloco)))
  }

  function removerBloco(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function toggleTurma(index: number, turmaId: string) {
    const bloco = value[index]
    const turmaIds = bloco.turmaIds.includes(turmaId)
      ? bloco.turmaIds.filter((id) => id !== turmaId)
      : [...bloco.turmaIds, turmaId]
    atualizarBloco(index, { turmaIds })
  }

  return (
    <div className="aluno-modalidades-form">
      {value.map((bloco, index) => {
        const turmasDoBloco = turmas.filter((t) => t.professorId === bloco.professorId && t.modalidadeId === bloco.modalidadeId)
        return (
          <fieldset className="aluno-modalidade-bloco" key={index}>
            <legend>Modalidade {index + 1}</legend>
            <div className="form-grid">
              {!fixedProfessorId && (
                <label>
                  Professor responsável
                  <select value={bloco.professorId} onChange={(e) => atualizarBloco(index, { professorId: e.target.value, turmaIds: [] })}>
                    <option value="">Selecione…</option>
                    {professores.map((p) => (
                      <option key={p.id} value={p.profileId}>
                        {nomeDoProfile(p.profileId)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Modalidade
                <select
                  value={bloco.modalidadeId}
                  onChange={(e) => atualizarBloco(index, { modalidadeId: e.target.value, turmaIds: [] })}
                >
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
                <input value={bloco.faixaAtual} onChange={(e) => atualizarBloco(index, { faixaAtual: e.target.value })} />
              </label>
              <label>
                Grau (0–4)
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={bloco.grauAtual}
                  onChange={(e) => atualizarBloco(index, { grauAtual: Number(e.target.value) })}
                />
              </label>
              <label>
                Mensalidade (R$)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={bloco.mensalidadeValor}
                  onChange={(e) => atualizarBloco(index, { mensalidadeValor: Number(e.target.value) })}
                />
              </label>
              <label>
                Dia de vencimento (1–31)
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={bloco.diaVencimento}
                  onChange={(e) => atualizarBloco(index, { diaVencimento: Number(e.target.value) })}
                />
              </label>
              <fieldset>
                <legend>Turmas</legend>
                {!bloco.professorId || !bloco.modalidadeId ? (
                  <span className="empty-state">Selecione professor e modalidade.</span>
                ) : turmasDoBloco.length === 0 ? (
                  <span className="empty-state">Nenhuma turma cadastrada para essa modalidade.</span>
                ) : (
                  turmasDoBloco.map((t) => (
                    <label key={t.id} className="checkbox-label">
                      <input type="checkbox" checked={bloco.turmaIds.includes(t.id)} onChange={() => toggleTurma(index, t.id)} />
                      {t.nome}
                    </label>
                  ))
                )}
              </fieldset>
            </div>
            <button type="button" className="btn-danger" onClick={() => removerBloco(index)}>
              Remover modalidade
            </button>
          </fieldset>
        )
      })}
      <button type="button" className="btn btn-secondary" onClick={() => onChange([...value, blocoVazio(fixedProfessorId)])}>
        + Adicionar modalidade
      </button>
    </div>
  )
}
