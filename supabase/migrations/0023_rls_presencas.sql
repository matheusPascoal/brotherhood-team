create policy presencas_all_admin on presencas
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy presencas_all_professor on presencas
  for all using (
    exists (select 1 from turmas where turmas.id = presencas.turma_id and turmas.professor_id = auth.uid())
  )
  with check (
    exists (select 1 from turmas where turmas.id = presencas.turma_id and turmas.professor_id = auth.uid())
  );

create policy presencas_select_aluno on presencas
  for select using (
    exists (select 1 from alunos where alunos.id = presencas.aluno_id and alunos.profile_id = auth.uid())
  );
