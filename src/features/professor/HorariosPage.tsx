import { useState } from 'react'
import { useAppData, type NovaTurmaInput } from '../../state/AppDataContext'
import type { DiaSemana } from '../../domain/types'

const DIAS: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
const DIA_LABEL: Record<DiaSemana, string> = {
  domingo: 'Dom',
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
}

function emptyForm(professorId: string): NovaTurmaInput {
  return { professorId, modalidadeId: '', nome: '', local: '', capacidadeMaxima: 15, horaInicio: '07:00', horaFim: '08:00', diasSemana: [] }
}

export function HorariosPage() {
  const { currentAccount, turmas, modalidades, createTurma, updateTurma, deleteTurma } = useAppData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NovaTurmaInput>(emptyForm(currentAccount?.id ?? ''))
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  if (!currentAccount) return null
  const professorId = currentAccount.id

  const minhasTurmas = turmas.filter((t) => t.professorId === professorId)
  const nomeModalidade = (id: string) => modalidades.find((m) => m.id === id)?.nome ?? '—'

  function abrirCadastro() {
    setEditingId(null)
    setForm(emptyForm(professorId))
    setErro(null)
    setFormOpen(true)
  }

  function abrirEdicao(turmaId: string) {
    const turma = minhasTurmas.find((t) => t.id === turmaId)
    if (!turma) return
    setEditingId(turmaId)
    setForm({ ...turma })
    setErro(null)
    setFormOpen(true)
  }

  async function salvar() {
    if (!form.nome || !form.modalidadeId || form.diasSemana.length === 0) return
    setSalvando(true)
    const result = editingId ? await updateTurma(editingId, form) : await createTurma(form)
    setSalvando(false)
    if (!result.success) {
      setErro(result.error ?? 'Não foi possível salvar a turma.')
      return
    }
    setFormOpen(false)
  }

  async function remover(turmaId: string) {
    if (!window.confirm('Excluir esta turma? Essa ação não pode ser desfeita.')) return
    const result = await deleteTurma(turmaId)
    if (!result.success) alert(result.error)
  }

  function toggleDia(dia: DiaSemana) {
    setForm((f) => ({
      ...f,
      diasSemana: f.diasSemana.includes(dia) ? f.diasSemana.filter((d) => d !== dia) : [...f.diasSemana, dia],
    }))
  }

  return (
    <div className="page">
      <h1>Horários de Aulas</h1>

      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={abrirCadastro}>
          + Nova Turma
        </button>
      </div>

      {formOpen && (
        <section className="form-panel">
          <h2>{editingId ? 'Editar turma' : 'Nova turma'}</h2>
          <div className="form-grid">
            <label>
              Nome da turma
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </label>
            <label>
              Modalidade
              <select value={form.modalidadeId} onChange={(e) => setForm({ ...form, modalidadeId: e.target.value })}>
                <option value="">Selecione…</option>
                {modalidades.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Local
              <input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
            </label>
            <label>
              Capacidade máxima
              <input
                type="number"
                min={1}
                value={form.capacidadeMaxima}
                onChange={(e) => setForm({ ...form, capacidadeMaxima: Number(e.target.value) })}
              />
            </label>
            <label>
              Horário início
              <input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
            </label>
            <label>
              Horário fim
              <input type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} />
            </label>
            <fieldset>
              <legend>Dias da semana</legend>
              {DIAS.map((dia) => (
                <label key={dia} className="checkbox-label">
                  <input type="checkbox" checked={form.diasSemana.includes(dia)} onChange={() => toggleDia(dia)} />
                  {DIA_LABEL[dia]}
                </label>
              ))}
            </fieldset>
          </div>
          {erro && <p className="empty-state">{erro}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
          </div>
        </section>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Turma</th>
            <th>Modalidade</th>
            <th>Local</th>
            <th>Horário</th>
            <th>Dias</th>
            <th>Capacidade</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {minhasTurmas.map((turma) => (
            <tr key={turma.id}>
              <td>{turma.nome}</td>
              <td>{nomeModalidade(turma.modalidadeId)}</td>
              <td>{turma.local || '—'}</td>
              <td>
                {turma.horaInicio}–{turma.horaFim}
              </td>
              <td>{turma.diasSemana.map((d) => DIA_LABEL[d]).join(', ')}</td>
              <td>{turma.capacidadeMaxima}</td>
              <td className="table__actions">
                <button type="button" onClick={() => abrirEdicao(turma.id)}>
                  Editar
                </button>
                <button type="button" onClick={() => remover(turma.id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
