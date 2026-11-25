import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

/**
 * GET helper with loading/error/refresh state and request cancellation.
 * `path` may be null to skip the request.
 */
export function useApi(path, { enabled = true } = {}) {
  const [state, setState] = useState({
    data: null,
    loading: Boolean(path && enabled),
    error: null,
  });
  const [nonce, setNonce] = useState(0);
  const lastPath = useRef(path);

  useEffect(() => {
    if (!path || !enabled) {
      setState((previous) => ({ ...previous, loading: false }));
      return undefined;
    }

    const controller = new AbortController();
    const pathChanged = lastPath.current !== path;
    lastPath.current = path;

    setState((previous) => ({
      data: pathChanged ? null : previous.data,
      loading: true,
      error: null,
    }));

    api
      .get(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setState({ data: null, loading: false, error });
      });

    return () => controller.abort();
  }, [path, enabled, nonce]);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  return { ...state, refresh };
}

/** Small helper for one-off POST actions (AI, saves, settings). */
export function useAction() {
  const [state, setState] = useState({ loading: false, error: null, data: null });

  const run = useCallback(async (fn) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await fn();
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      setState({ loading: false, error, data: null });
      throw error;
    }
  }, []);

  const reset = useCallback(() => setState({ loading: false, error: null, data: null }), []);

  return { ...state, run, reset };
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · WeatherGPT` : 'WeatherGPT';
  }, [title]);
}
