import { MES_ATUAL, META_MENSAL_PREVISTA } from '../mocks/mockData'
import type {
  Aluno,
  AlunoModalidade,
  GraduacaoHistorico,
  Material,
  Modalidade,
  MovimentoEstoque,
  Pagamento,
  Profile,
  Professor,
  Turma,
} from './types'

export type StatusFinanceiro = 'adimplente' | 'inadimplente' | 'sem_cobranca'

export function getStatusFinanceiroMatricula(
  alunoModalidadeId: string,
  mesReferencia: string,
  pagamentos: Pagamento[]
): StatusFinanceiro {
  const pagamento = pagamentos.find((p) => p.alunoModalidadeId === alunoModalidadeId && p.mesReferencia === mesReferencia)
  if (!pagamento) return 'sem_cobranca'
  return pagamento.status === 'confirmado' ? 'adimplente' : 'inadimplente'
}

export interface AdminOverview {
  receitaMensal: number
  metaMensalPrevista: number
  valorPendente: number
  totalAlunosAtivos: number
  totalProfessoresAtivos: number
  rankingProfessores: { professorId: string; nome: string; valorArrecadado: number }[]
  feedPagamentosConfirmados: {
    pagamentoId: string
    alunoNome: string
    valor: number
    metodo?: string
    confirmadoEm?: string
  }[]
}

interface OverviewInput {
  profiles: Profile[]
  professores: Professor[]
  alunos: Aluno[]
  alunoModalidades: AlunoModalidade[]
  pagamentos: Pagamento[]
}

export function computeAdminOverview({ profiles, professores, alunos, alunoModalidades, pagamentos }: OverviewInput): AdminOverview {
  const nomeDoProfile = (profileId: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const pagamentosDoMes = pagamentos.filter((p) => p.mesReferencia === MES_ATUAL)
  const matriculaPorId = (id: string) => alunoModalidades.find((am) => am.id === id)

  const receitaMensal = pagamentosDoMes
    .filter((p) => p.status === 'confirmado')
    .reduce((sum, p) => sum + p.valor, 0)

  const valorPendente = pagamentosDoMes
    .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + p.valor, 0)

  const rankingProfessores = professores
    .map((professor) => {
      const matriculasDoProfessor = new Set(
        alunoModalidades.filter((am) => am.professorId === professor.profileId).map((am) => am.id)
      )
      const valorArrecadado = pagamentosDoMes
        .filter((p) => p.status === 'confirmado' && matriculasDoProfessor.has(p.alunoModalidadeId))
        .reduce((sum, p) => sum + p.valor, 0)
      return { professorId: professor.profileId, nome: nomeDoProfile(professor.profileId), valorArrecadado }
    })
    .sort((a, b) => b.valorArrecadado - a.valorArrecadado)

  const feedPagamentosConfirmados = pagamentosDoMes
    .filter((p) => p.status === 'confirmado' && p.confirmadoEm)
    .sort((a, b) => (b.confirmadoEm ?? '').localeCompare(a.confirmadoEm ?? ''))
    .map((p) => {
      const matricula = matriculaPorId(p.alunoModalidadeId)
      const aluno = matricula ? alunos.find((a) => a.id === matricula.alunoId) : undefined
      return {
        pagamentoId: p.id,
        alunoNome: nomeDoProfile(aluno?.profileId ?? ''),
        valor: p.valor,
        metodo: p.metodo,
        confirmadoEm: p.confirmadoEm,
      }
    })

  return {
    receitaMensal,
    metaMensalPrevista: META_MENSAL_PREVISTA,
    valorPendente,
    totalAlunosAtivos: alunos.filter((a) => a.status === 'ativo').length,
    totalProfessoresAtivos: professores.filter((p) => p.status === 'ativo').length,
    rankingProfessores,
    feedPagamentosConfirmados,
  }
}

export interface RelatorioMensal {
  mesReferencia: string
  arrecadado: number
  pendente: number
  previstoTotal: number
  taxaArrecadacao: number
  porProfessor: { professorId: string; nome: string; arrecadado: number; pendente: number; previsto: number }[]
}

export function computeRelatorioMensal(
  mesReferencia: string,
  { profiles, professores, alunoModalidades, pagamentos }: OverviewInput
): RelatorioMensal {
  const nomeDoProfile = (profileId: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const pagamentosDoMes = pagamentos.filter((p) => p.mesReferencia === mesReferencia)

  const arrecadado = pagamentosDoMes.filter((p) => p.status === 'confirmado').reduce((sum, p) => sum + p.valor, 0)
  const pendente = pagamentosDoMes
    .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + p.valor, 0)
  const previstoTotal = pagamentosDoMes.reduce((sum, p) => sum + p.valor, 0)

  const porProfessor = professores.map((professor) => {
    const matriculasDoProfessor = new Set(
      alunoModalidades.filter((am) => am.professorId === professor.profileId).map((am) => am.id)
    )
    const pagamentosDoProfessor = pagamentosDoMes.filter((p) => matriculasDoProfessor.has(p.alunoModalidadeId))
    return {
      professorId: professor.profileId,
      nome: nomeDoProfile(professor.profileId),
      arrecadado: pagamentosDoProfessor.filter((p) => p.status === 'confirmado').reduce((sum, p) => sum + p.valor, 0),
      pendente: pagamentosDoProfessor
        .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
        .reduce((sum, p) => sum + p.valor, 0),
      previsto: pagamentosDoProfessor.reduce((sum, p) => sum + p.valor, 0),
    }
  })

  return {
    mesReferencia,
    arrecadado,
    pendente,
    previstoTotal,
    taxaArrecadacao: previstoTotal > 0 ? Math.round((arrecadado / previstoTotal) * 100) : 0,
    porProfessor,
  }
}

// Matrícula em turma é explícita (aluno_turmas) — o professor escolhe a(s)
// turma(s) específica(s) de cada modalidade do aluno.
export function getAlunosDaTurma(turma: Turma, alunos: Aluno[], alunoModalidades: AlunoModalidade[]): Aluno[] {
  const alunoIds = new Set(
    alunoModalidades.filter((am) => am.status === 'ativo' && am.turmaIds.includes(turma.id)).map((am) => am.alunoId)
  )
  return alunos.filter((a) => alunoIds.has(a.id) && a.status === 'ativo')
}

export function getTurmasDoAluno(aluno: Aluno, turmas: Turma[], alunoModalidades: AlunoModalidade[]): Turma[] {
  const turmaIds = new Set(
    alunoModalidades.filter((am) => am.alunoId === aluno.id).flatMap((am) => am.turmaIds)
  )
  return turmas.filter((t) => turmaIds.has(t.id))
}

export interface PainelProfessor {
  meusAlunos: number
  turmasAtivas: number
  arrecadadoMes: number
  pagamentosPendentes: number
}

export function computePainelProfessor(
  professorProfileId: string,
  {
    alunoModalidades,
    pagamentos,
    turmas,
  }: { alunoModalidades: AlunoModalidade[]; pagamentos: Pagamento[]; turmas: Turma[] }
): PainelProfessor {
  const minhasMatriculas = alunoModalidades.filter((am) => am.professorId === professorProfileId)
  const minhasMatriculasIds = new Set(minhasMatriculas.map((am) => am.id))
  const pagamentosDoMes = pagamentos.filter((p) => p.mesReferencia === MES_ATUAL && minhasMatriculasIds.has(p.alunoModalidadeId))

  return {
    meusAlunos: new Set(minhasMatriculas.filter((am) => am.status === 'ativo').map((am) => am.alunoId)).size,
    turmasAtivas: turmas.filter((t) => t.professorId === professorProfileId).length,
    arrecadadoMes: pagamentosDoMes.filter((p) => p.status === 'confirmado').reduce((sum, p) => sum + p.valor, 0),
    pagamentosPendentes: pagamentosDoMes.filter((p) => p.status === 'pendente' || p.status === 'atrasado').length,
  }
}

export interface PainelAlunoMatricula {
  alunoModalidade: AlunoModalidade
  professorNome: string
  modalidadeNome: string
  statusFinanceiroMes: StatusFinanceiro
  historicoPagamentos: Pagamento[]
  turmas: Turma[]
  graduacoes: GraduacaoHistorico[]
}

export interface PainelAluno {
  aluno: Aluno
  matriculas: PainelAlunoMatricula[]
}

export function computePainelAluno(
  alunoId: string,
  {
    alunos,
    alunoModalidades,
    profiles,
    modalidades,
    pagamentos,
    turmas,
    graduacoesHistorico,
  }: {
    alunos: Aluno[]
    alunoModalidades: AlunoModalidade[]
    profiles: Profile[]
    modalidades: Modalidade[]
    pagamentos: Pagamento[]
    turmas: Turma[]
    graduacoesHistorico: GraduacaoHistorico[]
  }
): PainelAluno | null {
  const aluno = alunos.find((a) => a.id === alunoId)
  if (!aluno) return null

  const matriculas = alunoModalidades
    .filter((am) => am.alunoId === aluno.id)
    .map((alunoModalidade) => ({
      alunoModalidade,
      professorNome: profiles.find((p) => p.id === alunoModalidade.professorId)?.fullName ?? '—',
      modalidadeNome: modalidades.find((m) => m.id === alunoModalidade.modalidadeId)?.nome ?? '—',
      statusFinanceiroMes: getStatusFinanceiroMatricula(alunoModalidade.id, MES_ATUAL, pagamentos),
      historicoPagamentos: pagamentos
        .filter((p) => p.alunoModalidadeId === alunoModalidade.id)
        .sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia)),
      turmas: turmas.filter((t) => alunoModalidade.turmaIds.includes(t.id)),
      graduacoes: graduacoesHistorico
        .filter((g) => g.alunoModalidadeId === alunoModalidade.id)
        .sort((a, b) => b.dataGraduacao.localeCompare(a.dataGraduacao)),
    }))

  return { aluno, matriculas }
}

export interface EstoqueItem {
  material: Material
  quantidadeAtual: number
  abaixoDoMinimo: boolean
  valorEmEstoque: number
}

export function computeEstoqueAtual(materiais: Material[], movimentosEstoque: MovimentoEstoque[]): EstoqueItem[] {
  return materiais.map((material) => {
    const quantidadeAtual = movimentosEstoque
      .filter((m) => m.materialId === material.id)
      .reduce((sum, m) => sum + (m.tipo === 'entrada' ? m.quantidade : -m.quantidade), 0)

    return {
      material,
      quantidadeAtual,
      abaixoDoMinimo: quantidadeAtual < material.estoqueMinimo,
      valorEmEstoque: quantidadeAtual * (material.precoUnitario ?? 0),
    }
  })
}

export interface EstoqueOverview {
  totalItensCadastrados: number
  itensAbaixoDoMinimo: number
  valorTotalEmEstoque: number
  movimentacoesNoMes: number
}

export function computeEstoqueOverview(estoque: EstoqueItem[], movimentosEstoque: MovimentoEstoque[]): EstoqueOverview {
  const ativos = estoque.filter((item) => item.material.status === 'ativo')

  return {
    totalItensCadastrados: ativos.length,
    itensAbaixoDoMinimo: ativos.filter((item) => item.abaixoDoMinimo).length,
    valorTotalEmEstoque: estoque.reduce((sum, item) => sum + item.valorEmEstoque, 0),
    movimentacoesNoMes: movimentosEstoque.filter((m) => m.data.slice(0, 7) === MES_ATUAL.slice(0, 7)).length,
  }
}
