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
]

export const profiles: Profile[] = [
  { id: 'profile-carlos', fullName: 'Carlos Eduardo', email: 'carlos.eduardo@brotherhoodteam.test', role: 'admin', status: 'ativo' },
  { id: 'profile-marcos', fullName: 'Mestre Marcos Silva', email: 'marcos.silva@brotherhoodteam.test', role: 'professor', status: 'ativo' },
  { id: 'profile-rafael', fullName: 'Sensei Rafael Oliveira', email: 'rafael.oliveira@brotherhoodteam.test', role: 'professor', status: 'ativo' },
  { id: 'profile-juliana', fullName: 'Profª Juliana Santos', email: 'juliana.santos@brotherhoodteam.test', role: 'professor', status: 'ativo' },
  { id: 'profile-lucas', fullName: 'Lucas Santos', email: 'lucas.santos@brotherhoodteam.test', role: 'aluno', status: 'ativo' },
  { id: 'profile-beatriz', fullName: 'Beatriz Souza', email: 'beatriz.souza@brotherhoodteam.test', role: 'aluno', status: 'ativo' },
  { id: 'profile-pedro', fullName: 'Pedro Almeida', email: 'pedro.almeida@brotherhoodteam.test', role: 'aluno', status: 'ativo' },
  { id: 'profile-camila', fullName: 'Camila Ferreira', email: 'camila.ferreira@brotherhoodteam.test', role: 'aluno', status: 'ativo' },
  { id: 'profile-gabriel', fullName: 'Gabriel Costa', email: 'gabriel.costa@brotherhoodteam.test', role: 'aluno', status: 'ativo' },
]

export const professores: Professor[] = [
  { id: 'professor-marcos', profileId: 'profile-marcos', comissaoPercentual: 60, modalidadeIds: ['modalidade-bjj'], status: 'ativo' },
  { id: 'professor-rafael', profileId: 'profile-rafael', comissaoPercentual: 55, modalidadeIds: ['modalidade-muaythai'], status: 'ativo' },
  { id: 'professor-juliana', profileId: 'profile-juliana', comissaoPercentual: 50, modalidadeIds: ['modalidade-judo'], status: 'ativo' },
]

export const alunos: Aluno[] = [
  { id: 'aluno-lucas', profileId: 'profile-lucas', cpf: '11122233344', professorId: 'profile-marcos', modalidadeId: 'modalidade-bjj', faixaAtual: 'Azul', grauAtual: 2, mensalidadeValor: 150, diaVencimento: 5, status: 'ativo' },
  { id: 'aluno-beatriz', profileId: 'profile-beatriz', cpf: '22233344455', professorId: 'profile-marcos', modalidadeId: 'modalidade-bjj', faixaAtual: 'Branca', grauAtual: 1, mensalidadeValor: 150, diaVencimento: 10, status: 'ativo' },
  { id: 'aluno-pedro', profileId: 'profile-pedro', cpf: '33344455566', professorId: 'profile-rafael', modalidadeId: 'modalidade-muaythai', faixaAtual: 'Amarela', grauAtual: 0, mensalidadeValor: 130, diaVencimento: 15, status: 'ativo' },
  { id: 'aluno-camila', profileId: 'profile-camila', cpf: '44455566677', professorId: 'profile-rafael', modalidadeId: 'modalidade-muaythai', faixaAtual: 'Verde', grauAtual: 1, mensalidadeValor: 130, diaVencimento: 20, status: 'ativo' },
  { id: 'aluno-gabriel', profileId: 'profile-gabriel', cpf: '55566677788', professorId: 'profile-juliana', modalidadeId: 'modalidade-judo', faixaAtual: 'Azul', grauAtual: 0, mensalidadeValor: 140, diaVencimento: 25, status: 'ativo' },
]

export const turmas: Turma[] = [
  { id: 'turma-bjj-manha', professorId: 'profile-marcos', modalidadeId: 'modalidade-bjj', nome: 'BJJ Manhã', local: 'Tatame 1', capacidadeMaxima: 20, horaInicio: '07:00', horaFim: '08:30', diasSemana: ['segunda', 'quarta', 'sexta'] },
  { id: 'turma-muaythai-noite', professorId: 'profile-rafael', modalidadeId: 'modalidade-muaythai', nome: 'Muay Thai Noite', local: 'Ringue', capacidadeMaxima: 15, horaInicio: '19:00', horaFim: '20:30', diasSemana: ['terca', 'quinta'] },
  { id: 'turma-judo-tarde', professorId: 'profile-juliana', modalidadeId: 'modalidade-judo', nome: 'Judô Tarde', local: 'Tatame 2', capacidadeMaxima: 18, horaInicio: '17:00', horaFim: '18:30', diasSemana: ['segunda', 'quarta'] },
]

export const pagamentos: Pagamento[] = [
  { id: 'pagamento-lucas-atual', alunoId: 'aluno-lucas', mesReferencia: MES_ATUAL, valor: 150, status: 'confirmado', metodo: 'pix', confirmadoPor: 'profile-marcos', confirmadoEm: new Date().toISOString() },
  { id: 'pagamento-beatriz-atual', alunoId: 'aluno-beatriz', mesReferencia: MES_ATUAL, valor: 150, status: 'pendente' },
  { id: 'pagamento-pedro-atual', alunoId: 'aluno-pedro', mesReferencia: MES_ATUAL, valor: 130, status: 'confirmado', metodo: 'dinheiro', confirmadoPor: 'profile-rafael', confirmadoEm: new Date().toISOString() },
  { id: 'pagamento-camila-atual', alunoId: 'aluno-camila', mesReferencia: MES_ATUAL, valor: 130, status: 'atrasado' },
  { id: 'pagamento-gabriel-atual', alunoId: 'aluno-gabriel', mesReferencia: MES_ATUAL, valor: 140, status: 'confirmado', metodo: 'pix', confirmadoPor: 'profile-juliana', confirmadoEm: new Date().toISOString() },
  { id: 'pagamento-lucas-anterior', alunoId: 'aluno-lucas', mesReferencia: MES_ANTERIOR, valor: 150, status: 'confirmado', metodo: 'pix', confirmadoPor: 'profile-marcos', confirmadoEm: MES_ANTERIOR },
  { id: 'pagamento-beatriz-anterior', alunoId: 'aluno-beatriz', mesReferencia: MES_ANTERIOR, valor: 150, status: 'confirmado', metodo: 'pix', confirmadoPor: 'profile-marcos', confirmadoEm: MES_ANTERIOR },
]

export const presencas: Presenca[] = []

export const graduacoesHistorico: GraduacaoHistorico[] = [
  { id: 'graduacao-lucas-1', alunoId: 'aluno-lucas', faixa: 'Branca', grau: 4, dataGraduacao: '2024-06-01', registradoPor: 'profile-marcos' },
  { id: 'graduacao-lucas-2', alunoId: 'aluno-lucas', faixa: 'Azul', grau: 2, dataGraduacao: '2025-11-01', registradoPor: 'profile-marcos' },
]

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
