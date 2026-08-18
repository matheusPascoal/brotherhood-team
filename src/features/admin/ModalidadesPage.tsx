import { useState } from 'react'
import { useAppData, type NovoModalidadeInput } from '../../state/AppDataContext'
import { BeltPill } from '../../components/Badge'

const EMPTY_FORM: NovoModalidadeInput = { nome: '', faixasOrdem: [] }

function parseFaixas(texto: string): string[] {
  return texto
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)
}

export function ModalidadesPage() {
  const { modalidades, professores, alunos, turmas, createModalidade, updateModalidade, deleteModalidade } = useAppData()
  const [busca, setBusca] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NovoModalidadeInput>(EMPTY_FORM)
  const [faixasTexto, setFaixasTexto] = useState('')

  const linhas = modalidades.filter((m) => m.nome.toLowerCase().includes(busca.toLowerCase()))

  const professoresCount = (modalidadeId: string) =>
    professores.filter((p) => p.modalidadeIds.includes(modalidadeId)).length
  const alunosCount = (modalidadeId: string) => alunos.filter((a) => a.modalidadeId === modalidadeId).length
  const turmasCount = (modalidadeId: string) => turmas.filter((t) => t.modalidadeId === modalidadeId).length

  function abrirCadastro() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFaixasTexto('')
    setFormOpen(true)
  }

  function abrirEdicao(modalidadeId: string) {
    const modalidade = modalidades.find((m) => m.id === modalidadeId)
    if (!modalidade) return
    setEditingId(modalidadeId)
    setForm({ nome: modalidade.nome, faixasOrdem: modalidade.faixasOrdem })
    setFaixasTexto(modalidade.faixasOrdem.join(', '))
    setFormOpen(true)
  }

  function salvar() {
    if (!form.nome) return
    const payload: NovoModalidadeInput = { nome: form.nome, faixasOrdem: parseFaixas(faixasTexto) }
    if (editingId) {
      updateModalidade(editingId, payload)
    } else {
      createModalidade(payload)
    }
    setFormOpen(false)
  }

  function remover(modalidadeId: string) {
    if (!window.confirm('Remover esta modalidade? Essa ação não pode ser desfeita.')) return
    const result = deleteModalidade(modalidadeId)
    if (!result.success) alert(result.error)
  }

  return (
    <div className="page">
      <h1>Modalidades</h1>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar modalidade…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={abrirCadastro}>
          + Nova Modalidade
        </button>
      </div>

      {formOpen && (
        <section className="form-panel">
          <h2>{editingId ? 'Editar modalidade' : 'Nova modalidade'}</h2>
          <div className="form-grid">
            <label>
              Nome
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </label>
            <label>
              Ordem das faixas (separadas por vírgula)
              <input
                value={faixasTexto}
                onChange={(e) => setFaixasTexto(e.target.value)}
                placeholder="Branca, Azul, Roxa, Marrom, Preta"
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={salvar}>
              Salvar
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
            <th>Nome</th>
            <th>Ordem das faixas</th>
            <th>Professores</th>
            <th>Alunos</th>
            <th>Turmas</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((modalidade) => (
            <tr key={modalidade.id}>
              <td>{modalidade.nome}</td>
              <td>
                {modalidade.faixasOrdem.length === 0 ? (
                  '—'
                ) : (
                  <div className="table__actions">
                    {modalidade.faixasOrdem.map((faixa) => (
                      <BeltPill key={faixa} faixa={faixa} />
                    ))}
                  </div>
                )}
              </td>
              <td>{professoresCount(modalidade.id)}</td>
              <td>{alunosCount(modalidade.id)}</td>
              <td>{turmasCount(modalidade.id)}</td>
              <td className="table__actions">
                <button type="button" onClick={() => abrirEdicao(modalidade.id)}>
                  Editar
                </button>
                <button type="button" className="btn-danger" onClick={() => remover(modalidade.id)}>
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
