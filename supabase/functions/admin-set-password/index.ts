// Edge Function: Admin autenticado redefine a senha de um professor ou aluno
// já existente. Usa auth.admin.updateUserById, que só existe com
// service_role — por isso não dá pra fazer isso direto do frontend, mesmo
// sendo o próprio admin: a service_role key nunca deve existir no cliente.
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
  userId: string
  newPassword: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()
  if (!caller) return jsonResponse({ error: 'Não autenticado.' }, 401)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single()

  if (callerProfile?.role !== 'admin') {
    return jsonResponse({ error: 'Apenas administradores podem redefinir a senha de outra conta.' }, 403)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400)
  }

  const { userId, newPassword } = body
  if (!userId) return jsonResponse({ error: 'userId é obrigatório.' }, 400)
  if (!newPassword || newPassword.length < 6) {
    return jsonResponse({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, 400)
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500)
  }

  return jsonResponse({ success: true }, 200)
})
