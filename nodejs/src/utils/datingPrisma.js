const { PrismaClient } = require('../generated/dating-client');

// Social Hub uses its own PostgreSQL connection (SOCIAL_DATABASE_URL).
// This keeps social data completely isolated from the main app's DATABASE_URL.
// The env var should point to the same PostgreSQL server but can be the same DB
// since all social tables are prefixed with 'social_' via @@map in dating.prisma.
const datingPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
});

module.exports = datingPrisma;
