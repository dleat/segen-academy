import { useCallback, useEffect, useState } from 'react'

// Runs an async loader and tracks its result. Call reload() after a change.
export function useLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const run = useCallback(loader, deps)

  useEffect(() => {
    let alive = true
    setLoading(true)
    run()
      .then((d) => {
        if (alive) {
          setData(d)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [run, tick])

  return { data, error, loading, reload: () => setTick((n) => n + 1) }
}
