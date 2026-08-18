create policy alunos_all_admin on alunos
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy alunos_all_professor on alunos
  for all using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

create policy alunos_select_own on alunos
  for select using (profile_id = auth.uid());
