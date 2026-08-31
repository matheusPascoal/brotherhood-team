-- Policies de aluno_modalidades e aluno_turmas (as tabelas novas de
-- matrícula). As policies de alunos/turmas/pagamentos/graduacoes_historico
-- que dependiam das colunas antigas já foram reescritas nas migrations
-- 0034/0035, junto com o drop das colunas que elas usavam.

create policy aluno_modalidades_all_admin on aluno_modalidades
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Professor só mexe nas matrículas onde ele é o responsável, e só pode criar
-- matrícula numa modalidade que ele realmente leciona (professor_modalidades).
create policy aluno_modalidades_all_professor on aluno_modalidades
  for all using (professor_id = auth.uid())
  with check (
    professor_id = auth.uid()
    and exists (
      select 1 from professor_modalidades
      where professor_modalidades.professor_id = auth.uid()
        and professor_modalidades.modalidade_id = aluno_modalidades.modalidade_id
    )
  );

create policy aluno_modalidades_select_aluno on aluno_modalidades
  for select using (
    exists (select 1 from alunos where alunos.id = aluno_modalidades.aluno_id and alunos.profile_id = auth.uid())
  );

create policy aluno_turmas_all_admin on aluno_turmas
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy aluno_turmas_all_professor on aluno_turmas
  for all using (
    exists (select 1 from aluno_modalidades where aluno_modalidades.id = aluno_turmas.aluno_modalidade_id and aluno_modalidades.professor_id = auth.uid())
  )
  with check (
    exists (select 1 from aluno_modalidades where aluno_modalidades.id = aluno_turmas.aluno_modalidade_id and aluno_modalidades.professor_id = auth.uid())
  );

create policy aluno_turmas_select_aluno on aluno_turmas
  for select using (
    exists (
      select 1 from aluno_modalidades
      join alunos on alunos.id = aluno_modalidades.aluno_id
      where aluno_modalidades.id = aluno_turmas.aluno_modalidade_id
        and alunos.profile_id = auth.uid()
    )
  );
