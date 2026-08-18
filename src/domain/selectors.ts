import { MES_ATUAL, META_MENSAL_PREVISTA } from '../mocks/mockData'
import type { Aluno, GraduacaoHistorico, Material, Modalidade, MovimentoEstoque, Pagamento, Profile, Professor, Turma } from './types'

export type StatusFinanceiro = 'adimplente' | 'inadimplente' | 'sem_cobranca'

export function getStatusFinanceiroAluno(alunoId: string, mesReferencia: string, pagamentos: Pagamento[]): StatusFinanceiro {
  const pagamento = pagamentos.find((p) => p.alunoId === alunoId && p.mesReferencia === mesReferencia)
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
  pagamentos: Pagamento[]
}

export function computeAdminOverview({ profiles, professores, alunos, pagamentos }: OverviewInput): AdminOverview {
  const nomeDoProfile = (profileId: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const pagamentosDoMes = pagamentos.filter((p) => p.mesReferencia === MES_ATUAL)

  const receitaMensal = pagamentosDoMes
    .filter((p) => p.status === 'confirmado')
    .reduce((sum, p) => sum + p.valor, 0)

  const valorPendente = pagamentosDoMes
    .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + p.valor, 0)

  const rankingProfessores = professores
    .map((professor) => {
      const alunosDoProfessor = new Set(alunos.filter((a) => a.professorId === professor.profileId).map((a) => a.id))
      const valorArrecadado = pagamentosDoMes
        .filter((p) => p.status === 'confirmado' && alunosDoProfessor.has(p.alunoId))
        .reduce((sum, p) => sum + p.valor, 0)
      return { professorId: professor.profileId, nome: nomeDoProfile(professor.profileId), valorArrecadado }
    })
    .sort((a, b) => b.valorArrecadado - a.valorArrecadado)

  const feedPagamentosConfirmados = pagamentosDoMes
    .filter((p) => p.status === 'confirmado' && p.confirmadoEm)
    .sort((a, b) => (b.confirmadoEm ?? '').localeCompare(a.confirmadoEm ?? ''))
    .map((p) => ({
      pagamentoId: p.id,
      alunoNome: nomeDoProfile(alunos.find((a) => a.id === p.alunoId)?.profileId ?? ''),
      valor: p.valor,
      metodo: p.metodo,
      confirmadoEm: p.confirmadoEm,
    }))

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
  { profiles, professores, alunos, pagamentos }: OverviewInput
): RelatorioMensal {
  const nomeDoProfile = (profileId: string) => profiles.find((p) => p.id === profileId)?.fullName ?? '—'
  const pagamentosDoMes = pagamentos.filter((p) => p.mesReferencia === mesReferencia)

  const arrecadado = pagamentosDoMes.filter((p) => p.status === 'confirmado').reduce((sum, p) => sum + p.valor, 0)
  const pendente = pagamentosDoMes
    .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
    .reduce((sum, p) => sum + p.valor, 0)
  const previstoTotal = pagamentosDoMes.reduce((sum, p) => sum + p.valor, 0)

  const porProfessor = professores.map((professor) => {
    const alunosDoProfessor = new Set(alunos.filter((a) => a.professorId === professor.profileId).map((a) => a.id))
    const pagamentosDoProfessor = pagamentosDoMes.filter((p) => alunosDoProfessor.has(p.alunoId))
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

// Turmas não têm matrícula própria — a "grade" de um aluno/turma é a
// interseção professor+modalidade, igual à política de RLS da Fase 2
// (turmas_select_aluno).
export function getAlunosDaTurma(turma: Turma, alunos: Aluno[]): Aluno[] {
  return alunos.filter((a) => a.professorId === turma.professorId && a.modalidadeId === turma.modalidadeId && a.status === 'ativo')
}

export function getTurmasDoAluno(aluno: Aluno, turmas: Turma[]): Turma[] {
  return turmas.filter((t) => t.professorId === aluno.professorId && t.modalidadeId === aluno.modalidadeId)
}

export interface PainelProfessor {
  meusAlunos: number
  turmasAtivas: number
  arrecadadoMes: number
  pagamentosPendentes: number
}

export function computePainelProfessor(
  professorProfileId: string,
  { alunos, pagamentos, turmas }: { alunos: Aluno[]; pagamentos: Pagamento[]; turmas: Turma[] }
): PainelProfessor {
  const meusAlunosIds = new Set(alunos.filter((a) => a.professorId === professorProfileId).map((a) => a.id))
  const pagamentosDoMes = pagamentos.filter((p) => p.mesReferencia === MES_ATUAL && meusAlunosIds.has(p.alunoId))

  return {
    meusAlunos: alunos.filter((a) => a.professorId === professorProfileId && a.status === 'ativo').length,
    turmasAtivas: turmas.filter((t) => t.professorId === professorProfileId).length,
    arrecadadoMes: pagamentosDoMes.filter((p) => p.status === 'confirmado').reduce((sum, p) => sum + p.valor, 0),
    pagamentosPendentes: pagamentosDoMes.filter((p) => p.status === 'pendente' || p.status === 'atrasado').length,
  }
}

export interface PainelAluno {
  aluno: Aluno
  professorNome: string
  modalidadeNome: string
  statusFinanceiroMes: StatusFinanceiro
  historicoPagamentos: Pagamento[]
  turmasDaModalidade: Turma[]
  graduacoes: GraduacaoHistorico[]
}

export function computePainelAluno(
  alunoId: string,
  {
    alunos,
    profiles,
    modalidades,
    pagamentos,
    turmas,
    graduacoesHistorico,
  }: {
    alunos: Aluno[]
    profiles: Profile[]
    modalidades: Modalidade[]
    pagamentos: Pagamento[]
    turmas: Turma[]
    graduacoesHistorico: GraduacaoHistorico[]
  }
): PainelAluno | null {
  const aluno = alunos.find((a) => a.id === alunoId)
  if (!aluno) return null

  return {
    aluno,
    professorNome: profiles.find((p) => p.id === aluno.professorId)?.fullName ?? '—',
    modalidadeNome: modalidades.find((m) => m.id === aluno.modalidadeId)?.nome ?? '—',
    statusFinanceiroMes: getStatusFinanceiroAluno(aluno.id, MES_ATUAL, pagamentos),
    historicoPagamentos: pagamentos
      .filter((p) => p.alunoId === aluno.id)
      .sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia)),
    turmasDaModalidade: getTurmasDoAluno(aluno, turmas),
    graduacoes: graduacoesHistorico
      .filter((g) => g.alunoId === aluno.id)
      .sort((a, b) => b.dataGraduacao.localeCompare(a.dataGraduacao)),
  }
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
