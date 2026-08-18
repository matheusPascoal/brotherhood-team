create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on modalidades
  for each row execute function set_updated_at();
create trigger set_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger set_updated_at before update on professores
  for each row execute function set_updated_at();
create trigger set_updated_at before update on alunos
  for each row execute function set_updated_at();
create trigger set_updated_at before update on turmas
  for each row execute function set_updated_at();
create trigger set_updated_at before update on pagamentos
  for each row execute function set_updated_at();
create trigger set_updated_at before update on presencas
  for each row execute function set_updated_at();
create trigger set_updated_at before update on graduacoes_historico
  for each row execute function set_updated_at();
