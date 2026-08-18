create policy movimentos_estoque_all_admin on movimentos_estoque
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
