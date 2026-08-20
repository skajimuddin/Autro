import { useEffect, useState } from 'react'

/**
 * useDebounce — returns `value` after it has stopped changing for `delay` ms.
 *
 * Used by the vehicles list so typing a plate does not fire a request per
 * keystroke. Was an empty stub until 2026-08-20.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
