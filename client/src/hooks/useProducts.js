import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api.js';

export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useProducts(filters) {
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }, [filters]);

  const [state, setState] = useState({ products: [], pagination: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setState((current) => ({ ...current, loading: true, error: null }));

    api
      .get(`/products${queryString ? `?${queryString}` : ''}`, { signal: controller.signal })
      .then((data) => {
        if (requestRef.current !== requestId) return;
        setState({
          products: data.products,
          pagination: data.pagination,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        if (requestRef.current !== requestId) return;
        setState((current) => ({ ...current, loading: false, error: error.message }));
      });

    return () => controller.abort();
  }, [queryString, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return { ...state, reload };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/products/categories')
      .then((data) => {
        if (active) setCategories(data.categories || []);
      })
      .catch(() => {
        if (active) setCategories([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}
