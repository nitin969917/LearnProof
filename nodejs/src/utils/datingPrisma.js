const { PrismaClient } = require('../generated/dating-client');

// Social Hub uses its own PostgreSQL connection (SOCIAL_DATABASE_URL).
// This keeps social data completely isolated from the main app's DATABASE_URL.
// The env var should point to the same PostgreSQL server but can be the same DB
// since all social tables are prefixed with 'social_' via @@map in dating.prisma.
const datingPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
});

// Self-healing check for new social table columns (isPrivate & invitedUserIds)
(async () => {
  try {
    await datingPrisma.$executeRawUnsafe(`
      ALTER TABLE "social_language_rooms" 
      ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
    `);
    await datingPrisma.$executeRawUnsafe(`
      ALTER TABLE "social_language_rooms" 
      ADD COLUMN IF NOT EXISTS "invitedUserIds" TEXT DEFAULT '[]';
    `);
  } catch (err) {
    // Ignore if not supported by current dialect or already exists
  }
})();

module.exports = datingPrisma;
