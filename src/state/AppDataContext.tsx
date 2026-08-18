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
  senha: string
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
  senha: string
  cpf: string
  professorId: string
  modalidadeId: string
  faixaAtual: string
  grauAtual: number
  mensalidadeValor: number
  diaVencimento: number
}

export interface NovoModalidadeInput {
  nome: string
  faixasOrdem: string[]
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
  changePassword: (novaSenha: string) => Promise<{ success: boolean; error?: string }>
  resetData: () => void
  confirmarPagamento: (pagamentoId: string, confirmadoPorId: string, metodo: MetodoPagamento) => void
  createProfessor: (input: NovoProfessorInput) => Promise<{ success: boolean; error?: string }>
  updateProfessor: (professorId: string, updates: Partial<NovoProfessorInput>) => void
  setProfessorStatus: (professorId: string, status: AccountStatus) => void
  deleteProfessor: (professorId: string) => { success: boolean; error?: string }
  createAluno: (input: NovoAlunoInput) => Promise<{ success: boolean; error?: string }>
  updateAluno: (alunoId: string, updates: Partial<NovoAlunoInput>) => void
  setAlunoStatus: (alunoId: string, status: AlunoStatus) => void
  deleteAluno: (alunoId: string) => { success: boolean; error?: string }
  createModalidade: (input: NovoModalidadeInput) => void
  updateModalidade: (modalidadeId: string, updates: Partial<NovoModalidadeInput>) => void
  deleteModalidade: (modalidadeId: string) => { success: boolean; error?: string }
  createTurma: (input: NovaTurmaInput) => void
  updateTurma: (turmaId: string, updates: Partial<NovaTurmaInput>) => void
  deleteTurma: (turmaId: string) => void
  salvarChamada: (turmaId: string, dataAula: string, registros: RegistroChamada[], observacaoAula: string) => void
  createMaterial: (input: NovoMaterialInput) => void
  updateMaterial: (materialId: string, updates: Partial<NovoMaterialInput>) => void
  setMaterialStatus: (materialId: string, status: AccountStatus) => void
  deleteMaterial: (materialId: string) => { success: boolean; error?: string }
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

interface AdminCreateUserInput {
  email: string
  password: string
  fullName: string
  phone?: string
  role: 'professor' | 'aluno'
}

// Chama a Edge Function admin-create-user (service_role fica só no servidor
// da function — nunca no frontend). Ela cria o auth.users real com a senha
// definida pelo Admin e promove profiles.role, e retorna o id real do
// usuário, que passa a ser o profileId usado nos registros mock.
async function invokeAdminCreateUser(input: AdminCreateUserInput): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke<{ id?: string; error?: string }>('admin-create-user', {
    body: input,
  })
  if (error) {
    const context = (error as { context?: Response }).context
    if (context) {
      try {
        const body = await context.json()
        if (body?.error) return { error: body.error }
      } catch {
        // resposta sem corpo JSON — cai para a mensagem genérica abaixo
      }
    }
    return { error: error.message }
  }
  if (data?.error) return { error: data.error }
  return { id: data?.id }
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

    changePassword: async (novaSenha) => {
      if (novaSenha.length < 6) return { success: false, error: 'A senha precisa ter pelo menos 6 caracteres.' }
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) return { success: false, error: translateAuthError(error.message) }
      return { success: true }
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

    createProfessor: async (input) => {
      const result = await invokeAdminCreateUser({
        email: input.email,
        password: input.senha,
        fullName: input.fullName,
        phone: input.phone,
        role: 'professor',
      })
      if (!result.id) return { success: false, error: result.error ?? 'Não foi possível criar o professor.' }
      const profileId = result.id
      setState((s) => ({
        ...s,
        profiles: [
          ...s.profiles,
          { id: profileId, fullName: input.fullName, email: input.email, phone: input.phone, role: 'professor', status: 'ativo' },
        ],
        professores: [
          ...s.professores,
          { id: crypto.randomUUID(), profileId, comissaoPercentual: input.comissaoPercentual, modalidadeIds: input.modalidadeIds, status: 'ativo' },
        ],
      }))
      return { success: true }
    },

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

    // Espelha as FKs "on delete restrict" de turmas.professor_id e
    // alunos.professor_id (migrations 0007/0008): só remove se nada apontar
    // para este professor. Remove também o profile — conta de acesso some.
    deleteProfessor: (professorId) => {
      const professor = state.professores.find((p) => p.id === professorId)
      if (!professor) return { success: false, error: 'Professor não encontrado.' }
      if (state.turmas.some((t) => t.professorId === professor.profileId)) {
        return { success: false, error: 'Não é possível remover: há turmas vinculadas a este professor.' }
      }
      if (state.alunos.some((a) => a.professorId === professor.profileId)) {
        return { success: false, error: 'Não é possível remover: há alunos vinculados a este professor.' }
      }
      setState((s) => ({
        ...s,
        professores: s.professores.filter((p) => p.id !== professorId),
        profiles: s.profiles.filter((p) => p.id !== professor.profileId),
      }))
      return { success: true }
    },

    createAluno: async (input) => {
      const result = await invokeAdminCreateUser({
        email: input.email,
        password: input.senha,
        fullName: input.fullName,
        role: 'aluno',
      })
      if (!result.id) return { success: false, error: result.error ?? 'Não foi possível criar o aluno.' }
      const profileId = result.id
      setState((s) => ({
        ...s,
        profiles: [...s.profiles, { id: profileId, fullName: input.fullName, email: input.email, role: 'aluno', status: 'ativo' }],
        alunos: [
          ...s.alunos,
          {
            id: crypto.randomUUID(),
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
      }))
      return { success: true }
    },

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

    // Espelha pagamentos.aluno_id "on delete restrict" (migration 0009): só
    // remove se não houver pagamento registrado. presencas/graduacoes_historico
    // cascateiam (migrations 0010/0011), assim como o profile (login próprio).
    deleteAluno: (alunoId) => {
      const aluno = state.alunos.find((a) => a.id === alunoId)
      if (!aluno) return { success: false, error: 'Aluno não encontrado.' }
      if (state.pagamentos.some((p) => p.alunoId === alunoId)) {
        return { success: false, error: 'Não é possível remover: há pagamentos registrados para este aluno.' }
      }
      setState((s) => ({
        ...s,
        alunos: s.alunos.filter((a) => a.id !== alunoId),
        presencas: s.presencas.filter((p) => p.alunoId !== alunoId),
        graduacoesHistorico: s.graduacoesHistorico.filter((g) => g.alunoId !== alunoId),
        profiles: aluno.profileId ? s.profiles.filter((p) => p.id !== aluno.profileId) : s.profiles,
      }))
      return { success: true }
    },

    createModalidade: (input) =>
      setState((s) => ({
        ...s,
        modalidades: [...s.modalidades, { id: crypto.randomUUID(), ...input }],
      })),

    updateModalidade: (modalidadeId, updates) =>
      setState((s) => ({
        ...s,
        modalidades: s.modalidades.map((m) => (m.id === modalidadeId ? { ...m, ...updates } : m)),
      })),

    // Espelha professor_modalidades/alunos/turmas.modalidade_id "on delete
    // restrict" (migrations 0006/0007/0008).
    deleteModalidade: (modalidadeId) => {
      if (state.professores.some((p) => p.modalidadeIds.includes(modalidadeId))) {
        return { success: false, error: 'Não é possível remover: há professores vinculados a esta modalidade.' }
      }
      if (state.alunos.some((a) => a.modalidadeId === modalidadeId)) {
        return { success: false, error: 'Não é possível remover: há alunos vinculados a esta modalidade.' }
      }
      if (state.turmas.some((t) => t.modalidadeId === modalidadeId)) {
        return { success: false, error: 'Não é possível remover: há turmas vinculadas a esta modalidade.' }
      }
      setState((s) => ({ ...s, modalidades: s.modalidades.filter((m) => m.id !== modalidadeId) }))
      return { success: true }
    },

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

    // Espelha movimentos_estoque.material_id "on delete restrict" (migration
    // 0027): só remove se não houver movimentação registrada para o material.
    deleteMaterial: (materialId) => {
      if (state.movimentosEstoque.some((m) => m.materialId === materialId)) {
        return { success: false, error: 'Não é possível remover: há movimentações de estoque registradas para este material.' }
      }
      setState((s) => ({ ...s, materiais: s.materiais.filter((m) => m.id !== materialId) }))
      return { success: true }
    },

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
