-- Estoque é uma tela exclusiva da área do administrador (sem tela de
-- consulta para professor/aluno ainda), então a única política é admin-only.
create policy materiais_all_admin on materiais
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
