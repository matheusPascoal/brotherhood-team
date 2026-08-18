create trigger set_updated_at before update on materiais
  for each row execute function set_updated_at();
create trigger set_updated_at before update on movimentos_estoque
  for each row execute function set_updated_at();
