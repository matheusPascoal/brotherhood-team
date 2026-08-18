-- Defesa em profundidade: mesmo que uma policy de RLS deixasse passar,
-- ninguém além de admin (ou service_role, usado pelos fluxos de backend que
-- promovem role) pode alterar role/status de um profile.
create function public.prevent_unauthorized_profile_changes() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role <> old.role or new.status <> old.status)
     and coalesce(auth.role(), '') <> 'service_role'
     and public.current_user_role() <> 'admin' then
    raise exception 'Apenas administradores podem alterar role ou status de um perfil';
  end if;
  return new;
end;
$$;

create trigger prevent_unauthorized_profile_changes
  before update on profiles
  for each row execute function public.prevent_unauthorized_profile_changes();
