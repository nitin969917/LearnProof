const { PrismaClient } = require('@prisma/client');

// Prevents multiple instances of Prisma Client in development/production
let prisma;
const dbUrl = process.env.DATABASE_URL || 'postgresql://user:password@db:5432/learnproof_db?connection_limit=15&pool_timeout=30';

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
        datasources: {
            db: { url: dbUrl }
        },
        log: ['error', 'warn'],
    });
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            datasources: {
                db: { url: dbUrl }
            },
            log: ['query', 'error', 'warn'],
        });
    }
    prisma = global.prisma;
}

module.exports = prisma;
