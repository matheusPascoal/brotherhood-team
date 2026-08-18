create policy pagamentos_all_admin on pagamentos
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy pagamentos_all_professor on pagamentos
  for all using (
    exists (select 1 from alunos where alunos.id = pagamentos.aluno_id and alunos.professor_id = auth.uid())
  )
  with check (
    exists (select 1 from alunos where alunos.id = pagamentos.aluno_id and alunos.professor_id = auth.uid())
  );

create policy pagamentos_select_aluno on pagamentos
  for select using (
    exists (select 1 from alunos where alunos.id = pagamentos.aluno_id and alunos.profile_id = auth.uid())
  );
