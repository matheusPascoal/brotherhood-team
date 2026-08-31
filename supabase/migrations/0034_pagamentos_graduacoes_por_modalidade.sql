-- pagamentos e graduacoes_historico passam a ser por matrícula
-- (aluno_modalidade) em vez de por aluno: cada modalidade cobra e gradua
-- separadamente, com valor/faixa/grau próprios.

-- As policies antigas dependem da coluna aluno_id que vai sumir; precisam ser
-- derrubadas antes do alter table e recriadas já apontando pra matrícula.
drop policy pagamentos_all_professor on pagamentos;
drop policy pagamentos_select_aluno on pagamentos;
drop policy graduacoes_all_professor on graduacoes_historico;
drop policy graduacoes_select_aluno on graduacoes_historico;

alter table pagamentos
  add column aluno_modalidade_id uuid references aluno_modalidades (id) on delete restrict;

-- Cada aluno tinha exatamente uma modalidade até aqui (migration 0033), então
-- o join é 1:1 e sem ambiguidade.
update pagamentos p
set aluno_modalidade_id = am.id
from aluno_modalidades am
where am.aluno_id = p.aluno_id;

alter table pagamentos
  alter column aluno_modalidade_id set not null,
  drop constraint pagamentos_aluno_id_mes_referencia_key,
  add constraint pagamentos_aluno_modalidade_id_mes_referencia_key unique (aluno_modalidade_id, mes_referencia),
  drop column aluno_id;

alter table graduacoes_historico
  add column aluno_modalidade_id uuid references aluno_modalidades (id) on delete cascade;

update graduacoes_historico g
set aluno_modalidade_id = am.id
from aluno_modalidades am
where am.aluno_id = g.aluno_id;

alter table graduacoes_historico
  alter column aluno_modalidade_id set not null,
  drop column aluno_id;

create policy pagamentos_all_professor on pagamentos
  for all using (
    exists (select 1 from aluno_modalidades where aluno_modalidades.id = pagamentos.aluno_modalidade_id and aluno_modalidades.professor_id = auth.uid())
  )
  with check (
    exists (select 1 from aluno_modalidades where aluno_modalidades.id = pagamentos.aluno_modalidade_id and aluno_modalidades.professor_id = auth.uid())
  );

create policy pagamentos_select_aluno on pagamentos
  for select using (
    exists (
      select 1 from aluno_modalidades
      join alunos on alunos.id = aluno_modalidades.aluno_id
      where aluno_modalidades.id = pagamentos.aluno_modalidade_id
        and alunos.profile_id = auth.uid()
    )
  );

create policy graduacoes_all_professor on graduacoes_historico
  for all using (
    exists (select 1 from aluno_modalidades where aluno_modalidades.id = graduacoes_historico.aluno_modalidade_id and aluno_modalidades.professor_id = auth.uid())
  )
  with check (
    exists (select 1 from aluno_modalidades where aluno_modalidades.id = graduacoes_historico.aluno_modalidade_id and aluno_modalidades.professor_id = auth.uid())
  );

create policy graduacoes_select_aluno on graduacoes_historico
  for select using (
    exists (
      select 1 from aluno_modalidades
      join alunos on alunos.id = aluno_modalidades.aluno_id
      where aluno_modalidades.id = graduacoes_historico.aluno_modalidade_id
        and alunos.profile_id = auth.uid()
    )
  );
