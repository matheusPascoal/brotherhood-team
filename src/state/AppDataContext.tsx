import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import * as seed from '../mocks/mockData'
import type {
  Aluno,
  AlunoStatus,
  AccountStatus,
  DiaSemana,
  GraduacaoHistorico,
  Material,
  MetodoPagamento,
  Modalidade,
  MovimentoEstoque,
  Pagamento,
  Presenca,
  Profile,
  Professor,
  TipoMovimentoEstoque,
  Turma,
} from '../domain/types'

// Ponto único de acesso aos dados da aplicação. Hoje lê/escreve em memória
// (mock); quando o Supabase estiver pronto, é este arquivo que troca de
// implementação — os componentes de tela continuam chamando useAppData()
// sem saber a diferença.

interface AppDataState {
  profiles: Profile[]
  professores: Professor[]
  alunos: Aluno[]
  turmas: Turma[]
  pagamentos: Pagamento[]
  presencas: Presenca[]
  modalidades: Modalidade[]
  graduacoesHistorico: GraduacaoHistorico[]
  materiais: Material[]
  movimentosEstoque: MovimentoEstoque[]
  currentAccountId: string | null
}

export interface NovoProfessorInput {
  fullName: string
  email: string
  phone?: string
  comissaoPercentual: number
  modalidadeIds: string[]
}

export interface NovaTurmaInput {
  professorId: string
  modalidadeId: string
  nome: string
  local?: string
  capacidadeMaxima: number
  horaInicio: string
  horaFim: string
  diasSemana: DiaSemana[]
}

export interface RegistroChamada {
  alunoId: string
  presente: boolean
}

export interface NovoAlunoInput {
  fullName: string
  email: string
  cpf: string
  professorId: string
  modalidadeId: string
  faixaAtual: string
  grauAtual: number
  mensalidadeValor: number
  diaVencimento: number
}

export interface NovoMaterialInput {
  nome: string
  categoria?: string
  unidade: string
  estoqueMinimo: number
  precoUnitario?: number
}

export interface NovoMovimentoEstoqueInput {
  materialId: string
  tipo: TipoMovimentoEstoque
  quantidade: number
  data: string
  motivo?: string
  observacao?: string
}

interface AppDataContextValue extends AppDataState {
  currentAccount: Profile | null
  switchAccount: (profileId: string) => void
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  resetData: () => void
  confirmarPagamento: (pagamentoId: string, confirmadoPorId: string, metodo: MetodoPagamento) => void
  createProfessor: (input: NovoProfessorInput) => void
  updateProfessor: (professorId: string, updates: Partial<NovoProfessorInput>) => void
  setProfessorStatus: (professorId: string, status: AccountStatus) => void
  createAluno: (input: NovoAlunoInput) => void
  updateAluno: (alunoId: string, updates: Partial<NovoAlunoInput>) => void
  setAlunoStatus: (alunoId: string, status: AlunoStatus) => void
  createTurma: (input: NovaTurmaInput) => void
  updateTurma: (turmaId: string, updates: Partial<NovaTurmaInput>) => void
  deleteTurma: (turmaId: string) => void
  salvarChamada: (turmaId: string, dataAula: string, registros: RegistroChamada[], observacaoAula: string) => void
  createMaterial: (input: NovoMaterialInput) => void
  updateMaterial: (materialId: string, updates: Partial<NovoMaterialInput>) => void
  setMaterialStatus: (materialId: string, status: AccountStatus) => void
  registrarMovimentoEstoque: (input: NovoMovimentoEstoqueInput, registradoPorId: string) => void
}

function buildInitialState(): AppDataState {
  return {
    profiles: structuredClone(seed.profiles),
    professores: structuredClone(seed.professores),
    alunos: structuredClone(seed.alunos),
    turmas: structuredClone(seed.turmas),
    pagamentos: structuredClone(seed.pagamentos),
    presencas: structuredClone(seed.presencas),
    modalidades: structuredClone(seed.modalidades),
    graduacoesHistorico: structuredClone(seed.graduacoesHistorico),
    materiais: structuredClone(seed.materiais),
    movimentosEstoque: structuredClone(seed.movimentosEstoque),
    currentAccountId: null,
  }
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppDataState>(buildInitialState)

  const currentAccount = useMemo(
    () => state.profiles.find((p) => p.id === state.currentAccountId) ?? null,
    [state.profiles, state.currentAccountId]
  )

  const value: AppDataContextValue = {
    ...state,
    currentAccount,

    switchAccount: (profileId) => setState((s) => ({ ...s, currentAccountId: profileId })),

    // Mock: valida só se o e-mail existe entre as contas de teste — a senha
    // não é checada. Quando o Supabase Auth estiver pronto (Fase 2), troca
    // por supabase.auth.signInWithPassword() sem os componentes saberem.
    login: (email, password) => {
      if (!password) return { success: false, error: 'Informe a senha.' }
      const profile = state.profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase())
      if (!profile) return { success: false, error: 'E-mail não encontrado entre as contas de teste.' }
      setState((s) => ({ ...s, currentAccountId: profile.id }))
      return { success: true }
    },

    logout: () => setState((s) => ({ ...s, currentAccountId: null })),

    resetData: () => setState((s) => ({ ...buildInitialState(), currentAccountId: s.currentAccountId })),

    confirmarPagamento: (pagamentoId, confirmadoPorId, metodo) =>
      setState((s) => ({
        ...s,
        pagamentos: s.pagamentos.map((p) =>
          p.id === pagamentoId
            ? { ...p, status: 'confirmado', metodo, confirmadoPor: confirmadoPorId, confirmadoEm: new Date().toISOString() }
            : p
        ),
      })),

    createProfessor: (input) =>
      setState((s) => {
        const profileId = crypto.randomUUID()
        const professorId = crypto.randomUUID()
        return {
          ...s,
          profiles: [
            ...s.profiles,
            { id: profileId, fullName: input.fullName, email: input.email, phone: input.phone, role: 'professor', status: 'ativo' },
          ],
          professores: [
            ...s.professores,
            { id: professorId, profileId, comissaoPercentual: input.comissaoPercentual, modalidadeIds: input.modalidadeIds, status: 'ativo' },
          ],
        }
      }),

    updateProfessor: (professorId, updates) =>
      setState((s) => ({
        ...s,
        professores: s.professores.map((p) =>
          p.id === professorId
            ? { ...p, ...(updates.comissaoPercentual !== undefined && { comissaoPercentual: updates.comissaoPercentual }), ...(updates.modalidadeIds && { modalidadeIds: updates.modalidadeIds }) }
            : p
        ),
        profiles: s.profiles.map((profile) => {
          const professor = s.professores.find((p) => p.id === professorId)
          if (!professor || profile.id !== professor.profileId) return profile
          return {
            ...profile,
            ...(updates.fullName !== undefined && { fullName: updates.fullName }),
            ...(updates.email !== undefined && { email: updates.email }),
            ...(updates.phone !== undefined && { phone: updates.phone }),
          }
        }),
      })),

    setProfessorStatus: (professorId, status) =>
      setState((s) => ({
        ...s,
        professores: s.professores.map((p) => (p.id === professorId ? { ...p, status } : p)),
      })),

    createAluno: (input) =>
      setState((s) => {
        const profileId = crypto.randomUUID()
        const alunoId = crypto.randomUUID()
        return {
          ...s,
          profiles: [...s.profiles, { id: profileId, fullName: input.fullName, email: input.email, role: 'aluno', status: 'ativo' }],
          alunos: [
            ...s.alunos,
            {
              id: alunoId,
              profileId,
              cpf: input.cpf,
              professorId: input.professorId,
              modalidadeId: input.modalidadeId,
              faixaAtual: input.faixaAtual,
              grauAtual: input.grauAtual,
              mensalidadeValor: input.mensalidadeValor,
              diaVencimento: input.diaVencimento,
              status: 'ativo',
            },
          ],
        }
      }),

    updateAluno: (alunoId, updates) =>
      setState((s) => ({
        ...s,
        alunos: s.alunos.map((a) => {
          if (a.id !== alunoId) return a
          const { fullName: _fullName, email: _email, ...alunoUpdates } = updates
          return { ...a, ...alunoUpdates }
        }),
        profiles: s.profiles.map((profile) => {
          const aluno = s.alunos.find((a) => a.id === alunoId)
          if (!aluno || profile.id !== aluno.profileId) return profile
          return {
            ...profile,
            ...(updates.fullName !== undefined && { fullName: updates.fullName }),
            ...(updates.email !== undefined && { email: updates.email }),
          }
        }),
      })),

    setAlunoStatus: (alunoId, status) =>
      setState((s) => ({
        ...s,
        alunos: s.alunos.map((a) => (a.id === alunoId ? { ...a, status } : a)),
      })),

    createTurma: (input) =>
      setState((s) => ({
        ...s,
        turmas: [...s.turmas, { id: crypto.randomUUID(), ...input }],
      })),

    updateTurma: (turmaId, updates) =>
      setState((s) => ({
        ...s,
        turmas: s.turmas.map((t) => (t.id === turmaId ? { ...t, ...updates } : t)),
      })),

    deleteTurma: (turmaId) =>
      setState((s) => ({
        ...s,
        turmas: s.turmas.filter((t) => t.id !== turmaId),
        presencas: s.presencas.filter((p) => p.turmaId !== turmaId),
      })),

    // Upsert: um registro por (turma, aluno, data) — espelha o índice único
    // presencas(turma_id, aluno_id, data_aula) da migration 0010.
    salvarChamada: (turmaId, dataAula, registros, observacaoAula) =>
      setState((s) => {
        const outros = s.presencas.filter((p) => !(p.turmaId === turmaId && p.dataAula === dataAula))
        const novos = registros.map((r) => {
          const existente = s.presencas.find(
            (p) => p.turmaId === turmaId && p.dataAula === dataAula && p.alunoId === r.alunoId
          )
          return {
            id: existente?.id ?? crypto.randomUUID(),
            turmaId,
            alunoId: r.alunoId,
            dataAula,
            presente: r.presente,
            observacaoAula,
          }
        })
        return { ...s, presencas: [...outros, ...novos] }
      }),

    createMaterial: (input) =>
      setState((s) => ({
        ...s,
        materiais: [...s.materiais, { id: crypto.randomUUID(), status: 'ativo', ...input }],
      })),

    updateMaterial: (materialId, updates) =>
      setState((s) => ({
        ...s,
        materiais: s.materiais.map((m) => (m.id === materialId ? { ...m, ...updates } : m)),
      })),

    setMaterialStatus: (materialId, status) =>
      setState((s) => ({
        ...s,
        materiais: s.materiais.map((m) => (m.id === materialId ? { ...m, status } : m)),
      })),

    registrarMovimentoEstoque: (input, registradoPorId) =>
      setState((s) => ({
        ...s,
        movimentosEstoque: [...s.movimentosEstoque, { id: crypto.randomUUID(), registradoPor: registradoPorId, ...input }],
      })),
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return ctx
}
