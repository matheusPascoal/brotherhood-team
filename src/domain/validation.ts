// Regra de senha do sistema: 6 a 8 caracteres, pelo menos 1 letra maiúscula
// e pelo menos 1 caractere especial. Usada em todo formulário que define ou
// redefine senha (criação de conta, troca pelo próprio usuário, reset pelo
// admin) — e espelhada nas Edge Functions admin-create-user/admin-set-password,
// que são a validação que realmente vale (o cliente só evita uma ida ao
// servidor pra descobrir que a senha é inválida).
export const SENHA_REGRA_DESCRICAO = '6 a 8 caracteres, com 1 letra maiúscula e 1 caractere especial'

export function validarSenha(senha: string): string | null {
  if (senha.length < 6 || senha.length > 8) {
    return 'A senha precisa ter entre 6 e 8 caracteres.'
  }
  if (!/[A-Z]/.test(senha)) {
    return 'A senha precisa ter pelo menos 1 letra maiúscula.'
  }
  if (!/[^A-Za-z0-9]/.test(senha)) {
    return 'A senha precisa ter pelo menos 1 caractere especial.'
  }
  return null
}
