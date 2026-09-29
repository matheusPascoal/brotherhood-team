-- Duas correções encontradas testando a migration 0038 ponta a ponta
-- (INSERT + matrícula, como o app realmente faz), com ROLLBACK:
--
-- 1) O EXISTS(select ... from profiles ...) usado no with_check de
--    alunos_insert_professor/alunos_update_professor roda sob as policies de
--    RLS de `profiles` do papel que está inserindo. Um professor criando um
--    aluno pela primeira vez ainda não tem matrícula nenhuma com esse
--    profile_id — logo profiles_select_professor_alunos não libera a leitura
--    e o EXISTS sempre dá falso, quebrando o cadastro de novo aluno de novo
--    (mesma classe de bug que motivou current_user_role/
--    professor_tem_matricula_do_aluno serem security definer). A checagem de
--    role do profile_id alvo precisa da mesma solução: função security
--    definer, que bypassa RLS de profiles só pra essa verificação pontual.
--
-- 2) INSERT ... RETURNING/`.select()` num aluno recém-criado por um
--    professor sempre falha (a linha nova nunca passa em
--    alunos_select_professor antes de existir matrícula) — isso é esperado
--    e já foi corrigido no app (AppDataContext.createAluno não usa mais
--    .select() nesse insert), não precisa de mudança de RLS.

create function public.profile_tem_role_aluno(p_profile_id uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = p_profile_id and role = 'aluno');
$$;

drop policy alunos_insert_professor on alunos;
create policy alunos_insert_professor on alunos
  for insert
  with check (
    profile_id is null
    or public.profile_tem_role_aluno(profile_id)
  );

drop policy alunos_update_professor on alunos;
create policy alunos_update_professor on alunos
  for update
  using (public.professor_tem_matricula_do_aluno(alunos.id))
  with check (
    public.professor_tem_matricula_do_aluno(alunos.id)
    and (
      profile_id is null
      or public.profile_tem_role_aluno(profile_id)
    )
  );
