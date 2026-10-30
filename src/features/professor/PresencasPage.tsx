import { useMemo, useState } from 'react'
import { useAppData } from '../../state/AppDataContext'
import { getAlunosDaTurma } from '../../domain/selectors'
import { formatDataLocal } from '../../domain/format'

// new Date().toISOString() converte pra UTC — no horário de Brasília (UTC-3),
// a partir das 21h isso já devolve o dia seguinte, o que fazia a chamada de
// uma aula noturna ser salva com a data errada (parecia "sumir" ao conferir
// no dia certo depois). Usa os componentes de data locais em vez do ISO.
function hoje(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function PresencasPage() {
  const { currentAccount, profiles, alunos, alunoModalidades, turmas, presencas, salvarChamada } = useAppData()
  const minhasTurmas = turmas.filter((t) => t.professorId === currentAccount?.id)
  const [turmaId, setTurmaId] = useState(minhasTurmas[0]?.id ?? '')
  const [dataAula, setDataAula] = useState(hoje())
  const [observacaoAula, setObservacaoAula] = useState('')
  const [presentesPorAluno, setPresentesPorAluno] = useState<Record<string, boolean>>({})

  const turmaSelecionada = minhasTurmas.find((t) => t.id === turmaId)
  const alunosDaTurma = useMemo(
    () => (turmaSelecionada ? getAlunosDaTurma(turmaSelecionada, alunos, alunoModalidades) : []),
    [turmaSelecionada, alunos, alunoModalidades]
  )

  const chamadasAnteriores = useMemo(
    () =>
      Array.from(new Set(presencas.filter((p) => p.turmaId === turmaId).map((p) => p.dataAula))).sort().reverse(),
    [presencas, turmaId]
  )

  if (!currentAccount) return null

  const nomeDoProfile = (profileId?: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'

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
    if (!result.success) alert(result.error ?? 'Não foi possível salvar a chamada.')
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
        <select
          value={chamadasAnteriores.includes(dataAula) ? dataAula : ''}
          onChange={(e) => e.target.value && carregarChamadaExistente(e.target.value)}
          disabled={chamadasAnteriores.length === 0}
        >
          <option value="" disabled>
            {chamadasAnteriores.length === 0 ? 'Nenhuma aula salva ainda' : 'Aulas salvas…'}
          </option>
          {chamadasAnteriores.map((data) => (
            <option key={data} value={data}>
              {formatDataLocal(data)}
            </option>
          ))}
        </select>
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
        </>
      )}
    </div>
  )
}
