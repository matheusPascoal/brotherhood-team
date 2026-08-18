create table graduacoes_historico (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  faixa text not null,
  grau int not null check (grau >= 0 and grau <= 4),
  data_graduacao date not null,
  registrado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
