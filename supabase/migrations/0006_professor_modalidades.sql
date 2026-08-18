create table professor_modalidades (
  professor_id uuid not null references professores (profile_id) on delete cascade,
  modalidade_id uuid not null references modalidades (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (professor_id, modalidade_id)
);
