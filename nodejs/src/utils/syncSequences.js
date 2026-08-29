const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://user:password@db:5432/learnproof_db';

/**
 * Ensures all PostgreSQL ID sequences match the true MAX(id) across all tables.
 * Prevents "Unique constraint failed on the fields: (id)" in high-concurrency environments.
 */
async function syncAllSequences() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();

    const tables = [
      'social_messages',
      'social_users',
      'social_posts',
      'social_friendships',
      'social_comments',
      'social_crushes',
      'social_close_friend_requests',
      'social_language_rooms',
      'social_groups',
      'social_group_members',
      'social_group_messages',
      'UserProfile',
      'Playlist',
      'Video',
      'Quiz',
      'Certificate',
      'UserActivityLog',
      'VideoNote',
      'VideoNoteFile',
      'VideoComment',
      'VideoIntuition',
      'VideoQuizData',
      'Workspace',
      'KnowledgeSource',
      'WorkspaceNote',
      'WorkspaceQuiz',
      'WorkspaceQuizAttempt',
      'WorkspaceFlashcard',
      'WorkspaceChatSession',
      'WorkspaceChatMessage',
      'InboxMessage',
      'MessageReadStatus',
      'AnonymousDevice',
      'AppLaunchLog',
      'UserFcmToken',
      'NotificationTemplate',
      'SentNotification',
      'SupportTicket',
      'SupportResponse'
    ];

    for (const tbl of tables) {
      try {
        const maxRes = await client.query(`SELECT coalesce(max(id), 0) as max_id FROM "${tbl}";`);
        const maxVal = Math.max(parseInt(maxRes.rows[0]?.max_id || 0, 10), 1);

        const seqRes = await client.query(`SELECT pg_get_serial_sequence('"${tbl}"', 'id') as seq;`);
        const seqName = seqRes.rows[0]?.seq;

        if (seqName) {
          await client.query(`SELECT setval('${seqName}', ${maxVal}, true);`);
        }
      } catch (err) {
        // Suppress warning if table is not in this schema
      }
    }
  } catch (error) {
    console.error('[DB Sequence Sync] Error checking sequences:', error.message);
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
}

module.exports = { syncAllSequences };
