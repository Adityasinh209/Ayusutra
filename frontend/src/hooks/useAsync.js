import { useState, useCallback } from 'react'

/**
 * Wraps an async function and tracks loading / error / data state.
 *
 * const { run, data, loading, error } = useAsync(someAsyncFn)
 * run(arg1, arg2)
 */
export function useAsync(asyncFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const run = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await asyncFn(...args)
        setData(result)
        return result
      } catch (err) {
        setError(err.message ?? 'Something went wrong.')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [asyncFn],
  )

  return { run, data, loading, error, setData }
}
