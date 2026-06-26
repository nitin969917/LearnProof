#!/usr/bin/env node
/**
 * Social Hub Data Migration: SQLite → PostgreSQL
 * 
 * Run this ONCE on your production server BEFORE deploying the new Docker image.
 * It reads all data from the existing SQLite dating-dev.db and inserts it
 * into the new PostgreSQL social tables.
 * 
 * Usage:
 *   SOCIAL_DATABASE_URL="postgresql://user:password@localhost:5432/learnproof_db" \
 *   node scripts/migrate-social-to-postgres.js
 * 
 * SAFETY: This script is READ-ONLY on SQLite and INSERT-only on PostgreSQL.
 * It will NOT modify or delete any existing data. Run it as many times as needed.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { PrismaClient: SQLiteClient } = require('../src/generated/dating-client');
const { PrismaClient: PGClient } = require('../src/generated/dating-client');

// Override the datasource URL for SQLite (old) and PostgreSQL (new)
const sqliteClient = new SQLiteClient({
  datasources: {
    db: { url: `file:${path.resolve(__dirname, '../prisma/dating-dev.db')}` }
  }
});

// The PG client reads SOCIAL_DATABASE_URL from env
const pgClient = new PGClient();

async function migrate() {
  console.log('🚀 Starting Social Hub migration: SQLite → PostgreSQL\n');
  console.log('SOCIAL_DATABASE_URL:', process.env.SOCIAL_DATABASE_URL ? '✅ Set' : '❌ Missing!');
  
  if (!process.env.SOCIAL_DATABASE_URL) {
    console.error('\nERROR: Set SOCIAL_DATABASE_URL environment variable before running this script.');
    process.exit(1);
  }

  try {
    // ── 0. Create Database Schema ──────────────────────────────────────
    console.log('📋 Creating PostgreSQL social tables and indexes if they do not exist...');
    const { Client } = require('pg');
    const fs = require('fs');
    const sql = fs.readFileSync(path.join(__dirname, '../prisma/dating_schema.sql'), 'utf8');
    const schemaClient = new Client({ connectionString: process.env.SOCIAL_DATABASE_URL });
    await schemaClient.connect();
    await schemaClient.query(sql);
    await schemaClient.end();
    console.log('   ✅ Social database schema applied successfully');

    await sqliteClient.$connect();
    await pgClient.$connect();

    // ── 1. Users ───────────────────────────────────────────────────
    console.log('\n📋 Migrating users...');
    const users = await sqliteClient.user.findMany();
    console.log(`   Found ${users.length} users in SQLite`);
    
    let usersInserted = 0;
    for (const user of users) {
      try {
        await pgClient.user.upsert({
          where: { id: user.id },
          create: user,
          update: user,
        });
        usersInserted++;
      } catch (e) {
        console.warn(`   ⚠️  User ${user.id} (${user.email}): ${e.message}`);
      }
    }
    console.log(`   ✅ ${usersInserted}/${users.length} users migrated`);

    // Reset sequence so new users get correct IDs
    if (usersInserted > 0) {
      const maxId = Math.max(...users.map(u => u.id));
      await pgClient.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"social_users"', 'id'), ${maxId}, true)`);
    }

    // ── 2. Posts ───────────────────────────────────────────────────
    console.log('\n📋 Migrating posts...');
    const posts = await sqliteClient.post.findMany();
    console.log(`   Found ${posts.length} posts in SQLite`);
    
    let postsInserted = 0;
    for (const post of posts) {
      try {
        await pgClient.post.upsert({
          where: { id: post.id },
          create: post,
          update: post,
        });
        postsInserted++;
      } catch (e) {
        console.warn(`   ⚠️  Post ${post.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${postsInserted}/${posts.length} posts migrated`);

    if (postsInserted > 0) {
      const maxId = Math.max(...posts.map(p => p.id));
      await pgClient.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"social_posts"', 'id'), ${maxId}, true)`);
    }

    // ── 3. Post Likes (many-to-many) ───────────────────────────────
    console.log('\n📋 Migrating post likes...');
    const postsWithLikes = await sqliteClient.post.findMany({
      include: { likes: { select: { id: true } } }
    });
    let likesRestored = 0;
    for (const post of postsWithLikes) {
      if (post.likes.length > 0) {
        try {
          await pgClient.post.update({
            where: { id: post.id },
            data: { likes: { connect: post.likes.map(u => ({ id: u.id })) } }
          });
          likesRestored += post.likes.length;
        } catch (e) {
          console.warn(`   ⚠️  Likes for post ${post.id}: ${e.message}`);
        }
      }
    }
    console.log(`   ✅ ${likesRestored} likes migrated`);

    // ── 4. Friendships ─────────────────────────────────────────────
    console.log('\n📋 Migrating friendships...');
    const friendships = await sqliteClient.friendship.findMany();
    console.log(`   Found ${friendships.length} friendships in SQLite`);
    
    let friendsInserted = 0;
    for (const f of friendships) {
      try {
        await pgClient.friendship.upsert({
          where: { senderId_receiverId: { senderId: f.senderId, receiverId: f.receiverId } },
          create: f,
          update: f,
        });
        friendsInserted++;
      } catch (e) {
        console.warn(`   ⚠️  Friendship ${f.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${friendsInserted}/${friendships.length} friendships migrated`);

    // ── 5. Messages ────────────────────────────────────────────────
    console.log('\n📋 Migrating messages...');
    const messages = await sqliteClient.message.findMany();
    console.log(`   Found ${messages.length} messages in SQLite`);
    
    let messagesInserted = 0;
    for (const msg of messages) {
      try {
        await pgClient.message.upsert({
          where: { id: msg.id },
          create: msg,
          update: msg,
        });
        messagesInserted++;
      } catch (e) {
        console.warn(`   ⚠️  Message ${msg.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${messagesInserted}/${messages.length} messages migrated`);

    if (messagesInserted > 0) {
      const maxId = Math.max(...messages.map(m => m.id));
      await pgClient.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"social_messages"', 'id'), ${maxId}, true)`);
    }

    // ── 6. Comments ────────────────────────────────────────────────
    console.log('\n📋 Migrating comments...');
    const comments = await sqliteClient.comment.findMany();
    let commentsInserted = 0;
    for (const c of comments) {
      try {
        await pgClient.comment.upsert({ where: { id: c.id }, create: c, update: c });
        commentsInserted++;
      } catch (e) {
        console.warn(`   ⚠️  Comment ${c.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${commentsInserted}/${comments.length} comments migrated`);

    // ── 7. Crushes ─────────────────────────────────────────────────
    console.log('\n📋 Migrating crushes...');
    const crushes = await sqliteClient.crush.findMany();
    let crushesInserted = 0;
    for (const c of crushes) {
      try {
        await pgClient.crush.upsert({
          where: { userId_crushId: { userId: c.userId, crushId: c.crushId } },
          create: c, update: c
        });
        crushesInserted++;
      } catch (e) {
        console.warn(`   ⚠️  Crush ${c.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${crushesInserted}/${crushes.length} crushes migrated`);

    // ── 8. Close Friend Requests ───────────────────────────────────
    console.log('\n📋 Migrating close friend requests...');
    const cfRequests = await sqliteClient.closeFriendRequest.findMany();
    let cfInserted = 0;
    for (const r of cfRequests) {
      try {
        await pgClient.closeFriendRequest.upsert({
          where: { senderId_receiverId: { senderId: r.senderId, receiverId: r.receiverId } },
          create: r, update: r
        });
        cfInserted++;
      } catch (e) {
        console.warn(`   ⚠️  CloseFriendRequest ${r.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${cfInserted}/${cfRequests.length} close friend requests migrated`);

    // ── 9. Language Rooms ──────────────────────────────────────────
    console.log('\n📋 Migrating language rooms...');
    const rooms = await sqliteClient.languageRoom.findMany();
    let roomsInserted = 0;
    for (const r of rooms) {
      try {
        await pgClient.languageRoom.upsert({ where: { id: r.id }, create: r, update: r });
        roomsInserted++;
      } catch (e) {
        console.warn(`   ⚠️  Room ${r.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${roomsInserted}/${rooms.length} language rooms migrated`);

    // ── 10. Groups ─────────────────────────────────────────────────
    console.log('\n📋 Migrating groups...');
    const groups = await sqliteClient.group.findMany();
    let groupsInserted = 0;
    for (const g of groups) {
      try {
        await pgClient.group.upsert({ where: { id: g.id }, create: g, update: g });
        groupsInserted++;
      } catch (e) {
        console.warn(`   ⚠️  Group ${g.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${groupsInserted}/${groups.length} groups migrated`);

    // ── 11. Group Members ──────────────────────────────────────────
    console.log('\n📋 Migrating group members...');
    const members = await sqliteClient.groupMember.findMany();
    let membersInserted = 0;
    for (const m of members) {
      try {
        await pgClient.groupMember.upsert({
          where: { groupId_userId: { groupId: m.groupId, userId: m.userId } },
          create: m, update: m
        });
        membersInserted++;
      } catch (e) {
        console.warn(`   ⚠️  GroupMember ${m.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${membersInserted}/${members.length} group members migrated`);

    // ── 12. Group Messages ─────────────────────────────────────────
    console.log('\n📋 Migrating group messages...');
    const groupMsgs = await sqliteClient.groupMessage.findMany();
    let groupMsgsInserted = 0;
    for (const m of groupMsgs) {
      try {
        await pgClient.groupMessage.upsert({ where: { id: m.id }, create: m, update: m });
        groupMsgsInserted++;
      } catch (e) {
        console.warn(`   ⚠️  GroupMessage ${m.id}: ${e.message}`);
      }
    }
    console.log(`   ✅ ${groupMsgsInserted}/${groupMsgs.length} group messages migrated`);

    console.log('\n🎉 Migration complete! Social Hub data is now in PostgreSQL.');
    console.log('   You can now deploy the new Docker image safely.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sqliteClient.$disconnect();
    await pgClient.$disconnect();
  }
}

migrate();
