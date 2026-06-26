-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "social_users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "bio" TEXT,
    "profilePicture" TEXT,
    "collegeName" TEXT,
    "department" TEXT,
    "yearOfStudy" TEXT,
    "phoneNumber" TEXT,
    "phoneVisibility" TEXT NOT NULL DEFAULT 'public',
    "whatsappNumber" TEXT,
    "whatsappVisibility" TEXT NOT NULL DEFAULT 'public',
    "instagramHandle" TEXT,
    "instagramVisibility" TEXT NOT NULL DEFAULT 'public',
    "facebookUrl" TEXT,
    "facebookVisibility" TEXT NOT NULL DEFAULT 'public',
    "snapchatUsername" TEXT,
    "snapchatVisibility" TEXT NOT NULL DEFAULT 'public',
    "linkedinUrl" TEXT,
    "linkedinVisibility" TEXT NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_posts" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_friendships" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isCloseFriend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,

    CONSTRAINT "social_friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_messages" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,

    CONSTRAINT "social_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "social_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_crushes" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "crushId" INTEGER NOT NULL,

    CONSTRAINT "social_crushes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_close_friend_requests" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,

    CONSTRAINT "social_close_friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_language_rooms" (
    "id" SERIAL NOT NULL,
    "roomName" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "roomType" TEXT NOT NULL DEFAULT 'group',
    "mediaType" TEXT NOT NULL DEFAULT 'audio',
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "isFriendsOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "social_language_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "entryKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "onlyAdminsCanPost" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "social_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_group_members" (
    "id" SERIAL NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "social_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_group_messages" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,

    CONSTRAINT "social_group_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostLikes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PostLikes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_users_email_key" ON "social_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "social_users_googleId_key" ON "social_users"("googleId");

-- CreateIndex
CREATE INDEX "social_users_name_idx" ON "social_users"("name");

-- CreateIndex
CREATE INDEX "social_users_collegeName_idx" ON "social_users"("collegeName");

-- CreateIndex
CREATE INDEX "social_users_department_idx" ON "social_users"("department");

-- CreateIndex
CREATE INDEX "social_posts_authorId_idx" ON "social_posts"("authorId");

-- CreateIndex
CREATE INDEX "social_posts_visibility_idx" ON "social_posts"("visibility");

-- CreateIndex
CREATE INDEX "social_posts_createdAt_idx" ON "social_posts"("createdAt");

-- CreateIndex
CREATE INDEX "social_friendships_senderId_idx" ON "social_friendships"("senderId");

-- CreateIndex
CREATE INDEX "social_friendships_receiverId_idx" ON "social_friendships"("receiverId");

-- CreateIndex
CREATE INDEX "social_friendships_status_idx" ON "social_friendships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_friendships_senderId_receiverId_key" ON "social_friendships"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "social_messages_senderId_idx" ON "social_messages"("senderId");

-- CreateIndex
CREATE INDEX "social_messages_receiverId_idx" ON "social_messages"("receiverId");

-- CreateIndex
CREATE INDEX "social_messages_createdAt_idx" ON "social_messages"("createdAt");

-- CreateIndex
CREATE INDEX "social_comments_postId_idx" ON "social_comments"("postId");

-- CreateIndex
CREATE INDEX "social_comments_authorId_idx" ON "social_comments"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "social_crushes_userId_crushId_key" ON "social_crushes"("userId", "crushId");

-- CreateIndex
CREATE UNIQUE INDEX "social_close_friend_requests_senderId_receiverId_key" ON "social_close_friend_requests"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "social_language_rooms_roomName_key" ON "social_language_rooms"("roomName");

-- CreateIndex
CREATE UNIQUE INDEX "social_groups_name_key" ON "social_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "social_group_members_groupId_userId_key" ON "social_group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "_PostLikes_B_index" ON "_PostLikes"("B");

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_friendships" ADD CONSTRAINT "social_friendships_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_friendships" ADD CONSTRAINT "social_friendships_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_messages" ADD CONSTRAINT "social_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_messages" ADD CONSTRAINT "social_messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_crushes" ADD CONSTRAINT "social_crushes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_crushes" ADD CONSTRAINT "social_crushes_crushId_fkey" FOREIGN KEY ("crushId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_close_friend_requests" ADD CONSTRAINT "social_close_friend_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_close_friend_requests" ADD CONSTRAINT "social_close_friend_requests_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_language_rooms" ADD CONSTRAINT "social_language_rooms_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_groups" ADD CONSTRAINT "social_groups_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_group_members" ADD CONSTRAINT "social_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "social_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_group_members" ADD CONSTRAINT "social_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_group_messages" ADD CONSTRAINT "social_group_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "social_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_group_messages" ADD CONSTRAINT "social_group_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "social_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostLikes" ADD CONSTRAINT "_PostLikes_A_fkey" FOREIGN KEY ("A") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostLikes" ADD CONSTRAINT "_PostLikes_B_fkey" FOREIGN KEY ("B") REFERENCES "social_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

