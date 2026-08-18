create table movimentos_estoque (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materiais (id) on delete restrict,
  tipo tipo_movimento_estoque not null,
  quantidade int not null check (quantidade > 0),
  data date not null,
  motivo text,
  observacao text,
  registrado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
