create table turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references professores (profile_id) on delete restrict,
  modalidade_id uuid not null references modalidades (id) on delete restrict,
  nome text not null,
  local text,
  capacidade_maxima int not null check (capacidade_maxima > 0),
  hora_inicio time not null,
  hora_fim time not null check (hora_fim > hora_inicio),
  dias_semana dia_semana[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
