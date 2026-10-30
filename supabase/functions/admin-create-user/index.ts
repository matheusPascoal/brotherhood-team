// Edge Function: Admin autenticado pode criar professor ou aluno; Professor
// autenticado só pode criar aluno (para os próprios alunos). Cria um usuário
// real no Supabase Auth (com a senha definida por quem chama) e promove
// profiles.role, já que o trigger handle_new_user() (migration 0014) sempre
// cria o profile como 'aluno' por padrão. Usa a service_role key (injetada
// automaticamente no runtime da function) — ela nunca deve existir no frontend.
//
// A criação do professor/aluno em si (linha em professores/alunos + vínculos)
// também acontece aqui, com o service_role, em vez de voltar pro cliente
// fazer esses inserts com a chave anônima. Isso é proposital: se um desses
// inserts falhar depois que o auth.users já foi criado (ex: CPF duplicado),
// o rollback abaixo apaga o usuário recém-criado — sem isso, o e-mail fica
// preso num login órfão (sem linha em alunos/professores, logo invisível nas
// telas que listam por essas tabelas) e nem reaparece pra apagar manualmente.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// Mesma regra de src/domain/validation.ts — duplicada aqui de propósito: esta
// é a validação que realmente vale (a do cliente só evita uma ida ao
// servidor), então não pode depender de um import do frontend.
function validarSenha(senha: string): string | null {
  if (senha.length < 6 || senha.length > 8) return 'A senha precisa ter entre 6 e 8 caracteres.'
  if (!/[A-Z]/.test(senha)) return 'A senha precisa ter pelo menos 1 letra maiúscula.'
  if (!/[^A-Za-z0-9]/.test(senha)) return 'A senha precisa ter pelo menos 1 caractere especial.'
  return null
}

// Mesma lógica de translateDbError em AppDataContext.tsx — mantida em sincronia
// manualmente, já que a function roda isolada do bundle do frontend.
function translateDbError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('alunos_cpf_key')) return 'Já existe um aluno cadastrado com esse CPF.'
  if (m.includes('alunos_cpf_check')) return 'Informe um CPF válido com 11 números.'
  if (m.includes('aluno_modalidades_aluno_id_modalidade_id_key')) {
    return 'Este aluno já está matriculado nessa modalidade — edite o bloco existente em vez de adicionar outro.'
  }
  if (m.includes('aluno_turmas_aluno_modalidade_id_turma_id_key')) {
    return 'Esta turma já foi adicionada a essa matrícula.'
  }
  if (m.includes('dia_vencimento_check')) return 'O dia de vencimento precisa estar entre 1 e 31.'
  if (m.includes('grau_atual_check')) return 'O grau precisa estar entre 0 e 4.'
  if (m.includes('mensalidade_valor_check')) return 'O valor da mensalidade não pode ser negativo.'
  if (m.includes('foreign key constraint')) {
    return 'Não é possível salvar: há uma referência inválida nos dados enviados.'
  }
  return 'Não foi possível salvar o cadastro. Tente novamente em instantes.'
}

// Mensagens do GoTrue (auth.admin.createUser) vêm em inglês — traduz as mais
// comuns pra manter o app 100% em PT-BR.
function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('already been registered') || m.includes('already registered')) {
    return 'Já existe uma conta cadastrada com esse e-mail.'
  }
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Informe um e-mail válido.'
  return message
}

interface ModalidadeInput {
  professorId: string
  modalidadeId: string
  faixaAtual: string
  grauAtual: number
  mensalidadeValor: number
  diaVencimento: number
  turmaIds: string[]
}

interface RequestBody {
  email: string
  password: string
  fullName: string
  phone?: string
  role: 'professor' | 'aluno'
  // role === 'aluno'
  cpf?: string
  modalidades?: ModalidadeInput[]
  // role === 'professor'
  comissaoPercentual?: number
  modalidadeIds?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

  // Client com a sessão de quem chamou, só para descobrir quem é.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()
  if (!caller) return jsonResponse({ error: 'Não autenticado.' }, 401)

  // Client com service_role, para checar o role real (ignora RLS) e para
  // criar/promover o novo usuário.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  const callerRole = callerProfile?.role
  if (callerRole !== 'admin' && callerRole !== 'professor') {
    return jsonResponse({ error: 'Apenas administradores ou professores podem criar contas.' }, 403)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400)
  }

  const { email, password, fullName, phone, role, cpf, modalidades, comissaoPercentual, modalidadeIds } = body

  if (!email || !fullName) return jsonResponse({ error: 'E-mail e nome são obrigatórios.' }, 400)
  const erroSenha = password ? validarSenha(password) : 'A senha é obrigatória.'
  if (erroSenha) {
    return jsonResponse({ error: erroSenha }, 400)
  }
  if (role !== 'professor' && role !== 'aluno') {
    return jsonResponse({ error: 'Role inválido.' }, 400)
  }
  // Professor só pode criar aluno — quem cria professor é sempre o Admin.
  if (callerRole === 'professor' && role !== 'aluno') {
    return jsonResponse({ error: 'Professores só podem cadastrar alunos.' }, 403)
  }
  if (role === 'aluno') {
    if (!cpf || !/^\d{11}$/.test(cpf)) return jsonResponse({ error: 'Informe um CPF válido com 11 números.' }, 400)
    if (!modalidades || modalidades.length === 0) return jsonResponse({ error: 'Adicione ao menos uma modalidade.' }, 400)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created.user) {
    const message = createError ? translateAuthError(createError.message) : 'Não foi possível criar o usuário.'
    return jsonResponse({ error: message }, 409)
  }
  const profileId = created.user.id

  // A partir daqui o auth.users já existe — qualquer falha precisa desfazer
  // essa criação (catch abaixo), senão o e-mail fica preso num login órfão.
  try {
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role, ...(phone !== undefined && { phone }) })
      .eq('id', profileId)
    if (updateError) throw new Error(translateDbError(updateError.message))

    if (role === 'aluno') {
      const alunoId = crypto.randomUUID()
      const { error: alunoError } = await adminClient.from('alunos').insert({ id: alunoId, profile_id: profileId, cpf })
      if (alunoError) throw new Error(translateDbError(alunoError.message))

      for (const m of modalidades!) {
        const { data: matricula, error: matriculaError } = await adminClient
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
        if (matriculaError) throw new Error(translateDbError(matriculaError.message))

        if (m.turmaIds.length > 0) {
          const { error: turmasError } = await adminClient
            .from('aluno_turmas')
            .insert(m.turmaIds.map((turmaId) => ({ aluno_modalidade_id: matricula.id, turma_id: turmaId })))
          if (turmasError) throw new Error(translateDbError(turmasError.message))
        }
      }
    }

    if (role === 'professor') {
      const { error: professorError } = await adminClient
        .from('professores')
        .insert({ profile_id: profileId, comissao_percentual: comissaoPercentual ?? 50 })
      if (professorError) throw new Error(translateDbError(professorError.message))

      if (modalidadeIds && modalidadeIds.length > 0) {
        const { error: junctionError } = await adminClient
          .from('professor_modalidades')
          .insert(modalidadeIds.map((modalidadeId) => ({ professor_id: profileId, modalidade_id: modalidadeId })))
        if (junctionError) throw new Error(translateDbError(junctionError.message))
      }
    }
  } catch (err) {
    // alunos.profile_id é "on delete set null" (não cascade — um aluno pode
    // existir sem login próprio), então só apagar o auth user não basta: a
    // linha de alunos sobreviveria órfã (profile_id = null), travando o CPF
    // pra sempre numa conta que nunca existiu de verdade. Apaga a linha de
    // alunos primeiro (cascateia pra aluno_modalidades/aluno_turmas) — sem
    // efeito se a falha foi antes desse insert.
    if (role === 'aluno') {
      await adminClient.from('alunos').delete().eq('profile_id', profileId)
    }
    await adminClient.auth.admin.deleteUser(profileId)
    const message = err instanceof Error ? err.message : 'Não foi possível salvar o cadastro.'
    return jsonResponse({ error: message }, 500)
  }

  return jsonResponse({ id: profileId }, 200)
})
