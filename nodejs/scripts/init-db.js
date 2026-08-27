const { execSync } = require('child_process');
const path = require('path');
const { Client } = require('pg');
const mysql = require('mysql2/promise');

const dbUrl = process.env.DATABASE_URL || 'postgresql://user:password@db:5432/learnproof_db?connection_limit=15&pool_timeout=30';
const socialDbUrl = process.env.SOCIAL_DATABASE_URL || 'postgresql://user:password@db:5432/learnproof_db?connection_limit=15&pool_timeout=30';
const mysqlUrl = process.env.MYSQL_DATABASE_URL || "mysql://u529802313_Learn_platform:Nitin%40225111@srv1339.hstgr.io:3306/u529802313_Learn_platform";

const { createAllTables } = require('./create-new-tables');

async function init() {
    console.log('🚀 [DB Init] Starting automatic database verification and sync...');

    const appDir = path.join(__dirname, '..');

    // 1. Ensure all tables exist in PostgreSQL
    try {
        await createAllTables();
    } catch (err) {
        console.error('⚠️ [DB Init] Error creating tables:', err.message);
    }

    // 2. Push schema.prisma & dating.prisma
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

    const pgClient = new Client({ connectionString: dbUrl });
    await pgClient.connect();

    // 3. Check if learning data is populated
    try {
        const userRes = await pgClient.query('SELECT count(*) FROM "UserProfile";');
        const userCount = parseInt(userRes.rows[0].count, 10);
        console.log(`📊 [DB Init] Current UserProfile count: ${userCount}`);

        if (userCount === 0) {
            console.log('🔄 [DB Init] UserProfile is empty, importing from Hostinger MySQL...');
            try {
                const conn = await mysql.createConnection(mysqlUrl);
                const tables = [
                    'UserProfile', 'Playlist', 'Video', 'UserActivityLog',
                    'VideoNote', 'VideoNoteFile', 'VideoComment', 'VideoIntuition',
                    'VideoQuizData', 'Quiz', 'Certificate'
                ];

                for (const tableName of tables) {
                    try {
                        const [rows] = await conn.execute(`SELECT * FROM ${tableName}`);
                        if (rows.length > 0) {
                            for (const row of rows) {
                                const keys = Object.keys(row);
                                const values = Object.values(row).map(v => {
                                    if (typeof v === 'boolean') return v;
                                    if (v instanceof Date) return v.toISOString();
                                    return v;
                                });
                                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                                const quotedKeys = keys.map(k => `"${k}"`).join(', ');
                                await pgClient.query(
                                    `INSERT INTO "${tableName}" (${quotedKeys}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`,
                                    values
                                );
                            }
                            console.log(`✅ [DB Init] Migrated ${rows.length} rows to "${tableName}"`);
                        }
                    } catch (tableErr) {
                        console.log(`⚠️ [DB Init] Table ${tableName} migration note:`, tableErr.message);
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

    // 4. Migrate Social Hub data from SQLite if empty
    try {
        const socialRes = await pgClient.query('SELECT count(*) FROM social_users;');
        const socialCount = parseInt(socialRes.rows[0].count, 10);
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
    } catch (e) {
        console.error('⚠️ [DB Init] Error checking social data:', e.message);
    }

    // 5. Sync social_users into UserProfile
    try {
        console.log('🔄 [DB Init] Syncing social_users into UserProfile...');
        await pgClient.query(`
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
        const finalRes = await pgClient.query('SELECT count(*) FROM "UserProfile";');
        console.log(`🎉 [DB Init] Total synchronized users in UserProfile: ${finalRes.rows[0].count}`);
    } catch (syncErr) {
        console.error('⚠️ [DB Init] Error syncing social users to UserProfile:', syncErr.message);
    }

    // 6. Reset PostgreSQL Sequences
    try {
        await pgClient.query(`SELECT setval('"UserProfile_id_seq"', (SELECT coalesce(max(id), 1) FROM "UserProfile"));`);
        await pgClient.query(`SELECT setval('social_users_id_seq', (SELECT coalesce(max(id), 1) FROM social_users));`);
        console.log('✅ [DB Init] ID Sequences reset.');
    } catch (seqErr) {
        console.error('⚠️ [DB Init] Error resetting sequences:', seqErr.message);
    }

    await pgClient.end();
    console.log('✨ [DB Init] Database initialization complete!');
}

init().catch(console.error);
