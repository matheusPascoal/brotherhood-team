-- Seed da Fase 1: apenas "modalidades", que não depende de auth.users.
--
-- Professores e alunos de exemplo (3 professores, 5 alunos, conforme a
-- seção 1.1 do plano) só podem ser semeados DEPOIS da Fase 2, porque
-- profiles.id referencia auth.users.id — ou seja, cada professor/aluno
-- de teste precisa primeiro existir como usuário real no Supabase Auth
-- (o trigger da Fase 2 cria a linha em profiles automaticamente).
-- Esse seed completo será feito junto com a Fase 2.

insert into modalidades (nome, faixas_ordem) values
  ('Jiu-Jitsu (BJJ)', '["Branca", "Azul", "Roxa", "Marrom", "Preta"]'),
  ('Muay Thai', '["Branca", "Amarela", "Verde", "Azul", "Marrom", "Preta"]'),
  ('Judô', '["Branca", "Cinza", "Azul", "Amarela", "Laranja", "Verde", "Roxa", "Marrom", "Preta"]'),
  ('Karate-Dô', '["Branca", "Amarela", "Laranja", "Verde", "Azul", "Marrom", "Preta"]'),
  ('Kickboxing', '["Branca", "Amarela", "Laranja", "Verde", "Azul", "Marrom", "Preta"]'),
  ('Taekwondo', '["Branca", "Amarela", "Verde", "Azul", "Vermelha", "Preta"]'),
  ('Musculação', '[]');

-- Catálogo de materiais também não depende de auth.users, então já pode ser
-- semeado. Movimentações de estoque de exemplo ficam para a Fase 2, junto
-- com o restante dos dados que referenciam profiles (registrado_por).
insert into materiais (nome, categoria, unidade, estoque_minimo, preco_unitario) values
  ('Kimono BJJ Adulto', 'Uniformes', 'unidade', 5, 220.00),
  ('Faixa (todas as cores)', 'Uniformes', 'unidade', 10, 35.00),
  ('Luva de Muay Thai', 'Equipamentos', 'par', 4, 90.00),
  ('Protetor Bucal', 'Suprimentos', 'unidade', 15, 12.00),
  ('Caneleira', 'Equipamentos', 'par', 4, 75.00);
