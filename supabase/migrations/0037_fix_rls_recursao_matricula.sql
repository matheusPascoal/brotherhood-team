-- alunos_all_professor consulta aluno_modalidades, e aluno_modalidades_select_aluno
-- consulta alunos de volta — com RLS normal isso forma um ciclo
-- (42P17: infinite recursion detected in policy for relation "alunos").
-- Mesmo fix já usado em current_user_role() (migration 0013): funções
-- security definer, que rodam com bypass de RLS, quebram o ciclo.

create function public.professor_tem_matricula_do_aluno(p_aluno_id uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from aluno_modalidades
    where aluno_modalidades.aluno_id = p_aluno_id
      and aluno_modalidades.professor_id = auth.uid()
  );
$$;

create function public.aluno_e_dono(p_aluno_id uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from alunos
    where alunos.id = p_aluno_id and alunos.profile_id = auth.uid()
  );
$$;

drop policy alunos_all_professor on alunos;
create policy alunos_all_professor on alunos
  for all using (public.professor_tem_matricula_do_aluno(alunos.id))
  with check (public.professor_tem_matricula_do_aluno(alunos.id));

drop policy aluno_modalidades_select_aluno on aluno_modalidades;
create policy aluno_modalidades_select_aluno on aluno_modalidades
  for select using (public.aluno_e_dono(aluno_modalidades.aluno_id));
