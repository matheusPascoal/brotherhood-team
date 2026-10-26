-- Bug: professor não conseguia editar nome/e-mail de um aluno. updateAluno
-- (AppDataContext) faz update em `profiles` pro nome/e-mail, mas só existiam
-- profiles_update_own e profiles_update_admin (migration 0017) — o professor
-- caía fora das duas, então o UPDATE batia na RLS e afetava 0 linhas (sem
-- erro, já que Postgres/PostgREST não reportam erro por "0 rows" num update
-- sem `.select()`), e a tela fechava o modal como se tivesse salvo.
--
-- A trigger prevent_unauthorized_profile_changes (migration 0015) já bloqueia
-- troca de role/status por quem não é admin, então liberar update aqui pro
-- professor só nos profiles dos próprios alunos não abre brecha nova — espelha
-- exatamente o escopo de profiles_select_professor_alunos (migration 0035).
create policy profiles_update_professor_alunos on profiles
  for update using (
    public.current_user_role() = 'professor'
    and id in (
      select alunos.profile_id from alunos
      join aluno_modalidades on aluno_modalidades.aluno_id = alunos.id
      where aluno_modalidades.professor_id = auth.uid() and alunos.profile_id is not null
    )
  )
  with check (
    public.current_user_role() = 'professor'
    and id in (
      select alunos.profile_id from alunos
      join aluno_modalidades on aluno_modalidades.aluno_id = alunos.id
      where aluno_modalidades.professor_id = auth.uid() and alunos.profile_id is not null
    )
  );
