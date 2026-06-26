const redis = require('../lib/redis');

class CacheService {
    /**
     * Get a value from the cache
     * @param {string} key 
     * @returns {Promise<any>}
     */
    async get(key) {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Cache Get Error [${key}]:`, error);
            return null;
        }
    }

    /**
     * Set a value in the cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl - Time to live in seconds (default 3600)
     */
    async set(key, value, ttl = 3600) {
        try {
            const data = JSON.stringify(value);
            await redis.set(key, data, 'EX', ttl);
        } catch (error) {
            console.error(`Cache Set Error [${key}]:`, error);
        }
    }

    /**
     * Delete a value from the cache
     * @param {string} key 
     */
    async del(key) {
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`Cache Del Error [${key}]:`, error);
        }
    }

    /**
     * Delete multiple keys by pattern using non-blocking SCAN
     * redis.keys() is O(N) and blocks the entire Redis server — never use in production.
     * redis.scan() iterates in batches without blocking.
     * @param {string} pattern 
     */
    async delByPattern(pattern) {
        try {
            let cursor = '0';
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                if (keys.length > 0) {
                    await redis.del(keys);
                }
            } while (cursor !== '0');
        } catch (error) {
            console.error(`Cache DelPattern Error [${pattern}]:`, error);
        }
    }

    /**
     * Cache-aside helper: get from cache or compute and cache the result
     * @param {string} key
     * @param {Function} fetchFn - async function to call on cache miss
     * @param {number} ttl - TTL in seconds
     */
    async getOrSet(key, fetchFn, ttl = 3600) {
        try {
            const cached = await this.get(key);
            if (cached !== null) return cached;
            const value = await fetchFn();
            await this.set(key, value, ttl);
            return value;
        } catch (error) {
            console.error(`Cache GetOrSet Error [${key}]:`, error);
            // On cache failure, fall through to live data
            return fetchFn();
        }
    }
}

module.exports = new CacheService();
