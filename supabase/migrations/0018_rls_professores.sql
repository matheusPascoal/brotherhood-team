create policy professores_all_admin on professores
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Nota: conforme a tabela de RLS do plano, o próprio professor tem
-- leitura/escrita do seu registro. Isso inclui comissao_percentual — se
-- quiser impedir que o professor altere a própria comissão, restrinja essa
-- edição na tela (a RLS é por linha, não por coluna).
create policy professores_select_own on professores
  for select using (profile_id = auth.uid());

create policy professores_update_own on professores
  for update using (profile_id = auth.uid());
