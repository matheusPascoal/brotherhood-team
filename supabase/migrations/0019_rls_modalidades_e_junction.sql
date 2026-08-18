-- Não estão na tabela de RLS da seção 5.2 do plano (são dados de referência),
-- mas toda tabela precisa de RLS explícita: leitura liberada para qualquer
-- usuário autenticado, escrita restrita ao admin.
create policy modalidades_select_authenticated on modalidades
  for select using (auth.uid() is not null);

create policy modalidades_all_admin on modalidades
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy professor_modalidades_select_authenticated on professor_modalidades
  for select using (auth.uid() is not null);

create policy professor_modalidades_all_admin on professor_modalidades
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
