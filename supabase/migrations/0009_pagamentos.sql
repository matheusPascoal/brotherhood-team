create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete restrict,
  -- sempre o dia 1 do mês de referência (ex.: 2026-08-01)
  mes_referencia date not null check (date_trunc('month', mes_referencia) = mes_referencia),
  valor numeric(10, 2) not null check (valor >= 0),
  status status_pagamento not null default 'pendente',
  metodo metodo_pagamento,
  confirmado_por uuid references profiles (id) on delete set null,
  confirmado_em timestamptz,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (aluno_id, mes_referencia)
);
