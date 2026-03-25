const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

module.exports = redis;
