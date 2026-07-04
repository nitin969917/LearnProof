const prisma = require('../src/lib/prisma');

async function main() {
  console.log('Starting manual database table creation...');

  try {
    // 1. Create AnonymousDevice table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AnonymousDevice" (
          "id" SERIAL NOT NULL,
          "token" TEXT NOT NULL,
          "deviceType" TEXT,
          "timezone" TEXT NOT NULL DEFAULT 'UTC',
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "AnonymousDevice_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Table "AnonymousDevice" created or verified.');

    // 2. Create unique index and standard index on AnonymousDevice token
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousDevice_token_key" ON "AnonymousDevice"("token");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AnonymousDevice_token_idx" ON "AnonymousDevice"("token");
    `);
    console.log('Indexes for "AnonymousDevice" created or verified.');

    // 3. Create AppLaunchLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AppLaunchLog" (
          "id" SERIAL NOT NULL,
          "deviceId" TEXT NOT NULL,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "AppLaunchLog_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Table "AppLaunchLog" created or verified.');

    // 4. Create indexes for AppLaunchLog
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AppLaunchLog_deviceId_idx" ON "AppLaunchLog"("deviceId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AppLaunchLog_timestamp_idx" ON "AppLaunchLog"("timestamp");
    `);
    console.log('Indexes for "AppLaunchLog" created or verified.');

    console.log('Manual database table creation completed successfully.');
  } catch (error) {
    console.error('Error during manual database migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
