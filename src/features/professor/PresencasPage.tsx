import { useMemo, useState } from 'react'
import { useAppData } from '../../state/AppDataContext'
import { getAlunosDaTurma } from '../../domain/selectors'
import { formatDataLocal } from '../../domain/format'

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function PresencasPage() {
  const { currentAccount, profiles, alunos, turmas, presencas, salvarChamada } = useAppData()
  const minhasTurmasIniciais = turmas.filter((t) => t.professorId === currentAccount?.id)
  const [turmaId, setTurmaId] = useState(minhasTurmasIniciais[0]?.id ?? '')
  const [dataAula, setDataAula] = useState(hoje())
  const [observacaoAula, setObservacaoAula] = useState('')
  const [presentesPorAluno, setPresentesPorAluno] = useState<Record<string, boolean>>({})

  if (!currentAccount) return null
  const minhasTurmas = turmas.filter((t) => t.professorId === currentAccount.id)

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const turmaSelecionada = minhasTurmas.find((t) => t.id === turmaId)
  const alunosDaTurma = useMemo(
    () => (turmaSelecionada ? getAlunosDaTurma(turmaSelecionada, alunos) : []),
    [turmaSelecionada, alunos]
  )

  const chamadasAnteriores = useMemo(
    () =>
      Array.from(new Set(presencas.filter((p) => p.turmaId === turmaId).map((p) => p.dataAula))).sort().reverse(),
    [presencas, turmaId]
  )

  function carregarChamadaExistente(data: string) {
    setDataAula(data)
    const registros = presencas.filter((p) => p.turmaId === turmaId && p.dataAula === data)
    setPresentesPorAluno(Object.fromEntries(registros.map((r) => [r.alunoId, r.presente])))
    setObservacaoAula(registros[0]?.observacaoAula ?? '')
  }

  async function salvar() {
    if (!turmaId || !dataAula) return
    const result = await salvarChamada(
      turmaId,
      dataAula,
      alunosDaTurma.map((a) => ({ alunoId: a.id, presente: presentesPorAluno[a.id] ?? false })),
      observacaoAula
    )
    if (!result.success) alert(result.error)
  }

  return (
    <div className="page">
      <h1>Registro de Presenças</h1>

      <div className="toolbar">
        <select
          value={turmaId}
          onChange={(e) => {
            setTurmaId(e.target.value)
            setPresentesPorAluno({})
            setObservacaoAula('')
          }}
        >
          {minhasTurmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
        <input type="date" value={dataAula} onChange={(e) => carregarChamadaExistente(e.target.value)} />
      </div>

      {turmaSelecionada && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Presente</th>
              </tr>
            </thead>
            <tbody>
              {alunosDaTurma.map((aluno) => (
                <tr key={aluno.id}>
                  <td>{nomeDoProfile(aluno.profileId)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={presentesPorAluno[aluno.id] ?? false}
                      onChange={(e) => setPresentesPorAluno({ ...presentesPorAluno, [aluno.id]: e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <label className="observacao-aula">
            Observação da aula
            <textarea value={observacaoAula} onChange={(e) => setObservacaoAula(e.target.value)} rows={3} />
          </label>

          <div className="form-actions">
            <button type="button" className="btn btn-gold" onClick={salvar}>
              Salvar Chamada do Treino
            </button>
          </div>

          <section className="panel">
            <h2>Aulas anteriores desta turma</h2>
            {chamadasAnteriores.length === 0 ? (
              <p className="empty-state">Nenhuma chamada registrada ainda.</p>
            ) : (
              <ul className="feed">
                {chamadasAnteriores.map((data) => (
                  <li key={data}>
                    <button type="button" onClick={() => carregarChamadaExistente(data)}>
                      {formatDataLocal(data)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
