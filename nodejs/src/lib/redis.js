const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    // Connection pool — PM2 cluster uses 4 workers, each needs a connection
    // lazyConnect prevents blocking startup if Redis is briefly unavailable
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    commandTimeout: 2000,
    enableReadyCheck: true,
    // Keep-alive to prevent idle connection drops
    keepAlive: 5000,
    // Retry strategy: exponential backoff up to 5s
    retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
    },
});

redis.on('error', (err) => {
    console.error('Redis error:', err.message);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('ready', () => {
    console.log('Redis ready');
});

module.exports = redis;
