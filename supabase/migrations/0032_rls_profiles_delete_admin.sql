-- Faltava a policy de DELETE em profiles: sem ela, um DELETE feito por um
-- usuário autenticado (não service_role) afeta 0 linhas silenciosamente (RLS
-- nega por padrão sem lançar erro), fazendo deleteProfessor/deleteAluno
-- parecerem bem-sucedidos sem remover nada do banco.
create policy profiles_delete_admin on profiles
  for delete using (public.current_user_role() = 'admin');
