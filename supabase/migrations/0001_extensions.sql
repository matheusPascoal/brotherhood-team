-- Garante gen_random_uuid() disponível para os defaults de "id" de todas as tabelas.
create extension if not exists pgcrypto;
