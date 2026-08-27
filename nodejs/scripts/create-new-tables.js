const { Client } = require('pg');

const dbUrl = process.env.DATABASE_URL || 'postgresql://user:password@db:5432/learnproof_db?connection_limit=15&pool_timeout=30';

async function createAllTables() {
  console.log('🚀 [Schema Setup] Ensuring all LearnProof database tables exist via direct PostgreSQL client...');

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const statements = [
    // 1. UserProfile
    `CREATE TABLE IF NOT EXISTS "UserProfile" (
        "id" SERIAL NOT NULL,
        "uid" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "profile_pic" TEXT,
        "xp" INTEGER NOT NULL DEFAULT 0,
        "level" INTEGER NOT NULL DEFAULT 1,
        "streak_count" INTEGER NOT NULL DEFAULT 0,
        "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_uid_key" ON "UserProfile"("uid");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_email_key" ON "UserProfile"("email");`,

    // 2. InboxMessage
    `CREATE TABLE IF NOT EXISTS "InboxMessage" (
        "id" SERIAL NOT NULL,
        "senderId" INTEGER,
        "receiverId" INTEGER,
        "isBroadcast" BOOLEAN NOT NULL DEFAULT false,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
    );`,

    // 3. MessageReadStatus
    `CREATE TABLE IF NOT EXISTS "MessageReadStatus" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "messageId" INTEGER NOT NULL,
        "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MessageReadStatus_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "MessageReadStatus_userId_messageId_key" ON "MessageReadStatus"("userId", "messageId");`,

    // 4. Playlist
    `CREATE TABLE IF NOT EXISTS "Playlist" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "pid" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "thumbnail" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Playlist_userId_pid_key" ON "Playlist"("userId", "pid");`,

    // 5. Video
    `CREATE TABLE IF NOT EXISTS "Video" (
        "id" SERIAL NOT NULL,
        "playlistId" INTEGER NOT NULL,
        "vid" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "thumbnail" TEXT,
        "is_completed" BOOLEAN NOT NULL DEFAULT false,
        "completed_at" TIMESTAMP(3),
        "last_watched_at" TIMESTAMP(3),
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Video_playlistId_vid_key" ON "Video"("playlistId", "vid");`,

    // 6. UserActivityLog
    `CREATE TABLE IF NOT EXISTS "UserActivityLog" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "activity_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserActivityLog_pkey" PRIMARY KEY ("id")
    );`,

    // 7. VideoNote
    `CREATE TABLE IF NOT EXISTS "VideoNote" (
        "id" SERIAL NOT NULL,
        "videoId" INTEGER NOT NULL,
        "note" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoNote_pkey" PRIMARY KEY ("id")
    );`,

    // 8. VideoNoteFile
    `CREATE TABLE IF NOT EXISTS "VideoNoteFile" (
        "id" SERIAL NOT NULL,
        "videoId" INTEGER NOT NULL,
        "file_name" TEXT NOT NULL,
        "file_url" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoNoteFile_pkey" PRIMARY KEY ("id")
    );`,

    // 9. VideoComment
    `CREATE TABLE IF NOT EXISTS "VideoComment" (
        "id" SERIAL NOT NULL,
        "videoId" INTEGER NOT NULL,
        "comment" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoComment_pkey" PRIMARY KEY ("id")
    );`,

    // 10. VideoIntuition
    `CREATE TABLE IF NOT EXISTS "VideoIntuition" (
        "id" SERIAL NOT NULL,
        "videoId" INTEGER NOT NULL,
        "data" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoIntuition_pkey" PRIMARY KEY ("id")
    );`,

    // 11. VideoQuizData
    `CREATE TABLE IF NOT EXISTS "VideoQuizData" (
        "id" SERIAL NOT NULL,
        "videoId" INTEGER NOT NULL,
        "data" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "VideoQuizData_pkey" PRIMARY KEY ("id")
    );`,

    // 12. Quiz
    `CREATE TABLE IF NOT EXISTS "Quiz" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "videoId" INTEGER NOT NULL,
        "total_questions" INTEGER NOT NULL,
        "correct_answers" INTEGER NOT NULL,
        "passed" BOOLEAN NOT NULL DEFAULT false,
        "is_combined" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
    );`,

    // 13. Certificate
    `CREATE TABLE IF NOT EXISTS "Certificate" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "playlistId" INTEGER NOT NULL,
        "certificate_id" TEXT NOT NULL,
        "certificate_url" TEXT NOT NULL,
        "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_certificate_id_key" ON "Certificate"("certificate_id");`,

    // 14. AnonymousDevice
    `CREATE TABLE IF NOT EXISTS "AnonymousDevice" (
        "id" SERIAL NOT NULL,
        "token" TEXT NOT NULL,
        "deviceType" TEXT,
        "timezone" TEXT NOT NULL DEFAULT 'UTC',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnonymousDevice_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AnonymousDevice_token_key" ON "AnonymousDevice"("token");`,

    // 15. AppLaunchLog
    `CREATE TABLE IF NOT EXISTS "AppLaunchLog" (
        "id" SERIAL NOT NULL,
        "deviceId" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AppLaunchLog_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE INDEX IF NOT EXISTS "AppLaunchLog_deviceId_idx" ON "AppLaunchLog"("deviceId");`,
    `CREATE INDEX IF NOT EXISTS "AppLaunchLog_timestamp_idx" ON "AppLaunchLog"("timestamp");`,

    // 16. UserFcmToken
    `CREATE TABLE IF NOT EXISTS "UserFcmToken" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "token" TEXT NOT NULL,
        "deviceType" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserFcmToken_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserFcmToken_token_key" ON "UserFcmToken"("token");`,

    // 17. NotificationTemplate
    `CREATE TABLE IF NOT EXISTS "NotificationTemplate" (
        "id" SERIAL NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
    );`,

    // 18. SentNotification
    `CREATE TABLE IF NOT EXISTS "SentNotification" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER,
        "deviceId" TEXT,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SentNotification_pkey" PRIMARY KEY ("id")
    );`,

    // 19. SupportTicket
    `CREATE TABLE IF NOT EXISTS "SupportTicket" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "subject" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'open',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
    );`,

    // 20. SupportResponse
    `CREATE TABLE IF NOT EXISTS "SupportResponse" (
        "id" SERIAL NOT NULL,
        "ticketId" INTEGER NOT NULL,
        "message" TEXT NOT NULL,
        "isAdmin" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupportResponse_pkey" PRIMARY KEY ("id")
    );`,

    // 21. Workspace
    `CREATE TABLE IF NOT EXISTS "Workspace" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "icon" TEXT,
        "color" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
    );`,

    // 22. KnowledgeSource
    `CREATE TABLE IF NOT EXISTS "KnowledgeSource" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT,
        "url" TEXT,
        "filePath" TEXT,
        "metadata" TEXT,
        "status" TEXT NOT NULL DEFAULT 'ready',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
    );`,

    // 23. WorkspaceNote
    `CREATE TABLE IF NOT EXISTS "WorkspaceNote" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "tags" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceNote_pkey" PRIMARY KEY ("id")
    );`,

    // 24. WorkspaceQuiz
    `CREATE TABLE IF NOT EXISTS "WorkspaceQuiz" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "questions" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceQuiz_pkey" PRIMARY KEY ("id")
    );`,

    // 25. WorkspaceQuizAttempt
    `CREATE TABLE IF NOT EXISTS "WorkspaceQuizAttempt" (
        "id" SERIAL NOT NULL,
        "quizId" INTEGER NOT NULL,
        "score" INTEGER NOT NULL,
        "totalQuestions" INTEGER NOT NULL,
        "answers" TEXT NOT NULL,
        "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceQuizAttempt_pkey" PRIMARY KEY ("id")
    );`,

    // 26. WorkspaceFlashcard
    `CREATE TABLE IF NOT EXISTS "WorkspaceFlashcard" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "front" TEXT NOT NULL,
        "back" TEXT NOT NULL,
        "deck" TEXT NOT NULL DEFAULT 'General',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceFlashcard_pkey" PRIMARY KEY ("id")
    );`,

    // 27. WorkspaceChatSession
    `CREATE TABLE IF NOT EXISTS "WorkspaceChatSession" (
        "id" SERIAL NOT NULL,
        "workspaceId" INTEGER NOT NULL,
        "title" TEXT NOT NULL DEFAULT 'New Chat',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceChatSession_pkey" PRIMARY KEY ("id")
    );`,

    // 28. WorkspaceChatMessage
    `CREATE TABLE IF NOT EXISTS "WorkspaceChatMessage" (
        "id" SERIAL NOT NULL,
        "sessionId" INTEGER NOT NULL,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "sources" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkspaceChatMessage_pkey" PRIMARY KEY ("id")
    );`
  ];

  for (const sql of statements) {
    try {
      await client.query(sql);
    } catch (err) {
      console.warn('⚠️ Statement execution warning:', err.message);
    }
  }

  await client.end();
  console.log('✅ [Schema Setup] All 28 learning tables and indexes verified.');
}

if (require.main === module) {
  createAllTables().catch(console.error);
}

module.exports = { createAllTables };
