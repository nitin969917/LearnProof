/**
 * High-performance In-Memory SWR (Stale-While-Revalidate) Cache
 * 
 * Provides instant 0ms responses for cached data while revalidating
 * in the background. If fresh data differs or is fetched, the UI updates
 * smoothly without showing blank loading spinners.
 */

class ApiCache {
    constructor() {
        this.cache = new Map();
        this.inflight = new Map();
    }

    /**
     * Get a cached entry if it exists and hasn't expired
     * @param {string} key
     * @returns {any | null}
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }

    /**
     * Set cache entry with TTL (default: 3 minutes)
     * @param {string} key 
     * @param {any} data 
     * @param {number} ttlMs 
     */
    set(key, data, ttlMs = 180000) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs
        });
    }

    /**
     * Invalidate one key or all keys matching a regex / string pattern
     * @param {string | RegExp} pattern 
     */
    invalidate(pattern) {
        if (typeof pattern === 'string') {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else if (pattern instanceof RegExp) {
            for (const key of this.cache.keys()) {
                if (pattern.test(key)) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * Clear the entire cache
     */
    clear() {
        this.cache.clear();
        this.inflight.clear();
    }

    /**
     * Stale-While-Revalidate fetch helper
     * @param {Object} options
     * @param {string} options.key - Unique cache key
     * @param {Function} options.fetcher - Async function returning response data
     * @param {number} [options.ttlMs=180000] - Cache validity duration
     * @param {Function} options.onSuccess - Callback receiving (data, isFromCache)
     * @param {Function} [options.onError] - Callback receiving error
     */
    async fetchSWR({ key, fetcher, ttlMs = 180000, onSuccess, onError }) {
        const cachedData = this.get(key);
        let hasDeliveredCache = false;

        if (cachedData !== null && cachedData !== undefined) {
            hasDeliveredCache = true;
            try {
                onSuccess(cachedData, true);
            } catch (e) {
                console.error('Error in SWR cache delivery:', e);
            }
        }

        // Deduplicate simultaneous requests for the exact same key
        if (this.inflight.has(key)) {
            try {
                const pendingData = await this.inflight.get(key);
                if (!hasDeliveredCache) {
                    onSuccess(pendingData, false);
                }
            } catch (err) {
                if (!hasDeliveredCache && onError) onError(err);
            }
            return;
        }

        const fetchPromise = (async () => {
            try {
                const freshData = await fetcher();
                this.set(key, freshData, ttlMs);
                
                // Compare with cached data to avoid unnecessary re-renders if identical
                const isIdentical = hasDeliveredCache && JSON.stringify(cachedData) === JSON.stringify(freshData);
                if (!isIdentical) {
                    onSuccess(freshData, false);
                }
                return freshData;
            } catch (err) {
                if (!hasDeliveredCache && onError) {
                    onError(err);
                }
                throw err;
            } finally {
                this.inflight.delete(key);
            }
        })();

        this.inflight.set(key, fetchPromise);
        return fetchPromise;
    }
}

export const apiCache = new ApiCache();
export default apiCache;
