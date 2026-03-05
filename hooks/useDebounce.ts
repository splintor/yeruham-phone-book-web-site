// https://dev.to/gabe_ragland/debouncing-with-react-hooks-jci
import { useState, useEffect } from 'react'

export default function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(
    () => {
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)

      return () => clearTimeout(handler)
    }, [value, delay]
  )

  return value ? debouncedValue : value
}
