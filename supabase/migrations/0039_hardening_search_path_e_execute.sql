-- Correções à migration 0038, encontradas ao checar os advisors depois de
-- aplicá-la:
--
-- 1) BAIXO-02 não fechou de verdade: revogar EXECUTE de anon/authenticated
--    não basta porque toda função nasce com EXECUTE concedido a PUBLIC
--    (papel implícito do qual anon/authenticated também herdam). Sem
--    revogar de PUBLIC, o grant antigo continua valendo.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.prevent_unauthorized_profile_changes() from public;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public;
  end if;
end $$;

-- 2) BAIXO-03 (mesma classe do fix em set_updated_at, migration 0038): a
--    migration 0033 criou check_aluno_turma_matches_modalidade depois da
--    auditoria original, com as mesmas referências de tabela sem schema
--    (aluno_modalidades, turmas) e sem search_path fixo.
alter function public.check_aluno_turma_matches_modalidade() set search_path = public;
