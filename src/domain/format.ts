export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatCpfFull(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// LGPD (seção 5.3 do plano): nunca expor CPF completo em listagens gerais.
export function maskCpf(cpf: string): string {
  const [, g1, , g3, g4] = cpf.match(/(\d{3})(\d{3})(\d{3})(\d{2})/) ?? []
  if (!g1) return cpf
  return `${g1}.***.**${g3.slice(-1)}-${g4}`
}

export function formatMesReferencia(mesReferencia: string): string {
  const [year, month] = mesReferencia.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

// new Date("YYYY-MM-DD") interpreta a string como UTC — em fusos negativos
// isso exibe o dia anterior. Construir com y/m/d explícitos evita o bug.
export function formatDataLocal(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}
