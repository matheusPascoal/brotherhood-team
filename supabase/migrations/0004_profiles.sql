-- Estende auth.users (1 linha por usuário autenticado). O trigger que popula
-- esta tabela automaticamente ao criar um auth.users é feito na Fase 2.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null,
  avatar_url text,
  status account_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
