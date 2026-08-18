-- Cria automaticamente a linha em profiles quando um usuário é criado no
-- Supabase Auth. O role sempre nasce como 'aluno' (menor privilégio) —
-- nunca confiar em raw_user_meta_data.role, pois esse metadata é enviado
-- pelo próprio cliente em signUp() e poderia ser manipulado para se
-- autopromover a admin/professor. Promoção de role só deve ocorrer via
-- service_role, a partir de um fluxo de backend confiável (nunca do frontend).
create function public.handle_new_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    'aluno',
    'ativo'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
