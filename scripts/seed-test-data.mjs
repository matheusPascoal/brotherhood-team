// Cria as contas de teste (1 admin, 3 professores, 5 alunos) espelhando os
// dados de exemplo do protótipo (seção 1.1 do plano). Usa a service_role key
// só nesta ação local de seed — nunca no frontend.
//
// Uso: node --env-file=.env.seed.local scripts/seed-test-data.mjs
// Pré-requisito: já ter rodado as migrations 0001-0024 e o seed.sql
// (modalidades) no seu projeto Supabase.

import { createClient } from '@supabase/supabase-js'

const SEED_PASSWORD = 'Teste@2026!' // apenas para as contas de teste

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ver .env.seed.example)')
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function createAuthUser(fullName, email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw new Error(`Falha ao criar usuário ${email}: ${error.message}`)
  return data.user.id
}

async function setProfileRole(profileId, role) {
  const { error } = await admin.from('profiles').update({ role }).eq('id', profileId)
  if (error) throw new Error(`Falha ao promover profile ${profileId} para ${role}: ${error.message}`)
}

async function getModalidadeId(nome) {
  const { data, error } = await admin.from('modalidades').select('id').eq('nome', nome).single()
  if (error) throw new Error(`Modalidade "${nome}" não encontrada — rode supabase/seed.sql antes: ${error.message}`)
  return data.id
}

async function main() {
  console.log('Criando conta admin...')
  const adminId = await createAuthUser('Carlos Eduardo', 'carlos.eduardo@brotherhoodteam.test')
  await setProfileRole(adminId, 'admin')

  const modalidadeBjjId = await getModalidadeId('Jiu-Jitsu (BJJ)')
  const modalidadeMuayThaiId = await getModalidadeId('Muay Thai')
  const modalidadeJudoId = await getModalidadeId('Judô')

  const professoresSeed = [
    { nome: 'Mestre Marcos Silva', email: 'marcos.silva@brotherhoodteam.test', comissao: 60, modalidadeId: modalidadeBjjId },
    { nome: 'Sensei Rafael Oliveira', email: 'rafael.oliveira@brotherhoodteam.test', comissao: 55, modalidadeId: modalidadeMuayThaiId },
    { nome: 'Profª Juliana Santos', email: 'juliana.santos@brotherhoodteam.test', comissao: 50, modalidadeId: modalidadeJudoId },
  ]

  const professorProfileIdByNome = {}

  for (const p of professoresSeed) {
    console.log(`Criando professor ${p.nome}...`)
    const profileId = await createAuthUser(p.nome, p.email)
    await setProfileRole(profileId, 'professor')

    const { error: insertError } = await admin
      .from('professores')
      .insert({ profile_id: profileId, comissao_percentual: p.comissao, status: 'ativo' })
    if (insertError) throw new Error(`Falha ao criar professores para ${p.nome}: ${insertError.message}`)

    const { error: linkError } = await admin
      .from('professor_modalidades')
      .insert({ professor_id: profileId, modalidade_id: p.modalidadeId })
    if (linkError) throw new Error(`Falha ao vincular modalidade para ${p.nome}: ${linkError.message}`)

    professorProfileIdByNome[p.nome] = profileId
  }

  const alunosSeed = [
    { nome: 'Lucas Santos', email: 'lucas.santos@brotherhoodteam.test', cpf: '11122233344', professor: 'Mestre Marcos Silva', modalidadeId: modalidadeBjjId, faixa: 'Azul', grau: 2, mensalidade: 150, vencimento: 5 },
    { nome: 'Beatriz Souza', email: 'beatriz.souza@brotherhoodteam.test', cpf: '22233344455', professor: 'Mestre Marcos Silva', modalidadeId: modalidadeBjjId, faixa: 'Branca', grau: 1, mensalidade: 150, vencimento: 10 },
    { nome: 'Pedro Almeida', email: 'pedro.almeida@brotherhoodteam.test', cpf: '33344455566', professor: 'Sensei Rafael Oliveira', modalidadeId: modalidadeMuayThaiId, faixa: 'Amarela', grau: 0, mensalidade: 130, vencimento: 15 },
    { nome: 'Camila Ferreira', email: 'camila.ferreira@brotherhoodteam.test', cpf: '44455566677', professor: 'Sensei Rafael Oliveira', modalidadeId: modalidadeMuayThaiId, faixa: 'Verde', grau: 1, mensalidade: 130, vencimento: 20 },
    { nome: 'Gabriel Costa', email: 'gabriel.costa@brotherhoodteam.test', cpf: '55566677788', professor: 'Profª Juliana Santos', modalidadeId: modalidadeJudoId, faixa: 'Azul', grau: 0, mensalidade: 140, vencimento: 25 },
  ]

  for (const a of alunosSeed) {
    console.log(`Criando aluno ${a.nome}...`)
    const profileId = await createAuthUser(a.nome, a.email)
    // role já nasce 'aluno' pelo trigger — não precisa promover.

    const { error } = await admin.from('alunos').insert({
      profile_id: profileId,
      cpf: a.cpf,
      professor_id: professorProfileIdByNome[a.professor],
      modalidade_id: a.modalidadeId,
      faixa_atual: a.faixa,
      grau_atual: a.grau,
      mensalidade_valor: a.mensalidade,
      dia_vencimento: a.vencimento,
      status: 'ativo',
    })
    if (error) throw new Error(`Falha ao criar aluno ${a.nome}: ${error.message}`)
  }

  console.log('\nSeed concluído. Senha de todas as contas de teste:', SEED_PASSWORD)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
