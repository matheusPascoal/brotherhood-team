create table modalidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  faixas_ordem jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
