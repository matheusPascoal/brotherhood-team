// Edge Function: Admin autenticado pode criar professor ou aluno; Professor
// autenticado só pode criar aluno (para os próprios alunos). Cria um usuário
// real no Supabase Auth (com a senha definida por quem chama) e promove
// profiles.role, já que o trigger handle_new_user() (migration 0014) sempre
// cria o profile como 'aluno' por padrão. Usa a service_role key (injetada
// automaticamente no runtime da function) — ela nunca deve existir no frontend.
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

interface RequestBody {
  email: string
  password: string
  fullName: string
  phone?: string
  role: 'professor' | 'aluno'
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

  const { email, password, fullName, phone, role } = body

  if (!email || !fullName) return jsonResponse({ error: 'E-mail e nome são obrigatórios.' }, 400)
  if (!password || password.length < 6) {
    return jsonResponse({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, 400)
  }
  if (role !== 'professor' && role !== 'aluno') {
    return jsonResponse({ error: 'Role inválido.' }, 400)
  }
  // Professor só pode criar aluno — quem cria professor é sempre o Admin.
  if (callerRole === 'professor' && role !== 'aluno') {
    return jsonResponse({ error: 'Professores só podem cadastrar alunos.' }, 403)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created.user) {
    return jsonResponse({ error: createError?.message ?? 'Não foi possível criar o usuário.' }, 409)
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role, ...(phone !== undefined && { phone }) })
    .eq('id', created.user.id)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500)
  }

  return jsonResponse({ id: created.user.id }, 200)
})
