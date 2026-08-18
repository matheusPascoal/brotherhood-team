import type {
  Aluno,
  GraduacaoHistorico,
  Material,
  Modalidade,
  MovimentoEstoque,
  Pagamento,
  Presenca,
  Profile,
  Professor,
  Turma,
} from '../domain/types'

function firstDayOfMonth(offsetMonths: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  return d.toISOString().slice(0, 10)
}

export const MES_ATUAL = firstDayOfMonth(0)
const MES_ANTERIOR = firstDayOfMonth(-1)

// Meta de receita mensal: ainda não modelada no banco (não existe tabela para
// isso na seção 3 do plano). Fica como constante mock até decidirmos onde
// essa meta deveria morar (ex.: uma tabela "metas" ou config da academia).
export const META_MENSAL_PREVISTA = 1500

export const modalidades: Modalidade[] = [
  { id: 'modalidade-bjj', nome: 'Jiu-Jitsu (BJJ)', faixasOrdem: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'] },
  { id: 'modalidade-muaythai', nome: 'Muay Thai', faixasOrdem: ['Branca', 'Amarela', 'Verde', 'Azul', 'Marrom', 'Preta'] },
  { id: 'modalidade-judo', nome: 'Judô', faixasOrdem: ['Branca', 'Cinza', 'Azul', 'Amarela', 'Laranja', 'Verde', 'Roxa', 'Marrom', 'Preta'] },
  { id: 'modalidade-karate', nome: 'Karate-Dô', faixasOrdem: ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'] },
  { id: 'modalidade-kickboxing', nome: 'Kickboxing', faixasOrdem: ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'] },
  { id: 'modalidade-taekwondo', nome: 'Taekwondo', faixasOrdem: ['Branca', 'Amarela', 'Verde', 'Azul', 'Vermelha', 'Preta'] },
  { id: 'modalidade-musculacao', nome: 'Musculação', faixasOrdem: [] },
]

// Professores e alunos de demonstração foram removidos — o app agora é
// público (deploy na Vercel) e não deve exibir contas fictícias. Only o
// profile admin permanece (não é usado para login, que é 100% Supabase
// Auth; fica só como fallback de exibição em registros antigos de estoque).
export const profiles: Profile[] = [
  { id: 'profile-carlos', fullName: 'Carlos Eduardo', email: 'carlos.eduardo@brotherhoodteam.test', role: 'admin', status: 'ativo' },
]

export const professores: Professor[] = []

export const alunos: Aluno[] = []

export const turmas: Turma[] = []

export const pagamentos: Pagamento[] = []

export const presencas: Presenca[] = []

export const graduacoesHistorico: GraduacaoHistorico[] = []

export const materiais: Material[] = [
  { id: 'material-kimono-bjj', nome: 'Kimono BJJ Adulto', categoria: 'Uniformes', unidade: 'unidade', estoqueMinimo: 5, precoUnitario: 220, status: 'ativo' },
  { id: 'material-faixa', nome: 'Faixa (todas as cores)', categoria: 'Uniformes', unidade: 'unidade', estoqueMinimo: 10, precoUnitario: 35, status: 'ativo' },
  { id: 'material-luva-muaythai', nome: 'Luva de Muay Thai', categoria: 'Equipamentos', unidade: 'par', estoqueMinimo: 4, precoUnitario: 90, status: 'ativo' },
  { id: 'material-protetor-bucal', nome: 'Protetor Bucal', categoria: 'Suprimentos', unidade: 'unidade', estoqueMinimo: 15, precoUnitario: 12, status: 'ativo' },
  { id: 'material-caneleira', nome: 'Caneleira', categoria: 'Equipamentos', unidade: 'par', estoqueMinimo: 4, precoUnitario: 75, status: 'ativo' },
]

export const movimentosEstoque: MovimentoEstoque[] = [
  { id: 'movimento-kimono-entrada', materialId: 'material-kimono-bjj', tipo: 'entrada', quantidade: 10, data: MES_ANTERIOR, motivo: 'Compra fornecedor', registradoPor: 'profile-carlos' },
  { id: 'movimento-kimono-saida', materialId: 'material-kimono-bjj', tipo: 'saida', quantidade: 6, data: MES_ATUAL, motivo: 'Venda para aluno', registradoPor: 'profile-carlos' },
  { id: 'movimento-faixa-entrada', materialId: 'material-faixa', tipo: 'entrada', quantidade: 20, data: MES_ANTERIOR, motivo: 'Compra fornecedor', registradoPor: 'profile-carlos' },
  { id: 'movimento-faixa-saida', materialId: 'material-faixa', tipo: 'saida', quantidade: 15, data: MES_ATUAL, motivo: 'Graduações do mês', registradoPor: 'profile-carlos' },
  { id: 'movimento-protetor-entrada', materialId: 'material-protetor-bucal', tipo: 'entrada', quantidade: 10, data: MES_ANTERIOR, motivo: 'Compra fornecedor', registradoPor: 'profile-carlos' },
  { id: 'movimento-protetor-saida', materialId: 'material-protetor-bucal', tipo: 'saida', quantidade: 4, data: MES_ATUAL, motivo: 'Venda para aluno', registradoPor: 'profile-carlos' },
]
