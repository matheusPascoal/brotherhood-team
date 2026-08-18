create policy graduacoes_all_admin on graduacoes_historico
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- plano diz "escrita apenas para os próprios alunos"; leitura segue a mesma
-- regra por consistência (professor precisa ver o histórico que registrou).
create policy graduacoes_all_professor on graduacoes_historico
  for all using (
    exists (select 1 from alunos where alunos.id = graduacoes_historico.aluno_id and alunos.professor_id = auth.uid())
  )
  with check (
    exists (select 1 from alunos where alunos.id = graduacoes_historico.aluno_id and alunos.professor_id = auth.uid())
  );

create policy graduacoes_select_aluno on graduacoes_historico
  for select using (
    exists (select 1 from alunos where alunos.id = graduacoes_historico.aluno_id and alunos.profile_id = auth.uid())
  );
