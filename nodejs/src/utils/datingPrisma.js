const { PrismaClient } = require('../generated/dating-client');

// Social Hub uses its own PostgreSQL connection (SOCIAL_DATABASE_URL).
// This keeps social data completely isolated from the main app's DATABASE_URL.
// The env var should point to the same PostgreSQL server but can be the same DB
// since all social tables are prefixed with 'social_' via @@map in dating.prisma.
const datingPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
});

// Self-healing check for new social table columns (isPrivate, invitedUserIds, scheduledFor, isStartedNotificationSent)
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
    await datingPrisma.$executeRawUnsafe(`
      ALTER TABLE "social_language_rooms" 
      ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP WITH TIME ZONE;
    `);
    await datingPrisma.$executeRawUnsafe(`
      ALTER TABLE "social_language_rooms" 
      ADD COLUMN IF NOT EXISTS "isStartedNotificationSent" BOOLEAN NOT NULL DEFAULT false;
    `);
    await datingPrisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "social_reports" (
        "id" SERIAL PRIMARY KEY,
        "targetType" VARCHAR(50) NOT NULL DEFAULT 'post',
        "targetId" VARCHAR(100) NOT NULL,
        "reason" VARCHAR(255) NOT NULL,
        "details" TEXT,
        "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
        "reporterId" VARCHAR(100),
        "reporterEmail" VARCHAR(255),
        "actionTaken" VARCHAR(100),
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "resolvedBy" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await datingPrisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_social_reports_status" ON "social_reports"("status");
    `);
    await datingPrisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_social_reports_target" ON "social_reports"("targetType", "targetId");
    `);
    await datingPrisma.$executeRawUnsafe(`
      ALTER TABLE "social_groups" 
      ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
    `);
    await datingPrisma.$executeRawUnsafe(`
      ALTER TABLE "social_group_members" 
      ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) NOT NULL DEFAULT 'member';
    `);
    // Performance indexes for instant chat history lookups (WhatsApp/Telegram style queries)
    await datingPrisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_social_messages_pair_created" 
      ON "social_messages" ("senderId", "receiverId", "createdAt" DESC);
    `);
    await datingPrisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_social_messages_rev_pair_created" 
      ON "social_messages" ("receiverId", "senderId", "createdAt" DESC);
    `);
    await datingPrisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_social_messages_unread_pair" 
      ON "social_messages" ("receiverId", "senderId", "isRead");
    `);
    await datingPrisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_social_group_messages_group_created" 
      ON "social_group_messages" ("groupId", "createdAt" DESC);
    `);
  } catch (err) {
    // Ignore if not supported by current dialect or already exists
  }
})();

module.exports = datingPrisma;
