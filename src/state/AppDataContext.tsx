import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as seed from '../mocks/mockData'
import { supabase } from '../lib/supabase'
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
  authLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
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
  }
}

// profiles é uma linha de auth.users (id = auth user id). phone/avatar_url
// vêm null do Postgres; o domínio usa `undefined` para campo opcional ausente.
function mapProfileRow(row: {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: Profile['role']
  status: Profile['status']
}): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    status: row.status,
  }
}

function translateAuthError(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) return 'E-mail ou senha inválidos.'
  return message
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppDataState>(buildInitialState)
  const [currentAccount, setCurrentAccount] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Bootstrap de sessão: ao carregar a página e a cada mudança de estado de
  // auth (login/logout/refresh de token em outra aba), busca o profile real
  // do usuário logado. As demais listas (professores, alunos, ...) ainda são
  // mock — só a identidade da conta logada já vem do Supabase.
  useEffect(() => {
    let active = true

    async function loadProfile(userId: string) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (!active) return
      setCurrentAccount(error || !data ? null : mapProfileRow(data))
      setAuthLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session?.user) loadProfile(session.user.id)
      else setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthLoading(true)
        loadProfile(session.user.id)
      } else {
        setCurrentAccount(null)
        setAuthLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value: AppDataContextValue = {
    ...state,
    currentAccount,
    authLoading,

    login: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return { success: false, error: translateAuthError(error.message) }
      return { success: true }
    },

    logout: async () => {
      await supabase.auth.signOut()
    },

    resetData: () => setState(buildInitialState()),

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
