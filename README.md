# Brotherhood Team

Sistema de gestão para academia de artes marciais: alunos, professores,
modalidades, turmas, mensalidades, presença e estoque. SPA em React que fala
direto com o Supabase (Postgres + Auth), sem backend próprio além de duas
Edge Functions para as duas únicas operações que exigem privilégio de
servidor (criar conta e redefinir senha de outra pessoa).

- **Produção:** https://brotherhood-team-5glq.vercel.app
- **Repositório:** https://github.com/matheusPascoal/brotherhood-team
- **Banco:** Supabase, projeto `brotherhood-team` (`vnevkitftaowxacrxric`)

## Stack

- React 19 + TypeScript, Vite 8 (bundler Rolldown)
- Supabase JS v2 (Postgres + Auth + Edge Functions)
- `oxlint` para lint, `xlsx` (SheetJS) para exportação de relatórios
- Sem framework de rotas, sem Redux/Zustand — um Context único cobre tudo (ver abaixo)

## Arquitetura: por que não tem "backend"

Não existe uma API própria. A autorização inteira é feita por **Row Level
Security (RLS)** no Postgres — cada tabela tem políticas que decidem o que
cada `role` (`admin`/`professor`/`aluno`) pode ler e escrever, usando
`auth.uid()` do token do Supabase Auth. O frontend nunca decide quem pode ver
o quê; ele só pergunta ao banco, e o banco responde só com o que aquele
usuário tem direito de ver.

As duas únicas coisas que não dá pra fazer com a chave pública do cliente
(`anon key`) são **criar um usuário com senha definida por outra pessoa** e
**redefinir a senha de outra conta** — isso exige a `service_role key`, que
nunca pode existir no frontend. Por isso existem duas Edge Functions
(`supabase/functions/`), rodando no servidor do Supabase:

- `admin-create-user` — admin cria professor ou aluno; professor só cria
  aluno (para os próprios alunos). Confere o `role` de quem chamou antes de
  fazer qualquer coisa.
- `admin-set-password` — só admin, redefine a senha de qualquer conta.

Qualquer outra operação (CRUD de turma, matrícula, pagamento, presença,
estoque) vai direto do React pro Postgres via `supabase-js`, protegida só
pelas policies de RLS.

## Os três papéis

| Papel | O que vê e faz |
|---|---|
| **admin** | Tudo. Visão geral, CRUD de professores/alunos/modalidades/materiais, confirma pagamento de qualquer aluno, gera relatório mensal, controla estoque. |
| **professor** | Só os próprios alunos e turmas (`professor_id = auth.uid()` em quase toda policy). Cadastra aluno, dá baixa em presença, confirma pagamento das próprias matrículas. |
| **aluno** | Só os próprios dados (`profile_id = auth.uid()`), somente leitura — painel com modalidades, mensalidades e histórico de pagamento. |

Login é feito pelo painel do admin ou por outro professor criando a conta —
não existe cadastro público/self-signup.

## Estrutura de pastas

```
src/
  state/AppDataContext.tsx   — o coração do app, ver seção abaixo
  domain/
    types.ts                 — os tipos de domínio (Aluno, Turma, Pagamento…)
    selectors.ts              — funções puras que derivam dado (ex.: status financeiro do mês, estoque atual)
    format.ts                 — formatação (moeda, data, CPF)
    validation.ts             — regra de senha (única fonte, espelhada nas Edge Functions)
  features/
    admin/                    — 7 telas, uma por aba do admin
    professor/                — 5 telas
    aluno/                    — 1 tela (painel, só leitura)
    auth/LoginPage.tsx
    shared/AlunoModalidadesForm.tsx — formulário de matrícula, usado tanto pelo admin quanto pelo professor
  components/                 — Badge, Pagination, AppLayout (casca com header/abas/rodapé), ChangePasswordModal
  lib/
    supabase.ts                — cria o client (lê VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
    database.types.ts          — tipos gerados a partir do schema do Postgres
  mocks/mockData.ts            — nome é herança do protótipo inicial; hoje só tem MES_ATUAL/MES_ANTERIOR/META_MENSAL_PREVISTA (não é mock de dado, é constante de verdade)
supabase/
  migrations/                  — 0001 a 0040+, schema completo e histórico de toda mudança de RLS
  functions/                   — as duas Edge Functions
  seed.sql                     — dados iniciais (modalidades)
scripts/seed-test-data.mjs     — cria contas de teste localmente (precisa de .env.seed.local com a service_role key — nunca comitar isso)
```

## `AppDataContext` — o coração do app

Todo o estado da aplicação (perfis, alunos, professores, matrículas, turmas,
pagamentos, presenças, modalidades, materiais, movimentos de estoque) mora
num único Context (`src/state/AppDataContext.tsx`), criado em `App.tsx` e
consumido via `useAppData()`. Nenhuma tela importa o client do Supabase
diretamente — todo mundo passa por esse Context.

Ele expõe duas coisas:

1. **O estado já carregado** (`profiles`, `alunos`, `turmas`, `pagamentos`...)
   — buscado inteiro assim que alguém loga (`fetchAllTables`), sem paginação
   no banco (quem pagina é a UI, com o componente `Pagination`).
2. **As ações** — uma função por operação de escrita (`createAluno`,
   `updateTurma`, `confirmarPagamento`, `salvarChamada`,
   `registrarMovimentoEstoque`, etc.), todas retornando
   `{ success, error? }`. Depois de uma escrita bem-sucedida, a própria ação
   dá um `refetch` só da tabela afetada — não recarrega tudo.

Se for adicionar uma tabela/feature nova: o padrão é sempre
fetch-no-login → estado no Context → ação que escreve e já refaz o fetch
daquela tabela → tela consome via `useAppData()`.

## Modelo de dados (visão rápida)

```
profiles (1:1 com auth.users) ──┬── professores (1:1, profile_id)
                                 └── alunos (0:1, profile_id nullable —
                                             um aluno pode existir sem login)

alunos ──< aluno_modalidades >── modalidades
            │        └── professor_id (quem leciona aquela modalidade pro aluno)
            ├──< aluno_turmas >── turmas (professor_id, modalidade_id)
            ├──< pagamentos (1 por mês de referência)
            └──< graduacoes_historico
```

O ponto mais importante do modelo: **um aluno pode fazer várias modalidades,
cada uma com professor, faixa, mensalidade e turma(s) próprios** —
`aluno_modalidades` é a unidade real de matrícula/cobrança, não `alunos`.
`alunos` guarda só a pessoa (CPF, status, link de login).

Status de pagamento (`pagamentos.status`): `pendente` → `confirmado` ou
`atrasado`. Quando não existe linha de pagamento pro mês ainda, a tela mostra
"sem cobrança" — isso é derivado (`getStatusFinanceiroMatricula` em
`selectors.ts`), não é um status gravado no banco.

## Fluxos que vale entender antes de mexer

- **Criar professor/aluno**: chama a Edge Function `admin-create-user` (cria
  o `auth.users` real com a senha definida), e só depois insere a linha em
  `professores`/`alunos` e `aluno_modalidades` via `supabase-js` normal. Ver
  `createAluno`/`createProfessor` em `AppDataContext.tsx` — o insert em
  `alunos` **não pede `.select()` de volta**: o professor só passa a enxergar
  aquele aluno depois que a matrícula existe, então um `INSERT ... RETURNING`
  seria barrado pela própria RLS. O `id` é gerado no cliente
  (`crypto.randomUUID()`) por causa disso.
- **Regra de senha**: 6 a 8 caracteres, 1 maiúscula, 1 caractere especial —
  definida uma vez em `src/domain/validation.ts` e duplicada (de propósito)
  dentro das duas Edge Functions, porque a validação do cliente é só
  conveniência; a que vale é a do servidor.
- **Rotas**: não tem `react-router`. Cada aba tem seu path (`/professores`,
  `/alunos-pagamentos`...) sincronizado com `history.pushState`/`popstate` em
  `App.tsx` (função `navigate`). O `vercel.json` tem um rewrite
  (`/(.*) → /index.html`) obrigatório pra isso funcionar em produção — é SPA
  estática, sem rota de servidor real.
- **Exportar Excel** (Alunos, Relatórios): usa `xlsx` (SheetJS) carregado com
  `import()` dinâmico só quando alguém clica em exportar — a lib é pesada
  (~490KB) e a maioria das visitas nunca exporta nada.
- **Redefinir senha de outra conta**: só existe no modal de "Editar" de
  professor/aluno, campo "Nova senha" (em branco = mantém a atual). Passa
  pela Edge Function `admin-set-password`; alunos sem `profile_id` (sem
  login próprio) não têm senha pra redefinir.

## Segurança / RLS

Toda a autorização está em `supabase/migrations/`. Já passamos por mais de
uma rodada de auditoria nesse schema — os relatórios completos (achados,
como foram corrigidos, o que ainda está pendente) estão fora do repositório
de propósito, porque é público e alguns achados documentam exploit de forma
reproduzível. Peça o relatório mais recente a quem já trabalhou nisso, ou
rode a skill `auditoria-seguranca` de novo antes de mexer em qualquer policy.

Pontos que vale lembrar sem precisar reler os achados todos:

- `alunos.profile_id` e `aluno_modalidades`/`aluno_turmas` têm um histórico
  de bugs de RLS sutis (recursão de policy, insert bloqueado pela própria
  policy de select) — qualquer mudança nessa área merece um teste real
  (insert/update dentro de uma transação com `ROLLBACK`), não só leitura de
  `pg_policies`.
- `presencas` **não valida** que o aluno está matriculado na turma antes de
  aceitar o registro — um professor consegue, hoje, lançar presença de um
  aluno que não é dele. Achado conhecido, sem migration corretiva ainda.

## Variáveis de ambiente

| Variável | Onde | Pública? |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend (`.env.local`, e nas env vars do projeto na Vercel) | Sim, por design |
| `VITE_SUPABASE_ANON_KEY` | Idem | Sim, por design |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Só local, `.env.seed.local`, usado pelo `scripts/seed-test-data.mjs` | **Nunca** committar nem usar no frontend |

Copie `.env.example` → `.env.local` (valores em Project Settings → API no
painel do Supabase) para rodar local.

## Comandos

```bash
npm run dev       # servidor de desenvolvimento (Vite)
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview   # serve o build de produção localmente
npm run seed:test-data   # roda scripts/seed-test-data.mjs (precisa .env.seed.local)
```

## Deploy

- **Site**: Vercel, deploy automático a cada push em `main` (integração
  GitHub → Vercel já configurada). A versão mostrada no rodapé do app vem de
  `package.json#version`, injetada no build por `vite.config.ts`
  (`__APP_VERSION__`) — convenção: subir o patch a cada deploy.
- **Banco/Edge Functions**: não têm deploy automático pelo git push. Migration
  nova = aplicar manualmente no projeto Supabase (SQL Editor ou
  `apply_migration`); Edge Function alterada = `deploy_edge_function` ou
  `supabase functions deploy <nome>` via CLI.
- **Plano free do Supabase pausa o projeto por inatividade.** Se o site
  mostrar "Failed to fetch" do nada, é provavelmente isso — reative o projeto
  no painel do Supabase (ou via `restore_project`) antes de suspeitar de bug.
