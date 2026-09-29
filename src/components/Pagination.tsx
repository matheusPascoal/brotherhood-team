import { useEffect, useState } from 'react'

// Reseta pra página 1 quando o tamanho da página muda, e volta a página pro
// último valor válido se um filtro reduzir o total de linhas abaixo dela.
export function usePagination(total: number, initialPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return { page, pageSize, totalPages, setPage, setPageSize: changePageSize }
}

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20] }: PaginationProps) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const inicio = (page - 1) * pageSize + 1
  const fim = Math.min(page * pageSize, total)

  return (
    <div className="pagination">
      <span className="pagination__info">
        {inicio}–{fim} de {total}
      </span>
      <label className="pagination__size">
        Mostrar
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="pagination__nav">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Anterior
        </button>
        <span className="pagination__page">
          Página {page} de {totalPages}
        </span>
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Próxima
        </button>
      </div>
    </div>
  )
}
