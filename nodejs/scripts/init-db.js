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

    // 1. Ensure all learning tables exist in PostgreSQL
    try {
        await createAllTables();
    } catch (err) {
        console.error('⚠️ [DB Init] Error creating tables:', err.message);
    }

    const pgClient = new Client({ connectionString: dbUrl });
    await pgClient.connect();

    // 2. Check if learning data is populated
    try {
        const userRes = await pgClient.query('SELECT count(*) FROM "UserProfile";');
        const userCount = parseInt(userRes.rows[0].count, 10);
        console.log(`📊 [DB Init] Current UserProfile count: ${userCount}`);

        if (userCount === 0) {
            console.log('🔄 [DB Init] UserProfile is empty, importing from Hostinger MySQL...');
            try {
                const conn = await mysql.createConnection(mysqlUrl);

                // 2.1 UserProfile
                try {
                    const [users] = await conn.execute('SELECT * FROM UserProfile');
                    for (const u of users) {
                        await pgClient.query(
                            `INSERT INTO "UserProfile" (id, uid, name, email, profile_pic, xp, level, streak_count, joined_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (email) DO NOTHING;`,
                            [u.id, u.uid || `user_${u.id}`, u.name, u.email, u.profile_pic, u.xp || 0, u.level || 1, u.streak_count || 0, u.joined_at || new Date()]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${users.length} users to UserProfile.`);
                } catch (e) { console.log('⚠️ [DB Init] UserProfile migration:', e.message); }

                // 2.2 Playlist
                try {
                    const [playlists] = await conn.execute('SELECT * FROM Playlist');
                    for (const p of playlists) {
                        await pgClient.query(
                            `INSERT INTO "Playlist" (id, "userId", pid, name, url, thumbnail, imported_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT ("userId", pid) DO NOTHING;`,
                            [p.id, p.userId || 1, p.pid, p.name, p.url, p.thumbnail, p.created_at || new Date()]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${playlists.length} playlists.`);
                } catch (e) { console.log('⚠️ [DB Init] Playlist migration:', e.message); }

                // 2.3 Video
                try {
                    const [videos] = await conn.execute('SELECT * FROM Video');
                    for (const v of videos) {
                        await pgClient.query(
                            `INSERT INTO "Video" (id, "userId", vid, name, url, description, "playlistId", imported_at, is_completed)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ("userId", vid) DO NOTHING;`,
                            [v.id, v.userId || 1, v.vid, v.title || v.name || 'Video', v.url || '', v.description || '', v.playlistId || null, v.created_at || new Date(), !!v.is_completed]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${videos.length} videos.`);
                } catch (e) { console.log('⚠️ [DB Init] Video migration:', e.message); }

                // 2.4 UserActivityLog
                try {
                    const [activities] = await conn.execute('SELECT * FROM UserActivityLog');
                    for (const a of activities) {
                        await pgClient.query(
                            `INSERT INTO "UserActivityLog" (id, "userId", activity_type, timestamp)
                             VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING;`,
                            [a.id, a.userId || 1, a.activity_type || 'WATCH_VIDEO', a.activity_date || a.timestamp || new Date()]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${activities.length} activity logs.`);
                } catch (e) { console.log('⚠️ [DB Init] Activity log migration:', e.message); }

                // 2.5 VideoIntuition
                try {
                    const [intuitions] = await conn.execute('SELECT * FROM VideoIntuition');
                    for (const item of intuitions) {
                        await pgClient.query(
                            `INSERT INTO "VideoIntuition" (id, vid, content, generated_at)
                             VALUES ($1, $2, $3, $4) ON CONFLICT (vid) DO NOTHING;`,
                            [item.id, item.vid || `vid_${item.videoId || item.id}`, item.data || item.content || '', item.created_at || new Date()]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${intuitions.length} intuitions.`);
                } catch (e) { console.log('⚠️ [DB Init] Intuitions migration:', e.message); }

                // 2.6 VideoQuizData
                try {
                    const [quizData] = await conn.execute('SELECT * FROM VideoQuizData');
                    for (const item of quizData) {
                        await pgClient.query(
                            `INSERT INTO "VideoQuizData" (id, vid, questions, generated_at)
                             VALUES ($1, $2, $3, $4) ON CONFLICT (vid) DO NOTHING;`,
                            [item.id, item.vid || `vid_${item.videoId || item.id}`, item.data || item.questions || '[]', item.created_at || new Date()]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${quizData.length} quiz datasets.`);
                } catch (e) { console.log('⚠️ [DB Init] Quiz data migration:', e.message); }

                // 2.7 Quiz
                try {
                    const [quizzes] = await conn.execute('SELECT * FROM Quiz');
                    for (const q of quizzes) {
                        await pgClient.query(
                            `INSERT INTO "Quiz" (id, "userId", "videoId", questions, user_answers, score, passed, is_combined, time_limit, attempted_at)
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING;`,
                            [q.id, q.userId || 1, q.videoId || null, q.questions || '', q.user_answers || '', q.score || 0, !!q.passed, !!q.is_combined, q.time_limit || 15, q.created_at || new Date()]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${quizzes.length} quizzes.`);
                } catch (e) { console.log('⚠️ [DB Init] Quiz migration:', e.message); }

                // 2.8 Certificate
                try {
                    const [certs] = await conn.execute('SELECT * FROM Certificate');
                    for (const c of certs) {
                        await pgClient.query(
                            `INSERT INTO "Certificate" (id, "userId", "playlistId", certificate_id, issued_at)
                             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (certificate_id) DO NOTHING;`,
                            [c.id, c.userId || 1, c.playlistId || null, c.certificate_id || `cert_${c.id}`, c.issued_at || new Date()]
                        );
                    }
                    console.log(`✅ [DB Init] Migrated ${certs.length} certificates.`);
                } catch (e) { console.log('⚠️ [DB Init] Certificate migration:', e.message); }

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

    // 4. Sync social_users into UserProfile
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

    // 5. Reset PostgreSQL Sequences
    try {
        const seqTables = [
            'UserProfile', 'InboxMessage', 'MessageReadStatus', 'Playlist',
            'Video', 'UserActivityLog', 'VideoNote', 'VideoNoteFile',
            'VideoComment', 'VideoIntuition', 'VideoQuizData', 'Quiz',
            'Certificate', 'AnonymousDevice', 'AppLaunchLog', 'UserFcmToken',
            'NotificationTemplate', 'SentNotification', 'SupportTicket',
            'SupportResponse', 'Workspace', 'KnowledgeSource', 'WorkspaceNote',
            'WorkspaceQuiz', 'WorkspaceQuizAttempt', 'WorkspaceFlashcard',
            'WorkspaceChatSession', 'WorkspaceChatMessage', 'social_users'
        ];

        for (const tbl of seqTables) {
            try {
                if (tbl === 'social_users') {
                    await pgClient.query(`SELECT setval('social_users_id_seq', (SELECT coalesce(max(id), 1) FROM social_users));`);
                } else {
                    await pgClient.query(`SELECT setval('"${tbl}_id_seq"', (SELECT coalesce(max(id), 1) FROM "${tbl}"));`);
                }
            } catch (sqErr) {}
        }
        console.log('✅ [DB Init] All ID Sequences successfully reset.');
    } catch (seqErr) {
        console.error('⚠️ [DB Init] Error resetting sequences:', seqErr.message);
    }

    await pgClient.end();
    console.log('✨ [DB Init] Database initialization complete!');
}

init().catch(console.error);
