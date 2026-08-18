create table materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text,
  unidade text not null default 'unidade',
  estoque_minimo int not null default 0 check (estoque_minimo >= 0),
  preco_unitario numeric(10, 2) check (preco_unitario >= 0),
  status account_status not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
