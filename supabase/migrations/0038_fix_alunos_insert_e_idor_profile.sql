-- Duas correções relacionadas à policy de `alunos` criada em 0037:
--
-- 1) Bug funcional: alunos_all_professor exige que já exista uma linha em
--    aluno_modalidades apontando pro aluno (professor_tem_matricula_do_aluno).
--    Isso bloqueia o INSERT inicial do cadastro (AppDataContext.createAluno
--    insere `alunos` antes de `aluno_modalidades`, que só pode referenciar um
--    aluno_id que já existe) — hoje nenhum professor consegue cadastrar aluno
--    novo. O INSERT precisa ser liberado sem depender de matrícula prévia;
--    quem garante que a matrícula será criada em seguida, na mesma modalidade
--    que o professor leciona, é a policy de aluno_modalidades (0036).
--
-- 2) IDOR (auditoria 2026-08-19, achado CRÍTICO-01): nem a versão original nem
--    a de 0037 validam que `profile_id` aponta pra uma conta com role
--    `aluno`. Um professor com pelo menos uma matrícula real pode fazer
--    UPDATE alunos SET profile_id = '<uuid de admin>' WHERE id = '<sua
--    matrícula>' e depois ler o profile completo da vítima via
--    profiles_select_professor_alunos (0035), que só confia nesse vínculo.
--    Fechamos isso validando a role do profile_id alvo tanto no INSERT
--    (sem matrícula ainda) quanto no UPDATE (com matrícula).

drop policy alunos_all_professor on alunos;

-- alunos_all_professor era FOR ALL (cobria SELECT também); mantém a leitura
-- dos próprios alunos ao trocar por policies separadas por operação.
create policy alunos_select_professor on alunos
  for select
  using (public.professor_tem_matricula_do_aluno(alunos.id));

create policy alunos_insert_professor on alunos
  for insert
  with check (
    profile_id is null
    or exists (select 1 from profiles where id = profile_id and role = 'aluno')
  );

create policy alunos_update_professor on alunos
  for update
  using (public.professor_tem_matricula_do_aluno(alunos.id))
  with check (
    public.professor_tem_matricula_do_aluno(alunos.id)
    and (
      profile_id is null
      or exists (select 1 from profiles where id = profile_id and role = 'aluno')
    )
  );

create policy alunos_delete_professor on alunos
  for delete
  using (public.professor_tem_matricula_do_aluno(alunos.id));

-- MÉDIO-01: professor_modalidades era legível por qualquer usuário
-- autenticado (inclusive aluno), vazando o UUID de todos os professores do
-- sistema. Restringe a leitura ao próprio professor e ao admin; o app não
-- depende de listar o professor_id de terceiros nessa tabela.
drop policy professor_modalidades_select_authenticated on professor_modalidades;

create policy professor_modalidades_select_own on professor_modalidades
  for select
  using (professor_id = auth.uid() or public.current_user_role() = 'admin');

-- BAIXO-02: funções security definer de uso interno (triggers/manutenção de
-- schema) não deveriam ser executáveis via RPC público.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.prevent_unauthorized_profile_changes() from anon, authenticated;

-- rls_auto_enable não existe em nenhuma migration deste repo (só apareceu no
-- advisor da auditoria — provavelmente criada manualmente no painel), então
-- o revoke é condicional pra não falhar a migration inteira se a assinatura
-- não bater ou a função não existir.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from anon, authenticated;
  end if;
end $$;

-- BAIXO-03: fixa search_path pra evitar search-path hijacking.
alter function public.set_updated_at() set search_path = public;
