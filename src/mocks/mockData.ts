function firstDayOfMonth(offsetMonths: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  return d.toISOString().slice(0, 10)
}

export const MES_ATUAL = firstDayOfMonth(0)
export const MES_ANTERIOR = firstDayOfMonth(-1)

// Meta de receita mensal: ainda não modelada no banco (não existe tabela para
// isso). Fica como constante até decidirmos onde essa meta deveria morar
// (ex.: uma tabela "metas" ou config da academia).
export const META_MENSAL_PREVISTA = 1500
