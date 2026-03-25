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
     * Delete multiple keys by pattern
     * @param {string} pattern 
     */
    async delByPattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error(`Cache DelPattern Error [${pattern}]:`, error);
        }
    }
}

module.exports = new CacheService();
