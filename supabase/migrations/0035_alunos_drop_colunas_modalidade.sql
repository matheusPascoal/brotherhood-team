-- Dados de professor/modalidade/faixa/grau/mensalidade/vencimento já foram
-- copiados para aluno_modalidades (migration 0033); alunos fica só com os
-- dados da pessoa (login, CPF, status geral).

-- As policies antigas dependem das colunas que vão sumir; precisam ser
-- derrubadas antes do alter table e recriadas já apontando pra matrícula.
drop policy alunos_all_professor on alunos;
drop policy turmas_select_aluno on turmas;
drop policy profiles_select_professor_alunos on profiles;

alter table alunos
  drop column professor_id,
  drop column modalidade_id,
  drop column faixa_atual,
  drop column grau_atual,
  drop column mensalidade_valor,
  drop column dia_vencimento;

create policy alunos_all_professor on alunos
  for all using (
    exists (select 1 from aluno_modalidades where aluno_modalidades.aluno_id = alunos.id and aluno_modalidades.professor_id = auth.uid())
  )
  with check (
    exists (select 1 from aluno_modalidades where aluno_modalidades.aluno_id = alunos.id and aluno_modalidades.professor_id = auth.uid())
  );

-- "turmas da matrícula": o aluno só vê a turma se estiver explicitamente
-- matriculado nela (aluno_turmas), não mais por interseção professor+modalidade.
create policy turmas_select_aluno on turmas
  for select using (
    exists (
      select 1 from aluno_turmas
      join aluno_modalidades on aluno_modalidades.id = aluno_turmas.aluno_modalidade_id
      join alunos on alunos.id = aluno_modalidades.aluno_id
      where aluno_turmas.turma_id = turmas.id
        and alunos.profile_id = auth.uid()
    )
  );

-- professor lê o profile dos próprios alunos (para exibir nome/telefone etc.)
create policy profiles_select_professor_alunos on profiles
  for select using (
    public.current_user_role() = 'professor'
    and id in (
      select alunos.profile_id from alunos
      join aluno_modalidades on aluno_modalidades.aluno_id = alunos.id
      where aluno_modalidades.professor_id = auth.uid() and alunos.profile_id is not null
    )
  );
