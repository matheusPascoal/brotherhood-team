create policy turmas_all_admin on turmas
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy turmas_all_professor on turmas
  for all using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- "turmas da própria modalidade/professor": a grade do aluno é a interseção
-- entre o professor responsável por ele e a modalidade que ele pratica.
create policy turmas_select_aluno on turmas
  for select using (
    exists (
      select 1 from alunos
      where alunos.profile_id = auth.uid()
        and alunos.professor_id = turmas.professor_id
        and alunos.modalidade_id = turmas.modalidade_id
    )
  );
