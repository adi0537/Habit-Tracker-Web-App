import { useState, useEffect, useRef } from 'react';

/**
 * useApi(key, initialValue)
 * - key: 'habits' or 'completions' (other keys supported but will use generic endpoints)
 * - returns [value, setValue] just like your useLocalStorage
 *
 * Implementation notes:
 * - On mount: fetches from /api/{key} (for 'habits' and 'completions')
 * - setValue(newVal) will send PUT /api/{key} with the whole payload so your existing mutations
 *   that call setValue([...]) or setValue({...}) will continue to work unchanged.
 *
 * If the server is unreachable it will fall back to initialValue (so nothing breaks).
 */

const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || (window && window.location && `${window.location.origin}/api`);

function endpointForKey(key) {
  if (key === 'habits') return `${API_BASE}/habits`;
  if (key === 'completions') return `${API_BASE}/completions`;
  return `${API_BASE}/${key}`;
}

export default function useApi(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const initialized = useRef(false);

  useEffect(() => {
    // fetch once
    async function fetchData() {
      try {
        const url = endpointForKey(key);
        const res = await fetch(url);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setStoredValue(data ?? initialValue);
      } catch (err) {
        console.error('useApi fetch error for', key, err);
        // fallback to initialValue
        setStoredValue(initialValue);
      } finally {
        initialized.current = true;
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = async (value) => {
    // accept function like in useState
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);

    try {
      const url = endpointForKey(key);
      // PUT full replacement for simplicity and compatibility with frontend logic
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valueToStore)
      });
    } catch (err) {
      console.error('useApi set error for', key, err);
    }
  };

  return [storedValue, setValue];
}
