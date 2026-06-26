const { PrismaClient } = require('@prisma/client');

// Prevents multiple instances of Prisma Client in development/production
let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
        log: ['error', 'warn'],
    });
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            log: ['query', 'error', 'warn'],
        });
    }
    prisma = global.prisma;
}

// Add centralized cache invalidation middleware
prisma.$use(async (params, next) => {
    const result = await next(params);
    
    if (params.model === 'UserActivityLog' && params.action === 'create') {
        const userId = params.args?.data?.userId;
        if (userId) {
            const cacheService = require('../services/cache.service');
            cacheService.del(`user:activity-graph:${userId}`).catch(() => {});
        }
    }
    return result;
});

module.exports = prisma;
