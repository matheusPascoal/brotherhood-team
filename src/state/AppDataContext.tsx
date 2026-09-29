import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables, TablesUpdate } from '../lib/database.types'
import type {
  Aluno,
  AlunoModalidade,
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

// Ponto único de acesso aos dados da aplicação. Cada domínio lê/escreve
// direto no Supabase — os componentes de tela continuam chamando
// useAppData() sem saber os detalhes de tabela/coluna.

type ActionResult = { success: boolean; error?: string }

interface AppDataState {
  profiles: Profile[]
  professores: Professor[]
  alunos: Aluno[]
  alunoModalidades: AlunoModalidade[]
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

export interface AlunoModalidadeInput {
  // presente só ao editar uma matrícula que já existe
  id?: string
  professorId: string
  modalidadeId: string
  faixaAtual: string
  grauAtual: number
  mensalidadeValor: number
  diaVencimento: number
  turmaIds: string[]
}

export interface NovoAlunoInput {
  fullName: string
  email: string
  senha: string
  cpf: string
  modalidades: AlunoModalidadeInput[]
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
  dataLoading: boolean
  login: (email: string, password: string) => Promise<ActionResult>
  logout: () => Promise<void>
  changePassword: (novaSenha: string) => Promise<ActionResult>
  refetchData: () => Promise<void>
  confirmarPagamento: (pagamentoId: string, confirmadoPorId: string, metodo: MetodoPagamento) => Promise<ActionResult>
  definirPagamento: (
    alunoModalidadeId: string,
    mesReferencia: string,
    pago: boolean,
    confirmadoPorId: string,
    metodo?: MetodoPagamento
  ) => Promise<ActionResult>
  createProfessor: (input: NovoProfessorInput) => Promise<ActionResult>
  updateProfessor: (professorId: string, updates: Partial<NovoProfessorInput>) => Promise<ActionResult>
  setProfessorStatus: (professorId: string, status: AccountStatus) => Promise<ActionResult>
  deleteProfessor: (professorId: string) => Promise<ActionResult>
  createAluno: (input: NovoAlunoInput) => Promise<ActionResult>
  // escopoProfessorId: quando informado, só as matrículas desse professor
  // entram no diff de modalidades — evita que um professor, ao editar um
  // aluno que também faz outra modalidade com outro professor, apague ou
  // inative a matrícula que não é dele.
  updateAluno: (
    alunoId: string,
    updates: Partial<Omit<NovoAlunoInput, 'senha'>>,
    escopoProfessorId?: string
  ) => Promise<ActionResult>
  setAlunoStatus: (alunoId: string, status: AlunoStatus) => Promise<ActionResult>
  setAlunoModalidadeStatus: (alunoModalidadeId: string, status: AlunoStatus) => Promise<ActionResult>
  deleteAluno: (alunoId: string) => Promise<ActionResult>
  createModalidade: (input: NovoModalidadeInput) => Promise<ActionResult>
  updateModalidade: (modalidadeId: string, updates: Partial<NovoModalidadeInput>) => Promise<ActionResult>
  deleteModalidade: (modalidadeId: string) => Promise<ActionResult>
  createTurma: (input: NovaTurmaInput) => Promise<ActionResult>
  updateTurma: (turmaId: string, updates: Partial<NovaTurmaInput>) => Promise<ActionResult>
  deleteTurma: (turmaId: string) => Promise<ActionResult>
  salvarChamada: (turmaId: string, dataAula: string, registros: RegistroChamada[], observacaoAula: string) => Promise<ActionResult>
  createMaterial: (input: NovoMaterialInput) => Promise<ActionResult>
  updateMaterial: (materialId: string, updates: Partial<NovoMaterialInput>) => Promise<ActionResult>
  setMaterialStatus: (materialId: string, status: AccountStatus) => Promise<ActionResult>
  deleteMaterial: (materialId: string) => Promise<ActionResult>
  registrarMovimentoEstoque: (input: NovoMovimentoEstoqueInput, registradoPorId: string) => Promise<ActionResult>
}

function emptyState(): AppDataState {
  return {
    profiles: [],
    professores: [],
    alunos: [],
    alunoModalidades: [],
    turmas: [],
    pagamentos: [],
    presencas: [],
    modalidades: [],
    graduacoesHistorico: [],
    materiais: [],
    movimentosEstoque: [],
  }
}

// profiles é uma linha de auth.users (id = auth user id). phone/avatar_url
// vêm null do Postgres; o domínio usa `undefined` para campo opcional ausente.
function mapProfileRow(row: Tables<'profiles'>): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role,
    status: row.status,
  }
}

function mapModalidadeRow(row: Tables<'modalidades'>): Modalidade {
  return { id: row.id, nome: row.nome, faixasOrdem: (row.faixas_ordem as string[] | null) ?? [] }
}

interface ProfessorRowWithJunction extends Tables<'professores'> {
  professor_modalidades: { modalidade_id: string }[]
}

function mapProfessorRow(row: ProfessorRowWithJunction): Professor {
  return {
    id: row.id,
    profileId: row.profile_id,
    comissaoPercentual: Number(row.comissao_percentual),
    modalidadeIds: row.professor_modalidades.map((pm) => pm.modalidade_id),
    status: row.status,
  }
}

function mapAlunoRow(row: Tables<'alunos'>): Aluno {
  return {
    id: row.id,
    profileId: row.profile_id ?? undefined,
    cpf: row.cpf,
    status: row.status,
  }
}

interface AlunoModalidadeRowWithJunction extends Tables<'aluno_modalidades'> {
  aluno_turmas: { turma_id: string }[]
}

function mapAlunoModalidadeRow(row: AlunoModalidadeRowWithJunction): AlunoModalidade {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    professorId: row.professor_id,
    modalidadeId: row.modalidade_id,
    faixaAtual: row.faixa_atual,
    grauAtual: row.grau_atual,
    mensalidadeValor: Number(row.mensalidade_valor),
    diaVencimento: row.dia_vencimento,
    status: row.status,
    turmaIds: row.aluno_turmas.map((at) => at.turma_id),
  }
}

function mapTurmaRow(row: Tables<'turmas'>): Turma {
  return {
    id: row.id,
    professorId: row.professor_id,
    modalidadeId: row.modalidade_id,
    nome: row.nome,
    local: row.local ?? undefined,
    capacidadeMaxima: row.capacidade_maxima,
    horaInicio: row.hora_inicio.slice(0, 5),
    horaFim: row.hora_fim.slice(0, 5),
    diasSemana: row.dias_semana as DiaSemana[],
  }
}

function mapPagamentoRow(row: Tables<'pagamentos'>): Pagamento {
  return {
    id: row.id,
    alunoModalidadeId: row.aluno_modalidade_id,
    mesReferencia: row.mes_referencia,
    valor: Number(row.valor),
    status: row.status,
    metodo: row.metodo ?? undefined,
    confirmadoPor: row.confirmado_por ?? undefined,
    confirmadoEm: row.confirmado_em ?? undefined,
    observacao: row.observacao ?? undefined,
  }
}

function mapPresencaRow(row: Tables<'presencas'>): Presenca {
  return {
    id: row.id,
    turmaId: row.turma_id,
    alunoId: row.aluno_id,
    dataAula: row.data_aula,
    presente: row.presente,
    observacaoAula: row.observacao_aula ?? undefined,
  }
}

function mapGraduacaoRow(row: Tables<'graduacoes_historico'>): GraduacaoHistorico {
  return {
    id: row.id,
    alunoModalidadeId: row.aluno_modalidade_id,
    faixa: row.faixa,
    grau: row.grau,
    dataGraduacao: row.data_graduacao,
    registradoPor: row.registrado_por ?? undefined,
  }
}

function mapMaterialRow(row: Tables<'materiais'>): Material {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria ?? undefined,
    unidade: row.unidade,
    estoqueMinimo: row.estoque_minimo,
    precoUnitario: row.preco_unitario !== null ? Number(row.preco_unitario) : undefined,
    status: row.status,
  }
}

function mapMovimentoRow(row: Tables<'movimentos_estoque'>): MovimentoEstoque {
  return {
    id: row.id,
    materialId: row.material_id,
    tipo: row.tipo,
    quantidade: row.quantidade,
    data: row.data,
    motivo: row.motivo ?? undefined,
    observacao: row.observacao ?? undefined,
    registradoPor: row.registrado_por ?? undefined,
  }
}

async function fetchProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*')
  return (data ?? []).map(mapProfileRow)
}

async function fetchModalidades(): Promise<Modalidade[]> {
  const { data } = await supabase.from('modalidades').select('*').order('nome')
  return (data ?? []).map(mapModalidadeRow)
}

async function fetchProfessores(): Promise<Professor[]> {
  const { data } = await supabase.from('professores').select('*, professor_modalidades(modalidade_id)')
  return ((data ?? []) as unknown as ProfessorRowWithJunction[]).map(mapProfessorRow)
}

async function fetchAlunos(): Promise<Aluno[]> {
  const { data } = await supabase.from('alunos').select('*')
  return (data ?? []).map(mapAlunoRow)
}

async function fetchAlunoModalidades(): Promise<AlunoModalidade[]> {
  const { data } = await supabase.from('aluno_modalidades').select('*, aluno_turmas(turma_id)')
  return ((data ?? []) as unknown as AlunoModalidadeRowWithJunction[]).map(mapAlunoModalidadeRow)
}

async function fetchTurmas(): Promise<Turma[]> {
  const { data } = await supabase.from('turmas').select('*')
  return (data ?? []).map(mapTurmaRow)
}

async function fetchPagamentos(): Promise<Pagamento[]> {
  const { data } = await supabase.from('pagamentos').select('*')
  return (data ?? []).map(mapPagamentoRow)
}

async function fetchPresencas(): Promise<Presenca[]> {
  const { data } = await supabase.from('presencas').select('*')
  return (data ?? []).map(mapPresencaRow)
}

async function fetchGraduacoes(): Promise<GraduacaoHistorico[]> {
  const { data } = await supabase.from('graduacoes_historico').select('*')
  return (data ?? []).map(mapGraduacaoRow)
}

async function fetchMateriais(): Promise<Material[]> {
  const { data } = await supabase.from('materiais').select('*')
  return (data ?? []).map(mapMaterialRow)
}

async function fetchMovimentos(): Promise<MovimentoEstoque[]> {
  const { data } = await supabase.from('movimentos_estoque').select('*')
  return (data ?? []).map(mapMovimentoRow)
}

async function fetchAllTables(): Promise<AppDataState> {
  const [
    profiles,
    modalidades,
    professores,
    alunos,
    alunoModalidades,
    turmas,
    pagamentos,
    presencas,
    graduacoesHistorico,
    materiais,
    movimentosEstoque,
  ] = await Promise.all([
    fetchProfiles(),
    fetchModalidades(),
    fetchProfessores(),
    fetchAlunos(),
    fetchAlunoModalidades(),
    fetchTurmas(),
    fetchPagamentos(),
    fetchPresencas(),
    fetchGraduacoes(),
    fetchMateriais(),
    fetchMovimentos(),
  ])
  return {
    profiles,
    modalidades,
    professores,
    alunos,
    alunoModalidades,
    turmas,
    pagamentos,
    presencas,
    graduacoesHistorico,
    materiais,
    movimentosEstoque,
  }
}

function translateAuthError(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) return 'E-mail ou senha inválidos.'
  return message
}

// Fallback amigável quando uma checagem local não pegou a violação e o
// Postgres rejeitou por causa de um "on delete restrict".
function translateDbError(message: string): string {
  if (message.toLowerCase().includes('foreign key constraint')) {
    return 'Não é possível remover: existem registros vinculados a este item.'
  }
  if (message.toLowerCase().includes('aluno_modalidades_aluno_id_modalidade_id_key')) {
    return 'Este aluno já está matriculado nessa modalidade — edite o bloco existente em vez de adicionar outro.'
  }
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
// usuário, que passa a ser o profileId usado nos registros de professor/aluno.
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

// Insere uma ou mais matrículas (aluno_modalidades) para um aluno e, para
// cada uma, as turmas escolhidas (aluno_turmas). Usado tanto na criação do
// aluno quanto ao adicionar novas modalidades numa edição.
async function inserirModalidadesDoAluno(alunoId: string, modalidades: AlunoModalidadeInput[]): Promise<ActionResult> {
  for (const m of modalidades) {
    const { data: matricula, error } = await supabase
      .from('aluno_modalidades')
      .insert({
        aluno_id: alunoId,
        professor_id: m.professorId,
        modalidade_id: m.modalidadeId,
        faixa_atual: m.faixaAtual,
        grau_atual: m.grauAtual,
        mensalidade_valor: m.mensalidadeValor,
        dia_vencimento: m.diaVencimento,
      })
      .select()
      .single()
    if (error) return { success: false, error: translateDbError(error.message) }

    if (m.turmaIds.length > 0) {
      const { error: turmasError } = await supabase
        .from('aluno_turmas')
        .insert(m.turmaIds.map((turmaId) => ({ aluno_modalidade_id: matricula.id, turma_id: turmaId })))
      if (turmasError) return { success: false, error: turmasError.message }
    }
  }
  return { success: true }
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppDataState>(emptyState)
  const [currentAccount, setCurrentAccount] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)

  async function refetchTable<K extends keyof AppDataState>(key: K, fetcher: () => Promise<AppDataState[K]>) {
    const rows = await fetcher()
    setState((s) => ({ ...s, [key]: rows }))
  }

  async function refetchData() {
    setDataLoading(true)
    const next = await fetchAllTables()
    setState(next)
    setDataLoading(false)
  }

  // Bootstrap de sessão: ao carregar a página e a cada mudança de estado de
  // auth (login/logout/refresh de token em outra aba), busca o profile real
  // do usuário logado.
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

  // Carrega todos os domínios do Supabase assim que há uma conta logada;
  // limpa tudo de volta pra vazio no logout (evita vazar dado de uma conta
  // pra outra na mesma aba).
  useEffect(() => {
    let active = true
    if (currentAccount) {
      setDataLoading(true)
      fetchAllTables().then((next) => {
        if (!active) return
        setState(next)
        setDataLoading(false)
      })
    } else {
      setState(emptyState())
      setDataLoading(false)
    }
    return () => {
      active = false
    }
  }, [currentAccount?.id])

  const value: AppDataContextValue = {
    ...state,
    currentAccount,
    authLoading,
    dataLoading,

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

    refetchData,

    confirmarPagamento: async (pagamentoId, confirmadoPorId, metodo) => {
      const { error } = await supabase
        .from('pagamentos')
        .update({ status: 'confirmado', metodo, confirmado_por: confirmadoPorId, confirmado_em: new Date().toISOString() })
        .eq('id', pagamentoId)
      if (error) return { success: false, error: error.message }
      await refetchTable('pagamentos', fetchPagamentos)
      return { success: true }
    },

    // Turmas não têm cobrança pré-gerada por mês (não há job que crie a linha
    // de pagamentos). Marcar "pago" faz upsert no índice único
    // pagamentos(aluno_modalidade_id, mes_referencia) — cria a cobrança do mês
    // se ainda não existir. Marcar "não pago" só reverte uma cobrança existente.
    definirPagamento: async (alunoModalidadeId, mesReferencia, pago, confirmadoPorId, metodo) => {
      const alunoModalidade = state.alunoModalidades.find((am) => am.id === alunoModalidadeId)
      if (!alunoModalidade) return { success: false, error: 'Matrícula não encontrada.' }
      const existente = state.pagamentos.find(
        (p) => p.alunoModalidadeId === alunoModalidadeId && p.mesReferencia === mesReferencia
      )

      if (pago) {
        const { error } = await supabase.from('pagamentos').upsert(
          {
            aluno_modalidade_id: alunoModalidadeId,
            mes_referencia: mesReferencia,
            valor: existente?.valor ?? alunoModalidade.mensalidadeValor,
            status: 'confirmado',
            metodo: metodo ?? 'outro',
            confirmado_por: confirmadoPorId,
            confirmado_em: new Date().toISOString(),
          },
          { onConflict: 'aluno_modalidade_id,mes_referencia' }
        )
        if (error) return { success: false, error: error.message }
      } else if (existente) {
        const { error } = await supabase
          .from('pagamentos')
          .update({ status: 'pendente', metodo: null, confirmado_por: null, confirmado_em: null })
          .eq('id', existente.id)
        if (error) return { success: false, error: error.message }
      }

      await refetchTable('pagamentos', fetchPagamentos)
      return { success: true }
    },

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

      const { error: professorError } = await supabase
        .from('professores')
        .insert({ profile_id: profileId, comissao_percentual: input.comissaoPercentual })
      if (professorError) return { success: false, error: professorError.message }

      if (input.modalidadeIds.length > 0) {
        const { error: junctionError } = await supabase
          .from('professor_modalidades')
          .insert(input.modalidadeIds.map((modalidadeId) => ({ professor_id: profileId, modalidade_id: modalidadeId })))
        if (junctionError) return { success: false, error: junctionError.message }
      }

      await Promise.all([refetchTable('profiles', fetchProfiles), refetchTable('professores', fetchProfessores)])
      return { success: true }
    },

    updateProfessor: async (professorId, updates) => {
      const professor = state.professores.find((p) => p.id === professorId)
      if (!professor) return { success: false, error: 'Professor não encontrado.' }

      if (updates.comissaoPercentual !== undefined) {
        const { error } = await supabase
          .from('professores')
          .update({ comissao_percentual: updates.comissaoPercentual })
          .eq('id', professorId)
        if (error) return { success: false, error: error.message }
      }

      if (updates.modalidadeIds !== undefined) {
        await supabase.from('professor_modalidades').delete().eq('professor_id', professor.profileId)
        if (updates.modalidadeIds.length > 0) {
          const { error } = await supabase
            .from('professor_modalidades')
            .insert(updates.modalidadeIds.map((modalidadeId) => ({ professor_id: professor.profileId, modalidade_id: modalidadeId })))
          if (error) return { success: false, error: error.message }
        }
      }

      const profilePayload: TablesUpdate<'profiles'> = {}
      if (updates.fullName !== undefined) profilePayload.full_name = updates.fullName
      if (updates.email !== undefined) profilePayload.email = updates.email
      if (updates.phone !== undefined) profilePayload.phone = updates.phone
      if (Object.keys(profilePayload).length > 0) {
        const { error } = await supabase.from('profiles').update(profilePayload).eq('id', professor.profileId)
        if (error) return { success: false, error: error.message }
      }

      await Promise.all([refetchTable('profiles', fetchProfiles), refetchTable('professores', fetchProfessores)])
      return { success: true }
    },

    setProfessorStatus: async (professorId, status) => {
      const { error } = await supabase.from('professores').update({ status }).eq('id', professorId)
      if (error) return { success: false, error: error.message }
      await refetchTable('professores', fetchProfessores)
      return { success: true }
    },

    // Espelha as FKs "on delete restrict" de turmas.professor_id e
    // aluno_modalidades.professor_id (migrations 0008/0033): só remove se
    // nada apontar para este professor. Apaga o profile — professores.profile_id
    // tem "on delete cascade" (migration 0005), então a linha de professores
    // some junto.
    deleteProfessor: async (professorId) => {
      const professor = state.professores.find((p) => p.id === professorId)
      if (!professor) return { success: false, error: 'Professor não encontrado.' }
      if (state.turmas.some((t) => t.professorId === professor.profileId)) {
        return { success: false, error: 'Não é possível remover: há turmas vinculadas a este professor.' }
      }
      if (state.alunoModalidades.some((am) => am.professorId === professor.profileId)) {
        return { success: false, error: 'Não é possível remover: há alunos vinculados a este professor.' }
      }
      const { error } = await supabase.from('profiles').delete().eq('id', professor.profileId)
      if (error) return { success: false, error: translateDbError(error.message) }
      await Promise.all([refetchTable('profiles', fetchProfiles), refetchTable('professores', fetchProfessores)])
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

      // Sem .select() de propósito: o professor só passa a enxergar este
      // aluno (policy alunos_select_professor) depois que a matrícula for
      // criada logo abaixo — um INSERT ... RETURNING seria barrado pelo
      // Postgres (RLS exige que a linha devolvida passe pela policy de
      // SELECT mesmo já tendo passado no WITH CHECK do INSERT). Por isso o
      // id é gerado no cliente, não devolvido pelo banco.
      const alunoId = crypto.randomUUID()
      const { error: alunoError } = await supabase.from('alunos').insert({ id: alunoId, profile_id: profileId, cpf: input.cpf })
      if (alunoError) return { success: false, error: translateDbError(alunoError.message) }

      const modalidadeResult = await inserirModalidadesDoAluno(alunoId, input.modalidades)
      if (!modalidadeResult.success) return modalidadeResult

      await Promise.all([
        refetchTable('profiles', fetchProfiles),
        refetchTable('alunos', fetchAlunos),
        refetchTable('alunoModalidades', fetchAlunoModalidades),
      ])
      return { success: true }
    },

    updateAluno: async (alunoId, updates, escopoProfessorId) => {
      const aluno = state.alunos.find((a) => a.id === alunoId)
      if (!aluno) return { success: false, error: 'Aluno não encontrado.' }

      if (updates.cpf !== undefined) {
        const { error } = await supabase.from('alunos').update({ cpf: updates.cpf }).eq('id', alunoId)
        if (error) return { success: false, error: error.message }
      }

      if (aluno.profileId && (updates.fullName !== undefined || updates.email !== undefined)) {
        const profilePayload: TablesUpdate<'profiles'> = {}
        if (updates.fullName !== undefined) profilePayload.full_name = updates.fullName
        if (updates.email !== undefined) profilePayload.email = updates.email
        const { error } = await supabase.from('profiles').update(profilePayload).eq('id', aluno.profileId)
        if (error) return { success: false, error: error.message }
      }

      if (updates.modalidades !== undefined) {
        const atuais = state.alunoModalidades.filter(
          (am) => am.alunoId === alunoId && (!escopoProfessorId || am.professorId === escopoProfessorId)
        )
        const idsSubmetidos = new Set(updates.modalidades.filter((m) => m.id).map((m) => m.id))

        // Matrícula que saiu da lista: inativa em vez de apagar (pagamentos
        // referenciam a matrícula com "on delete restrict").
        const removidas = atuais.filter((am) => !idsSubmetidos.has(am.id))
        for (const am of removidas) {
          const { error } = await supabase.from('aluno_modalidades').update({ status: 'inativo' }).eq('id', am.id)
          if (error) return { success: false, error: error.message }
        }

        const novas = updates.modalidades.filter((m) => !m.id)
        const novasResult = await inserirModalidadesDoAluno(alunoId, novas)
        if (!novasResult.success) return novasResult

        const existentes = updates.modalidades.filter((m): m is AlunoModalidadeInput & { id: string } => !!m.id)
        for (const m of existentes) {
          const { error: updateError } = await supabase
            .from('aluno_modalidades')
            .update({
              professor_id: m.professorId,
              faixa_atual: m.faixaAtual,
              grau_atual: m.grauAtual,
              mensalidade_valor: m.mensalidadeValor,
              dia_vencimento: m.diaVencimento,
              status: 'ativo',
            })
            .eq('id', m.id)
          if (updateError) return { success: false, error: updateError.message }

          const atual = atuais.find((am) => am.id === m.id)
          const turmasAtuais = new Set(atual?.turmaIds ?? [])
          const turmasNovas = new Set(m.turmaIds)
          const paraRemover = [...turmasAtuais].filter((id) => !turmasNovas.has(id))
          const paraAdicionar = [...turmasNovas].filter((id) => !turmasAtuais.has(id))

          if (paraRemover.length > 0) {
            const { error: delError } = await supabase
              .from('aluno_turmas')
              .delete()
              .eq('aluno_modalidade_id', m.id)
              .in('turma_id', paraRemover)
            if (delError) return { success: false, error: delError.message }
          }
          if (paraAdicionar.length > 0) {
            const { error: insError } = await supabase
              .from('aluno_turmas')
              .insert(paraAdicionar.map((turmaId) => ({ aluno_modalidade_id: m.id!, turma_id: turmaId })))
            if (insError) return { success: false, error: insError.message }
          }
        }
      }

      await Promise.all([
        refetchTable('alunos', fetchAlunos),
        refetchTable('profiles', fetchProfiles),
        refetchTable('alunoModalidades', fetchAlunoModalidades),
      ])
      return { success: true }
    },

    setAlunoStatus: async (alunoId, status) => {
      const { error } = await supabase.from('alunos').update({ status }).eq('id', alunoId)
      if (error) return { success: false, error: error.message }
      await refetchTable('alunos', fetchAlunos)
      return { success: true }
    },

    setAlunoModalidadeStatus: async (alunoModalidadeId, status) => {
      const { error } = await supabase.from('aluno_modalidades').update({ status }).eq('id', alunoModalidadeId)
      if (error) return { success: false, error: error.message }
      await refetchTable('alunoModalidades', fetchAlunoModalidades)
      return { success: true }
    },

    // Espelha pagamentos.aluno_modalidade_id "on delete restrict" (migration
    // 0034): só remove se nenhuma das modalidades do aluno tiver pagamento
    // registrado. presencas/graduacoes_historico cascateiam no Postgres; o
    // profile (login próprio) é removido explicitamente, já que
    // alunos.profile_id é "on delete set null".
    deleteAluno: async (alunoId) => {
      const aluno = state.alunos.find((a) => a.id === alunoId)
      if (!aluno) return { success: false, error: 'Aluno não encontrado.' }
      const matriculasIds = new Set(state.alunoModalidades.filter((am) => am.alunoId === alunoId).map((am) => am.id))
      if (state.pagamentos.some((p) => matriculasIds.has(p.alunoModalidadeId))) {
        return { success: false, error: 'Não é possível remover: há pagamentos registrados para este aluno.' }
      }
      const { error } = await supabase.from('alunos').delete().eq('id', alunoId)
      if (error) return { success: false, error: translateDbError(error.message) }
      if (aluno.profileId) {
        await supabase.from('profiles').delete().eq('id', aluno.profileId)
      }
      await Promise.all([
        refetchTable('alunos', fetchAlunos),
        refetchTable('alunoModalidades', fetchAlunoModalidades),
        refetchTable('profiles', fetchProfiles),
        refetchTable('presencas', fetchPresencas),
        refetchTable('graduacoesHistorico', fetchGraduacoes),
      ])
      return { success: true }
    },

    createModalidade: async (input) => {
      const { error } = await supabase.from('modalidades').insert({ nome: input.nome, faixas_ordem: input.faixasOrdem })
      if (error) return { success: false, error: error.message }
      await refetchTable('modalidades', fetchModalidades)
      return { success: true }
    },

    updateModalidade: async (modalidadeId, updates) => {
      const payload: TablesUpdate<'modalidades'> = {}
      if (updates.nome !== undefined) payload.nome = updates.nome
      if (updates.faixasOrdem !== undefined) payload.faixas_ordem = updates.faixasOrdem
      const { error } = await supabase.from('modalidades').update(payload).eq('id', modalidadeId)
      if (error) return { success: false, error: error.message }
      await refetchTable('modalidades', fetchModalidades)
      return { success: true }
    },

    // Espelha professor_modalidades/aluno_modalidades/turmas.modalidade_id
    // "on delete restrict" (migrations 0006/0033/0008).
    deleteModalidade: async (modalidadeId) => {
      if (state.professores.some((p) => p.modalidadeIds.includes(modalidadeId))) {
        return { success: false, error: 'Não é possível remover: há professores vinculados a esta modalidade.' }
      }
      if (state.alunoModalidades.some((am) => am.modalidadeId === modalidadeId)) {
        return { success: false, error: 'Não é possível remover: há alunos vinculados a esta modalidade.' }
      }
      if (state.turmas.some((t) => t.modalidadeId === modalidadeId)) {
        return { success: false, error: 'Não é possível remover: há turmas vinculadas a esta modalidade.' }
      }
      const { error } = await supabase.from('modalidades').delete().eq('id', modalidadeId)
      if (error) return { success: false, error: translateDbError(error.message) }
      await refetchTable('modalidades', fetchModalidades)
      return { success: true }
    },

    createTurma: async (input) => {
      const { error } = await supabase.from('turmas').insert({
        professor_id: input.professorId,
        modalidade_id: input.modalidadeId,
        nome: input.nome,
        local: input.local,
        capacidade_maxima: input.capacidadeMaxima,
        hora_inicio: input.horaInicio,
        hora_fim: input.horaFim,
        dias_semana: input.diasSemana,
      })
      if (error) return { success: false, error: error.message }
      await refetchTable('turmas', fetchTurmas)
      return { success: true }
    },

    updateTurma: async (turmaId, updates) => {
      const payload: TablesUpdate<'turmas'> = {}
      if (updates.professorId !== undefined) payload.professor_id = updates.professorId
      if (updates.modalidadeId !== undefined) payload.modalidade_id = updates.modalidadeId
      if (updates.nome !== undefined) payload.nome = updates.nome
      if (updates.local !== undefined) payload.local = updates.local
      if (updates.capacidadeMaxima !== undefined) payload.capacidade_maxima = updates.capacidadeMaxima
      if (updates.horaInicio !== undefined) payload.hora_inicio = updates.horaInicio
      if (updates.horaFim !== undefined) payload.hora_fim = updates.horaFim
      if (updates.diasSemana !== undefined) payload.dias_semana = updates.diasSemana
      const { error } = await supabase.from('turmas').update(payload).eq('id', turmaId)
      if (error) return { success: false, error: error.message }
      await refetchTable('turmas', fetchTurmas)
      return { success: true }
    },

    // presencas.turma_id é "on delete cascade" (migration 0010) — o Postgres
    // já limpa as presenças da turma sozinho.
    deleteTurma: async (turmaId) => {
      const { error } = await supabase.from('turmas').delete().eq('id', turmaId)
      if (error) return { success: false, error: translateDbError(error.message) }
      await Promise.all([refetchTable('turmas', fetchTurmas), refetchTable('presencas', fetchPresencas)])
      return { success: true }
    },

    // Upsert real no índice único presencas(turma_id, aluno_id, data_aula)
    // que a migration 0010 já define.
    salvarChamada: async (turmaId, dataAula, registros, observacaoAula) => {
      const rows = registros.map((r) => ({
        turma_id: turmaId,
        aluno_id: r.alunoId,
        data_aula: dataAula,
        presente: r.presente,
        observacao_aula: observacaoAula || null,
      }))
      const { error } = await supabase.from('presencas').upsert(rows, { onConflict: 'turma_id,aluno_id,data_aula' })
      if (error) return { success: false, error: error.message }
      await refetchTable('presencas', fetchPresencas)
      return { success: true }
    },

    createMaterial: async (input) => {
      const { error } = await supabase.from('materiais').insert({
        nome: input.nome,
        categoria: input.categoria,
        unidade: input.unidade,
        estoque_minimo: input.estoqueMinimo,
        preco_unitario: input.precoUnitario,
      })
      if (error) return { success: false, error: error.message }
      await refetchTable('materiais', fetchMateriais)
      return { success: true }
    },

    updateMaterial: async (materialId, updates) => {
      const payload: TablesUpdate<'materiais'> = {}
      if (updates.nome !== undefined) payload.nome = updates.nome
      if (updates.categoria !== undefined) payload.categoria = updates.categoria
      if (updates.unidade !== undefined) payload.unidade = updates.unidade
      if (updates.estoqueMinimo !== undefined) payload.estoque_minimo = updates.estoqueMinimo
      if (updates.precoUnitario !== undefined) payload.preco_unitario = updates.precoUnitario
      const { error } = await supabase.from('materiais').update(payload).eq('id', materialId)
      if (error) return { success: false, error: error.message }
      await refetchTable('materiais', fetchMateriais)
      return { success: true }
    },

    setMaterialStatus: async (materialId, status) => {
      const { error } = await supabase.from('materiais').update({ status }).eq('id', materialId)
      if (error) return { success: false, error: error.message }
      await refetchTable('materiais', fetchMateriais)
      return { success: true }
    },

    // Espelha movimentos_estoque.material_id "on delete restrict" (migration
    // 0027): só remove se não houver movimentação registrada para o material.
    deleteMaterial: async (materialId) => {
      if (state.movimentosEstoque.some((m) => m.materialId === materialId)) {
        return { success: false, error: 'Não é possível remover: há movimentações de estoque registradas para este material.' }
      }
      const { error } = await supabase.from('materiais').delete().eq('id', materialId)
      if (error) return { success: false, error: translateDbError(error.message) }
      await refetchTable('materiais', fetchMateriais)
      return { success: true }
    },

    registrarMovimentoEstoque: async (input, registradoPorId) => {
      const { error } = await supabase.from('movimentos_estoque').insert({
        material_id: input.materialId,
        tipo: input.tipo,
        quantidade: input.quantidade,
        data: input.data,
        motivo: input.motivo,
        observacao: input.observacao,
        registrado_por: registradoPorId,
      })
      if (error) return { success: false, error: error.message }
      await refetchTable('movimentosEstoque', fetchMovimentos)
      return { success: true }
    },
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return ctx
}
