-- profile_id fica nullable: decisão de acesso do aluno (login próprio ou não)
-- será tomada na Fase 2 (seção 4, Fase 2, tarefa 2).
create table alunos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references profiles (id) on delete set null,
  cpf text not null unique check (cpf ~ '^\d{11}$'),
  professor_id uuid not null references professores (profile_id) on delete restrict,
  modalidade_id uuid not null references modalidades (id) on delete restrict,
  faixa_atual text not null,
  grau_atual int not null default 0 check (grau_atual >= 0 and grau_atual <= 4),
  mensalidade_valor numeric(10, 2) not null check (mensalidade_valor >= 0),
  dia_vencimento int not null check (dia_vencimento >= 1 and dia_vencimento <= 31),
  status aluno_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
