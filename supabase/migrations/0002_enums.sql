create type user_role as enum ('admin', 'professor', 'aluno');
create type account_status as enum ('ativo', 'inativo');
create type aluno_status as enum ('ativo', 'inativo', 'trancado');
create type status_pagamento as enum ('pendente', 'confirmado', 'atrasado');
create type metodo_pagamento as enum ('pix', 'dinheiro', 'cartao', 'outro');
create type dia_semana as enum ('domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado');
