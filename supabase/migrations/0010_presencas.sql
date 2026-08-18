create table presencas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas (id) on delete cascade,
  aluno_id uuid not null references alunos (id) on delete cascade,
  data_aula date not null,
  presente boolean not null default false,
  observacao_aula text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (turma_id, aluno_id, data_aula)
);
