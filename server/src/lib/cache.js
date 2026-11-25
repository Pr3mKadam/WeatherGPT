/**
 * In-memory TTL cache with request de-duplication and stale-if-error support.
 * A single Node process serves the whole app, so this is enough for a college
 * project and avoids hammering the free upstream APIs.
 */
const store = new Map();
const inFlight = new Map();
const MAX_ENTRIES = 400;

export const cacheStats = { hits: 0, misses: 0, stale: 0, deduped: 0, entries: () => store.size };

function setEntry(key, value) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, at: Date.now() });
}

/**
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<any>} producer
 */
export async function cached(key, ttlMs, producer) {
  const now = Date.now();
  const hit = store.get(key);

  if (hit && now - hit.at < ttlMs) {
    cacheStats.hits += 1;
    return hit.value;
  }

  if (inFlight.has(key)) {
    cacheStats.deduped += 1;
    return inFlight.get(key);
  }

  const promise = (async () => {
    try {
      const value = await producer();
      setEntry(key, value);
      cacheStats.misses += 1;
      return value;
    } catch (error) {
      if (hit) {
        // Upstream is down but we still have usable, slightly older data.
        cacheStats.stale += 1;
        console.warn(`[cache] serving stale value for "${key}": ${error.message}`);
        return { ...hit.value, stale: true };
      }
      throw error;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export function clearCache(prefix) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function cacheSnapshot() {
  return {
    entries: store.size,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    stale: cacheStats.stale,
    deduped: cacheStats.deduped,
  };
}
