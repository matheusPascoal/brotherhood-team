import { useState } from 'react'
import { AlertTriangle, ArrowLeftRight, DollarSign, Package } from 'lucide-react'
import { useAppData, type NovoMaterialInput, type NovoMovimentoEstoqueInput } from '../../state/AppDataContext'
import { computeEstoqueAtual, computeEstoqueOverview } from '../../domain/selectors'
import { currency, formatDataLocal } from '../../domain/format'
import { MES_ATUAL } from '../../mocks/mockData'
import type { TipoMovimentoEstoque } from '../../domain/types'
import { Badge } from '../../components/Badge'

const EMPTY_MATERIAL_FORM: NovoMaterialInput = { nome: '', categoria: '', unidade: 'unidade', estoqueMinimo: 0, precoUnitario: 0 }
const EMPTY_MOVIMENTO_FORM: Omit<NovoMovimentoEstoqueInput, 'materialId'> = {
  tipo: 'entrada',
  quantidade: 1,
  data: MES_ATUAL,
  motivo: '',
}

export function EstoquePage() {
  const {
    materiais,
    movimentosEstoque,
    currentAccount,
    createMaterial,
    updateMaterial,
    setMaterialStatus,
    deleteMaterial,
    registrarMovimentoEstoque,
  } = useAppData()

  const [busca, setBusca] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<NovoMaterialInput>(EMPTY_MATERIAL_FORM)

  const [movimentoMaterialId, setMovimentoMaterialId] = useState<string | null>(null)
  const [movimentoForm, setMovimentoForm] = useState(EMPTY_MOVIMENTO_FORM)
  const [erroMovimento, setErroMovimento] = useState('')

  if (!currentAccount) return null
  const registradoPorId = currentAccount.id

  const estoque = computeEstoqueAtual(materiais, movimentosEstoque)
  const overview = computeEstoqueOverview(estoque, movimentosEstoque)

  const linhas = estoque.filter((item) => item.material.nome.toLowerCase().includes(busca.toLowerCase()))
  const nomeDoMaterial = (materialId: string) => materiais.find((m) => m.id === materialId)?.nome ?? '—'
  const historico = [...movimentosEstoque].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15)

  function abrirCadastro() {
    setEditingId(null)
    setForm(EMPTY_MATERIAL_FORM)
    setFormOpen(true)
  }

  function abrirEdicao(materialId: string) {
    const material = materiais.find((m) => m.id === materialId)
    if (!material) return
    setEditingId(materialId)
    setForm({
      nome: material.nome,
      categoria: material.categoria ?? '',
      unidade: material.unidade,
      estoqueMinimo: material.estoqueMinimo,
      precoUnitario: material.precoUnitario ?? 0,
    })
    setFormOpen(true)
  }

  function salvarMaterial() {
    if (!form.nome || !form.unidade) return
    if (editingId) {
      updateMaterial(editingId, form)
    } else {
      createMaterial(form)
    }
    setFormOpen(false)
  }

  function remover(materialId: string) {
    if (!window.confirm('Remover este material? Essa ação não pode ser desfeita.')) return
    const result = deleteMaterial(materialId)
    if (!result.success) alert(result.error)
  }

  function abrirMovimentacao(materialId: string) {
    setMovimentoMaterialId(materialId)
    setMovimentoForm(EMPTY_MOVIMENTO_FORM)
    setErroMovimento('')
  }

  function salvarMovimento() {
    if (!movimentoMaterialId) return
    if (movimentoForm.quantidade <= 0) {
      setErroMovimento('Informe uma quantidade maior que zero.')
      return
    }
    const item = estoque.find((e) => e.material.id === movimentoMaterialId)
    if (movimentoForm.tipo === 'saida' && item && movimentoForm.quantidade > item.quantidadeAtual) {
      setErroMovimento(`Estoque insuficiente. Disponível: ${item.quantidadeAtual} ${item.material.unidade}.`)
      return
    }
    registrarMovimentoEstoque({ materialId: movimentoMaterialId, ...movimentoForm }, registradoPorId)
    setMovimentoMaterialId(null)
  }

  return (
    <div className="page">
      <h1>Controle de Estoque</h1>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Itens Cadastrados</span>
            <span className="stat-tile__icon stat-tile__icon--neutral">
              <Package size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value">{overview.totalItensCadastrados}</div>
          <div className="stat-tile__hint">Materiais ativos no catálogo</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Estoque Baixo</span>
            <span className="stat-tile__icon stat-tile__icon--primary">
              <AlertTriangle size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value stat-tile__value--primary">{overview.itensAbaixoDoMinimo}</div>
          <div className="stat-tile__hint">Abaixo do estoque mínimo</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Valor em Estoque</span>
            <span className="stat-tile__icon stat-tile__icon--gold">
              <DollarSign size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value stat-tile__value--gold">{currency.format(overview.valorTotalEmEstoque)}</div>
          <div className="stat-tile__hint">Baseado no preço unitário cadastrado</div>
        </div>

        <div className="stat-tile">
          <div className="stat-tile__top">
            <span className="card__label">Movimentações no Mês</span>
            <span className="stat-tile__icon stat-tile__icon--neutral">
              <ArrowLeftRight size={18} strokeWidth={1.75} />
            </span>
          </div>
          <div className="stat-tile__value">{overview.movimentacoesNoMes}</div>
          <div className="stat-tile__hint">Entradas e saídas registradas</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Buscar material…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={abrirCadastro}>
          + Novo Material
        </button>
      </div>

      {formOpen && (
        <section className="form-panel">
          <h2>{editingId ? 'Editar material' : 'Novo material'}</h2>
          <div className="form-grid">
            <label>
              Nome
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </label>
            <label>
              Categoria
              <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
            </label>
            <label>
              Unidade
              <input
                value={form.unidade}
                onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                placeholder="unidade, par, caixa…"
              />
            </label>
            <label>
              Estoque mínimo
              <input
                type="number"
                min={0}
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value) })}
              />
            </label>
            <label>
              Preço unitário (R$)
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.precoUnitario}
                onChange={(e) => setForm({ ...form, precoUnitario: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={salvarMaterial}>
              Salvar
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </button>
          </div>
        </section>
      )}

      {movimentoMaterialId && (
        <section className="form-panel">
          <h2>Movimentar estoque — {nomeDoMaterial(movimentoMaterialId)}</h2>
          <div className="form-grid">
            <label>
              Tipo
              <select
                value={movimentoForm.tipo}
                onChange={(e) => setMovimentoForm({ ...movimentoForm, tipo: e.target.value as TipoMovimentoEstoque })}
              >
                <option value="entrada">Entrada (compra)</option>
                <option value="saida">Saída (uso/venda)</option>
              </select>
            </label>
            <label>
              Quantidade
              <input
                type="number"
                min={1}
                value={movimentoForm.quantidade}
                onChange={(e) => setMovimentoForm({ ...movimentoForm, quantidade: Number(e.target.value) })}
              />
            </label>
            <label>
              Data
              <input
                type="date"
                value={movimentoForm.data}
                onChange={(e) => setMovimentoForm({ ...movimentoForm, data: e.target.value })}
              />
            </label>
            <label>
              Motivo
              <input
                value={movimentoForm.motivo}
                onChange={(e) => setMovimentoForm({ ...movimentoForm, motivo: e.target.value })}
                placeholder="Compra fornecedor, venda para aluno…"
              />
            </label>
          </div>
          {erroMovimento && <p className="empty-state">{erroMovimento}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={salvarMovimento}>
              Registrar
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setMovimentoMaterialId(null)}>
              Cancelar
            </button>
          </div>
        </section>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Categoria</th>
            <th>Estoque Atual</th>
            <th>Mínimo</th>
            <th>Preço Unit.</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((item) => (
            <tr key={item.material.id}>
              <td>{item.material.nome}</td>
              <td>{item.material.categoria || '—'}</td>
              <td>
                <Badge tone={item.abaixoDoMinimo ? 'danger' : 'success'}>
                  {item.quantidadeAtual} {item.material.unidade}
                </Badge>
              </td>
              <td>{item.material.estoqueMinimo}</td>
              <td>{item.material.precoUnitario ? currency.format(item.material.precoUnitario) : '—'}</td>
              <td>
                <Badge tone={item.material.status === 'ativo' ? 'success' : 'neutral'}>
                  {item.material.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </td>
              <td className="table__actions">
                <button type="button" onClick={() => abrirMovimentacao(item.material.id)}>
                  Movimentar
                </button>
                <button type="button" onClick={() => abrirEdicao(item.material.id)}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setMaterialStatus(item.material.id, item.material.status === 'ativo' ? 'inativo' : 'ativo')}
                >
                  {item.material.status === 'ativo' ? 'Inativar' : 'Reativar'}
                </button>
                <button type="button" className="btn-danger" onClick={() => remover(item.material.id)}>
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="panel" style={{ marginTop: 'var(--space-5)' }}>
        <div className="panel__header">
          <div className="panel__title">Histórico de Movimentações</div>
        </div>

        {historico.length === 0 ? (
          <p className="empty-state">Nenhuma movimentação registrada ainda.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Material</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((mov) => (
                <tr key={mov.id}>
                  <td>{formatDataLocal(mov.data)}</td>
                  <td>{nomeDoMaterial(mov.materialId)}</td>
                  <td>
                    <Badge tone={mov.tipo === 'entrada' ? 'success' : 'warning'}>
                      {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </td>
                  <td>{mov.quantidade}</td>
                  <td>{mov.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
