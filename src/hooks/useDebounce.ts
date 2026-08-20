import { useState, useEffect } from 'react';

/**
 * Custom hook that returns a debounced version of the provided value.
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds (default: 350ms).
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
