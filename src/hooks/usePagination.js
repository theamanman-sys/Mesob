import { useState, useEffect, useCallback } from 'react'

export function usePagination(fetchFn, defaultPageSize = 10) {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn(p, defaultPageSize)
      let items = []
      let pag = null
      if (Array.isArray(result)) {
        items = result
        pag = { page: p, limit: defaultPageSize, totalItems: items.length, totalPages: 1 }
      } else if (result?.data) {
        items = Array.isArray(result.data) ? result.data : []
        pag = result.pagination || { page: p, limit: defaultPageSize, totalItems: items.length, totalPages: 1 }
      } else if (result?.pagination) {
        items = Array.isArray(result.data) ? result.data : []
        pag = result.pagination
      }
      setData(items)
      setPagination(pag)
    } catch (err) {
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fetchFn, defaultPageSize, page])

  useEffect(() => { load(page) }, [page, load])

  return { data, pagination, loading, error, page, setPage, refresh: () => load(page) }
}
