-- security definer para evitar recursão de RLS ao consultar profiles de dentro
-- das próprias políticas de RLS. Fica em public (não em auth) por ser mais
-- simples de manter — o schema auth é gerenciado pelo Supabase.
create function public.current_user_role() returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;
