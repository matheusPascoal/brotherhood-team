-- Matrícula multi-modalidade: um aluno pode fazer mais de uma modalidade,
-- cada uma com seu próprio professor, faixa/grau, valor de mensalidade e
-- turma(s). aluno_modalidades é a unidade de cobrança/graduação;
-- aluno_turmas é a matrícula explícita do aluno em turma(s) específica(s)
-- dentro de cada modalidade (deixa de ser implícito por professor+modalidade).

create table aluno_modalidades (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  professor_id uuid not null references professores (profile_id) on delete restrict,
  modalidade_id uuid not null references modalidades (id) on delete restrict,
  faixa_atual text not null,
  grau_atual int not null default 0 check (grau_atual >= 0 and grau_atual <= 4),
  mensalidade_valor numeric(10, 2) not null check (mensalidade_valor >= 0),
  dia_vencimento int not null check (dia_vencimento >= 1 and dia_vencimento <= 31),
  status aluno_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aluno_id, modalidade_id)
);

create table aluno_turmas (
  id uuid primary key default gen_random_uuid(),
  aluno_modalidade_id uuid not null references aluno_modalidades (id) on delete cascade,
  turma_id uuid not null references turmas (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (aluno_modalidade_id, turma_id)
);

-- Garante que a turma escolhida realmente pertence à modalidade/professor da
-- matrícula (mesma checagem que antes vinha implícita da interseção
-- professor_id+modalidade_id usada pela RLS turmas_select_aluno).
create function check_aluno_turma_matches_modalidade() returns trigger as $$
declare
  v_modalidade_id uuid;
  v_professor_id uuid;
begin
  select modalidade_id, professor_id into v_modalidade_id, v_professor_id
  from aluno_modalidades where id = new.aluno_modalidade_id;

  if not exists (
    select 1 from turmas
    where id = new.turma_id
      and modalidade_id = v_modalidade_id
      and professor_id = v_professor_id
  ) then
    raise exception 'A turma selecionada não pertence à modalidade/professor desta matrícula.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger check_aluno_turma_matches_modalidade
  before insert or update on aluno_turmas
  for each row execute function check_aluno_turma_matches_modalidade();

-- Copia os dados de alunos (uma modalidade cada, até aqui) para a matrícula.
insert into aluno_modalidades (
  aluno_id, professor_id, modalidade_id, faixa_atual, grau_atual,
  mensalidade_valor, dia_vencimento, status, created_at, updated_at
)
select id, professor_id, modalidade_id, faixa_atual, grau_atual,
  mensalidade_valor, dia_vencimento, status, created_at, updated_at
from alunos;

create trigger set_updated_at before update on aluno_modalidades
  for each row execute function set_updated_at();

alter table aluno_modalidades enable row level security;
alter table aluno_turmas enable row level security;
