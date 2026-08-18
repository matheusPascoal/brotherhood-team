create policy profiles_select_own on profiles
  for select using (id = auth.uid());

create policy profiles_select_admin on profiles
  for select using (public.current_user_role() = 'admin');

-- professor lê o profile dos próprios alunos (para exibir nome/telefone etc.)
create policy profiles_select_professor_alunos on profiles
  for select using (
    public.current_user_role() = 'professor'
    and id in (select profile_id from alunos where professor_id = auth.uid() and profile_id is not null)
  );

create policy profiles_update_own on profiles
  for update using (id = auth.uid());

create policy profiles_update_admin on profiles
  for update using (public.current_user_role() = 'admin');
