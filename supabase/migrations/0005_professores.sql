-- profile_id é único (extensão 1:1 de profiles) e é o alvo das FKs de
-- alunos/turmas/professor_modalidades — não a coluna id.
create table professores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  comissao_percentual numeric(5, 2) not null default 0 check (
    comissao_percentual >= 0 and comissao_percentual <= 100
  ),
  status account_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
