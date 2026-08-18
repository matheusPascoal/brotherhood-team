export type Role = 'admin' | 'professor' | 'aluno'
export type AccountStatus = 'ativo' | 'inativo'
export type AlunoStatus = 'ativo' | 'inativo' | 'trancado'
export type StatusPagamento = 'pendente' | 'confirmado' | 'atrasado'
export type MetodoPagamento = 'pix' | 'dinheiro' | 'cartao' | 'outro'
export type DiaSemana =
  | 'domingo'
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
export type TipoMovimentoEstoque = 'entrada' | 'saida'

export interface Profile {
  id: string
  fullName: string
  email: string
  phone?: string
  role: Role
  status: AccountStatus
}

export interface Modalidade {
  id: string
  nome: string
  faixasOrdem: string[]
}

export interface Professor {
  id: string
  profileId: string
  comissaoPercentual: number
  modalidadeIds: string[]
  status: AccountStatus
}

export interface Aluno {
  id: string
  profileId?: string
  cpf: string
  professorId: string
  modalidadeId: string
  faixaAtual: string
  grauAtual: number
  mensalidadeValor: number
  diaVencimento: number
  status: AlunoStatus
}

export interface Turma {
  id: string
  professorId: string
  modalidadeId: string
  nome: string
  local?: string
  capacidadeMaxima: number
  horaInicio: string
  horaFim: string
  diasSemana: DiaSemana[]
}

export interface Pagamento {
  id: string
  alunoId: string
  mesReferencia: string // ISO, sempre dia 1 do mês
  valor: number
  status: StatusPagamento
  metodo?: MetodoPagamento
  confirmadoPor?: string
  confirmadoEm?: string
  observacao?: string
}

export interface Presenca {
  id: string
  turmaId: string
  alunoId: string
  dataAula: string
  presente: boolean
  observacaoAula?: string
}

export interface GraduacaoHistorico {
  id: string
  alunoId: string
  faixa: string
  grau: number
  dataGraduacao: string
  registradoPor?: string
}

export interface Material {
  id: string
  nome: string
  categoria?: string
  unidade: string
  estoqueMinimo: number
  precoUnitario?: number
  status: AccountStatus
}

export interface MovimentoEstoque {
  id: string
  materialId: string
  tipo: TipoMovimentoEstoque
  quantidade: number
  data: string
  motivo?: string
  observacao?: string
  registradoPor?: string
}
