const { execSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const dbUrl = process.env.DATABASE_URL || 'postgresql://user:password@db:5432/learnproof_db?connection_limit=15&pool_timeout=30';
const socialDbUrl = process.env.SOCIAL_DATABASE_URL || 'postgresql://user:password@db:5432/learnproof_db?connection_limit=15&pool_timeout=30';
const mysqlUrl = process.env.MYSQL_DATABASE_URL || "mysql://u529802313_Learn_platform:Nitin%40225111@srv1339.hstgr.io:3306/u529802313_Learn_platform";

async function init() {
    console.log('🚀 [DB Init] Starting automatic database verification and sync...');

    const appDir = path.join(__dirname, '..');

    // 1. Push schema.prisma
    try {
        console.log('📦 [DB Init] Pushing Prisma schemas...');
        execSync(`npx prisma db push --schema=prisma/schema.prisma --accept-data-loss`, {
            cwd: appDir,
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: dbUrl }
        });
        execSync(`npx prisma db push --schema=prisma/dating.prisma --accept-data-loss`, {
            cwd: appDir,
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: socialDbUrl }
        });
        console.log('✅ [DB Init] Prisma schemas in sync.');
    } catch (err) {
        console.error('⚠️ [DB Init] Error pushing schemas:', err.message);
    }

    const prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } }
    });

    // 2. Check if learning data is populated
    try {
        const userCount = await prisma.userProfile.count();
        console.log(`📊 [DB Init] Current UserProfile count: ${userCount}`);

        if (userCount === 0) {
            console.log('🔄 [DB Init] UserProfile is empty, importing from Hostinger MySQL...');
            try {
                const conn = await mysql.createConnection(mysqlUrl);
                const tables = [
                    { prismaName: 'userProfile', tableName: 'UserProfile' },
                    { prismaName: 'playlist', tableName: 'Playlist' },
                    { prismaName: 'video', tableName: 'Video' },
                    { prismaName: 'userActivityLog', tableName: 'UserActivityLog' },
                    { prismaName: 'videoNote', tableName: 'VideoNote' },
                    { prismaName: 'videoNoteFile', tableName: 'VideoNoteFile' },
                    { prismaName: 'videoComment', tableName: 'VideoComment' },
                    { prismaName: 'videoIntuition', tableName: 'VideoIntuition' },
                    { prismaName: 'videoQuizData', tableName: 'VideoQuizData' },
                    { prismaName: 'quiz', tableName: 'Quiz' },
                    { prismaName: 'certificate', tableName: 'Certificate' }
                ];

                for (const { prismaName, tableName } of tables) {
                    if (!prisma[prismaName]) continue;
                    try {
                        const [rows] = await conn.execute(`SELECT * FROM ${tableName}`);
                        if (rows.length > 0) {
                            const formatted = rows.map(r => {
                                const nr = { ...r };
                                for (const k in nr) {
                                    if (nr[k] instanceof Date) nr[k] = nr[k].toISOString();
                                    if (['is_completed', 'passed', 'is_combined'].includes(k)) nr[k] = !!nr[k];
                                }
                                return nr;
                            });
                            await prisma[prismaName].createMany({ data: formatted, skipDuplicates: true });
                            console.log(`✅ [DB Init] Migrated ${rows.length} rows to ${tableName}`);
                        }
                    } catch (e) {
                        console.log(`⚠️ [DB Init] Table ${tableName} query error:`, e.message);
                    }
                }
                await conn.end();
            } catch (mysqlErr) {
                console.log('⚠️ [DB Init] MySQL connection error:', mysqlErr.message);
            }
        }
    } catch (e) {
        console.error('⚠️ [DB Init] Error checking learning data:', e.message);
    }

    // 3. Migrate Social Hub data from SQLite if empty
    try {
        const { PrismaClient: PGClient } = require('../src/generated/dating-client');
        const pgSocial = new PGClient({ datasources: { db: { url: socialDbUrl } } });
        const socialCount = await pgSocial.user.count();
        console.log(`📊 [DB Init] Current social_users count: ${socialCount}`);

        if (socialCount === 0) {
            console.log('🔄 [DB Init] social_users is empty, importing from dating-dev.db...');
            try {
                execSync(`node scripts/migrate-social-to-postgres.js`, {
                    cwd: appDir,
                    stdio: 'inherit',
                    env: { ...process.env, SOCIAL_DATABASE_URL: socialDbUrl }
                });
            } catch (socialMigrateErr) {
                console.log('⚠️ [DB Init] Error running social migration:', socialMigrateErr.message);
            }
        }
        await pgSocial.$disconnect();
    } catch (e) {
        console.error('⚠️ [DB Init] Error checking social data:', e.message);
    }

    // 4. Sync social_users into UserProfile
    try {
        console.log('🔄 [DB Init] Syncing social_users into UserProfile...');
        await prisma.$executeRawUnsafe(`
            INSERT INTO "UserProfile" (uid, name, email, profile_pic, xp, level, streak_count, joined_at)
            SELECT 
                COALESCE(s."googleId", 'social_' || s.id),
                s.name,
                s.email,
                s."profilePicture",
                0,
                1,
                0,
                s."createdAt"
            FROM social_users s
            WHERE NOT EXISTS (
                SELECT 1 FROM "UserProfile" u WHERE u.email = s.email
            );
        `);
        const finalCount = await prisma.userProfile.count();
        console.log(`🎉 [DB Init] Total synchronized users in UserProfile: ${finalCount}`);
    } catch (syncErr) {
        console.error('⚠️ [DB Init] Error syncing social users to UserProfile:', syncErr.message);
    }

    // 5. Reset PostgreSQL Sequences
    try {
        await prisma.$executeRawUnsafe(`SELECT setval('"UserProfile_id_seq"', (SELECT coalesce(max(id), 1) FROM "UserProfile"));`);
        await prisma.$executeRawUnsafe(`SELECT setval('social_users_id_seq', (SELECT coalesce(max(id), 1) FROM social_users));`);
        console.log('✅ [DB Init] ID Sequences reset.');
    } catch (seqErr) {
        console.error('⚠️ [DB Init] Error resetting sequences:', seqErr.message);
    }

    await prisma.$disconnect();
    console.log('✨ [DB Init] Database initialization complete!');
}

init().catch(console.error);
