const datingPrisma = require('../utils/datingPrisma');
const { sendPushNotification } = require('../utils/pushNotifier');
const livekitService = require('../services/livekit.service');
const cacheService = require('../services/cache.service');
const redis = require('../lib/redis');
const { ensureUniversalImage, saveBase64Image } = require('../utils/imageUtils');

const delayedDeletions = new Map();

const cancelDelayedRoomDeletion = (roomName) => {
  if (delayedDeletions.has(roomName)) {
    clearTimeout(delayedDeletions.get(roomName));
    delayedDeletions.delete(roomName);
    console.log(`[Dating] Cancelled delayed database deletion for room: ${roomName}`);
  }
};

const invalidateFeedCache = async () => {
  try {
    await cacheService.delByPattern('user:feed:*');
  } catch (err) {
    console.error('Failed to invalidate feed cache:', err);
  }
};

const invalidateRoomsCache = async () => {
  try {
    await cacheService.delByPattern('user:live-rooms:*');
  } catch (err) {
    console.error('Failed to invalidate rooms cache:', err);
  }
};

const invalidateFriendshipsCache = async () => {
  try {
    await cacheService.delByPattern('user:friendships:*');
  } catch (err) {
    console.error('Failed to invalidate friendships cache:', err);
  }
};

const invalidateGroupsCache = async () => {
  try {
    await cacheService.delByPattern('user:groups:*');
  } catch (err) {
    console.error('Failed to invalidate groups cache:', err);
  }
};

const checkIsMainAdmin = (user) => {
  if (!user || !user.email) return false;
  const envAdminEmails = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const defaultAdminList = [
    'nitin9699176009@gmail.com',
    'kakadeavishkar84@gmail.com'
  ];
  const allowedAdmins = new Set([...envAdminEmails, ...defaultAdminList]);
  const userEmail = (user.email || '').trim().toLowerCase();
  return allowedAdmins.has(userEmail) || userEmail.endsWith('@learnproofai.com');
};

const invalidateProfileCache = async (userId, email) => {
  try {
    await Promise.all([
      cacheService.delByPattern('user:profile:*'),
      // Also clear the auth middleware cache so profile updates are reflected immediately
      email ? cacheService.del(`social:user:email:${email}`) : cacheService.delByPattern('social:user:email:*'),
    ]);
  } catch (err) {
    console.error('Failed to invalidate profile cache:', err);
  }
};

/**
 * Safely resolves user identifier (numeric DB ID, 'me'/'self', Google UID, or email)
 * to PostgreSQL integer ID without crashing on 32-bit integer overflow.
 */
const resolveUserId = async (param, defaultId = null) => {
  if (!param || param === 'me' || param === 'self') {
    return defaultId;
  }
  const strParam = String(param).trim();
  const num = parseInt(strParam, 10);
  if (!isNaN(num) && num > 0 && num < 2147483647 && String(num) === strParam) {
    return num;
  }
  try {
    const found = await datingPrisma.user.findFirst({
      where: {
        OR: [
          { googleId: strParam },
          { email: { equals: strParam, mode: 'insensitive' } }
        ]
      },
      select: { id: true }
    });
    return found ? found.id : null;
  } catch (err) {
    console.error('[resolveUserId] Lookup error:', err.message);
    return null;
  }
};


// ==========================================
// POST CONTROLLERS
// ==========================================

const createPost = async (req, res) => {
  let { content, image, visibility, tags } = req.body;
  const authorId = req.user.id;

  // Format and append tags cleanly if provided as an array
  if (Array.isArray(tags) && tags.length > 0) {
    const formattedTags = tags
      .map(t => typeof t === 'string' ? t.trim() : '')
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const existingTags = new Set(((content || '').match(/#[a-zA-Z0-9_]+/g) || []).map(t => t.toLowerCase()));
    const missingTags = formattedTags.filter(t => !existingTags.has(t.toLowerCase()));
    if (missingTags.length > 0) {
      content = content ? `${content.trim()}\n\n${missingTags.join(' ')}` : missingTags.join(' ');
    }
  }

  // Ensure image is transcoded and saved as high-speed static file in media volume
  if (image && typeof image === 'string') {
    try {
      image = await saveBase64Image(image, 'social/posts');
    } catch (imgErr) {
      console.warn('Image processing warning in createPost:', imgErr.message);
    }
  }

  try {
    const post = await datingPrisma.post.create({
      data: {
        content: content || '',
        image,
        visibility: visibility || 'public',
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        likes: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Broadcast new post to friends via WebSockets
    try {
      const friendships = await datingPrisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [
            { senderId: authorId },
            { receiverId: authorId }
          ]
        }
      });

      const friendIds = friendships.map(f => f.senderId === authorId ? f.receiverId : f.senderId);
      const io = req.app.get('io');

      if (io) {
        if (post.visibility === 'public') {
          // Public post: broadcast in real-time to all connected users across the platform
          io.emit('NEW_POST', post);
        } else if (post.visibility === 'close_friends') {
          // Emit to author and close friends
          io.to(authorId.toString()).emit('NEW_POST', post);
          const myCloseFriends = await datingPrisma.closeFriendRequest.findMany({
            where: {
              senderId: authorId,
              status: 'accepted'
            },
            select: { receiverId: true }
          });
          myCloseFriends.forEach(cf => {
            io.to(cf.receiverId.toString()).emit('NEW_POST', post);
          });
        } else {
          // friends only: emit to author and accepted friends
          io.to(authorId.toString()).emit('NEW_POST', post);
          friendIds.forEach(friendId => {
            io.to(friendId.toString()).emit('NEW_POST', post);
          });
        }
      }
    } catch (wsError) {
      console.error('Failed to broadcast new post via socket:', wsError);
    }

    // Persist and count any hashtags used in the post so all users can discover and use them
    try {
      const extractedTags = (post.content.match(/#([a-zA-Z0-9_]+)/g) || [])
        .map(t => t.replace(/^#/, '').trim())
        .filter(Boolean);

      if (extractedTags.length > 0) {
        for (const tag of extractedTags) {
          try {
            await datingPrisma.$executeRawUnsafe(`
              INSERT INTO "social_tags" ("name", "postCount", "updatedAt")
              VALUES ($1, 1, NOW())
              ON CONFLICT ("name")
              DO UPDATE SET "postCount" = "social_tags"."postCount" + 1, "updatedAt" = NOW();
            `, tag);
          } catch (tErr) {
            // Table might still be initializing or unique collision
          }
        }
        await cacheService.delByPattern('social:tags:*');
      }
    } catch (tagStoreErr) {
      console.error('Error tracking post hashtags:', tagStoreErr);
    }

    await invalidateFeedCache();
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

const getTags = async (req, res) => {
  try {
    const search = req.query.q ? req.query.q.trim().toLowerCase() : null;
    const cacheKey = `social:tags:${search || 'all'}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    let tags = [];
    try {
      if (search) {
        tags = await datingPrisma.$queryRawUnsafe(`
          SELECT "name", "postCount" 
          FROM "social_tags" 
          WHERE LOWER("name") LIKE $1 
          ORDER BY "postCount" DESC, "updatedAt" DESC 
          LIMIT 30;
        `, `%${search}%`);
      } else {
        tags = await datingPrisma.$queryRawUnsafe(`
          SELECT "name", "postCount" 
          FROM "social_tags" 
          ORDER BY "postCount" DESC, "updatedAt" DESC 
          LIMIT 60;
        `);
      }
    } catch (dbErr) {
      tags = [
        { name: 'LeetCodeDSA', postCount: 5 },
        { name: 'SystemDesign', postCount: 4 },
        { name: 'ReactNodeJS', postCount: 4 },
        { name: 'OperatingSystems', postCount: 3 },
        { name: 'DockerDeploy', postCount: 3 },
        { name: 'CampusHackathon', postCount: 2 },
        { name: 'WebDev', postCount: 2 },
        { name: 'Python', postCount: 2 }
      ];
    }

    await cacheService.set(cacheKey, tags, 300);
    res.json(tags);
  } catch (error) {
    console.error('Failed to get tags', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

const getFeed = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 0;
  const tag = req.query.tag ? req.query.tag.trim() : null;

  try {
    let targetAuthorId = null;
    if (req.query.authorId) {
      targetAuthorId = await resolveUserId(req.query.authorId, userId);
    }

    const cacheKey = `user:feed:${userId}:${limit}:${page}:${targetAuthorId || 'all'}:${tag ? encodeURIComponent(tag) : 'all'}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // 1. Fetch accepted friendships to identify who are friends
    const friendships = await datingPrisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    const friendIds = friendships.map(f => f.senderId === userId ? f.receiverId : f.senderId);
    
    // Identify close friends: those who have marked current user as close friend
    const closeFriendRecords = await datingPrisma.closeFriendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'accepted'
      },
      select: { senderId: true }
    });
    const closeFriendIds = closeFriendRecords.map(cf => cf.senderId);

    let whereClause;
    if (targetAuthorId) {
      if (targetAuthorId === userId) {
        // Viewing own profile: see all own posts regardless of visibility
        whereClause = { authorId: userId };
      } else {
        // Viewing another user's profile: strictly only their posts based on friendship level
        const isFriend = friendIds.includes(targetAuthorId);
        const isCloseFriend = closeFriendIds.includes(targetAuthorId);
        let allowedVisibilities = ['public'];
        if (isCloseFriend) {
          allowedVisibilities = ['public', 'friends', 'close_friends'];
        } else if (isFriend) {
          allowedVisibilities = ['public', 'friends'];
        }
        whereClause = {
          authorId: targetAuthorId,
          visibility: { in: allowedVisibilities }
        };
      }
    } else {
      // General main feed: mix of own posts, public posts, and friends/close friends posts
      whereClause = {
        OR: [
          // Author's own posts
          { authorId: userId },
          // Public posts
          { visibility: 'public' },
          // Friends posts (if author is a friend)
          {
            visibility: 'friends',
            authorId: { in: friendIds }
          },
          // Close friends posts (if author is a close friend)
          {
            visibility: 'close_friends',
            authorId: { in: closeFriendIds }
          }
        ]
      };
    }

    // Apply tag filter if requested (matches #tag or tag name)
    if (tag) {
      const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
      const rawTag = tag.replace(/^#/, '');
      const tagCondition = {
        OR: [
          { content: { contains: cleanTag, mode: 'insensitive' } },
          { content: { contains: `#${rawTag}`, mode: 'insensitive' } },
          { content: { contains: rawTag, mode: 'insensitive' } }
        ]
      };
      whereClause = {
        AND: [
          whereClause,
          tagCondition
        ]
      };
    }

    // 2. Query posts based on visibility permissions
    const posts = await datingPrisma.post.findMany({
      where: whereClause,
      take: limit,
      skip: page * limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        likes: {
          where: { id: userId },
          select: {
            id: true,
          },
        },
        savedBy: {
          where: { id: userId },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    await cacheService.set(cacheKey, posts, 1800); // Cache for 30 minutes

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const numPostId = parseInt(postId);

  try {
    const post = await datingPrisma.post.findUnique({
      where: { id: numPostId },
      include: {
        likes: { select: { id: true } },
        _count: { select: { likes: true } }
      },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isLiked = post.likes.some((user) => user.id === userId);

    await datingPrisma.post.update({
      where: { id: numPostId },
      data: {
        likes: isLiked
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } },
      },
    });

    const updatedPost = await datingPrisma.post.findUnique({
      where: { id: numPostId },
      select: {
        _count: { select: { likes: true } }
      }
    });

    const newLikesCount = updatedPost?._count?.likes ?? (isLiked ? Math.max(0, post._count.likes - 1) : post._count.likes + 1);

    // Broadcast like update in real-time to all connected users
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('POST_LIKE_UPDATED', {
          postId: numPostId,
          userId: userId,
          isLiked: !isLiked,
          likesCount: newLikesCount
        });
      }
    } catch (wsErr) {
      console.error('Failed to emit like update socket:', wsErr);
    }

    res.json({ liked: !isLiked, likesCount: newLikesCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

const getLikedPosts = async (req, res) => {
  const userId = req.user.id;
  const targetParam = req.params.userId;
  const targetUserId = (!targetParam || targetParam === 'me')
    ? userId
    : parseInt(targetParam, 10);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Determine permissions / friendship for visibility
    const friendRecords = await datingPrisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' }
        ]
      }
    });
    const friendIds = friendRecords.map(f => f.senderId === userId ? f.receiverId : f.senderId);

    const closeFriendRecords = await datingPrisma.closeFriendRequest.findMany({
      where: { receiverId: userId }
    });
    const closeFriendIds = closeFriendRecords.map(cf => cf.senderId);

    const visibilityCondition = {
      OR: [
        { authorId: userId },
        { visibility: 'public' },
        { visibility: 'friends', authorId: { in: friendIds } },
        { visibility: 'close_friends', authorId: { in: closeFriendIds } }
      ]
    };

    const posts = await datingPrisma.post.findMany({
      where: {
        AND: [
          {
            likes: {
              some: { id: targetUserId }
            }
          },
          visibilityCondition
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        likes: {
          where: { id: userId },
          select: {
            id: true,
          },
        },
        savedBy: {
          where: { id: userId },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(posts);
  } catch (error) {
    console.error('Failed to fetch liked posts:', error);
    res.status(500).json({ error: 'Failed to fetch liked posts' });
  }
};

const getCommentedPosts = async (req, res) => {
  const userId = req.user.id;
  const targetParam = req.params.userId;
  const targetUserId = (!targetParam || targetParam === 'me')
    ? userId
    : parseInt(targetParam, 10);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const friendRecords = await datingPrisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' }
        ]
      }
    });
    const friendIds = friendRecords.map(f => f.senderId === userId ? f.receiverId : f.senderId);

    const closeFriendRecords = await datingPrisma.closeFriendRequest.findMany({
      where: { receiverId: userId }
    });
    const closeFriendIds = closeFriendRecords.map(cf => cf.senderId);

    const visibilityCondition = {
      OR: [
        { authorId: userId },
        { visibility: 'public' },
        { visibility: 'friends', authorId: { in: friendIds } },
        { visibility: 'close_friends', authorId: { in: closeFriendIds } }
      ]
    };

    const posts = await datingPrisma.post.findMany({
      where: {
        AND: [
          {
            comments: {
              some: { authorId: targetUserId }
            }
          },
          visibilityCondition
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        likes: {
          where: { id: userId },
          select: { id: true },
        },
        savedBy: {
          where: { id: userId },
          select: { id: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(posts);
  } catch (error) {
    console.error('Failed to fetch commented posts:', error);
    res.status(500).json({ error: 'Failed to fetch commented posts' });
  }
};

const getSavedPosts = async (req, res) => {
  const userId = req.user.id;
  const targetParam = req.params.userId;
  const targetUserId = (!targetParam || targetParam === 'me')
    ? userId
    : parseInt(targetParam, 10);

  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const friendRecords = await datingPrisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'accepted' },
          { receiverId: userId, status: 'accepted' }
        ]
      }
    });
    const friendIds = friendRecords.map(f => f.senderId === userId ? f.receiverId : f.senderId);

    const closeFriendRecords = await datingPrisma.closeFriendRequest.findMany({
      where: { receiverId: userId }
    });
    const closeFriendIds = closeFriendRecords.map(cf => cf.senderId);

    const visibilityCondition = {
      OR: [
        { authorId: userId },
        { visibility: 'public' },
        { visibility: 'friends', authorId: { in: friendIds } },
        { visibility: 'close_friends', authorId: { in: closeFriendIds } }
      ]
    };

    const posts = await datingPrisma.post.findMany({
      where: {
        AND: [
          {
            savedBy: {
              some: { id: targetUserId }
            }
          },
          visibilityCondition
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        likes: {
          where: { id: userId },
          select: { id: true },
        },
        savedBy: {
          where: { id: userId },
          select: { id: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(posts);
  } catch (error) {
    console.error('Failed to fetch saved posts:', error);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
};

const getActivityCounts = async (req, res) => {
  const userId = req.user.id;
  try {
    const [likedCount, commentedCount, savedCount] = await Promise.all([
      datingPrisma.post.count({
        where: { likes: { some: { id: userId } } }
      }),
      datingPrisma.post.count({
        where: { comments: { some: { authorId: userId } } }
      }),
      datingPrisma.post.count({
        where: { savedBy: { some: { id: userId } } }
      })
    ]);

    res.json({
      likedCount,
      commentedCount,
      savedCount,
      totalCount: likedCount + commentedCount + savedCount
    });
  } catch (error) {
    console.error('Failed to fetch activity counts:', error);
    res.status(500).json({ error: 'Failed to fetch activity counts' });
  }
};

const savePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  const numPostId = parseInt(postId, 10);

  try {
    const post = await datingPrisma.post.findUnique({
      where: { id: numPostId },
      include: {
        savedBy: { select: { id: true } }
      },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isSaved = (post.savedBy || []).some((user) => user.id === userId);

    await datingPrisma.post.update({
      where: { id: numPostId },
      data: {
        savedBy: isSaved
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } },
      },
    });

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('POST_SAVE_UPDATED', {
          postId: numPostId,
          userId,
          isSaved: !isSaved
        });
      }
    } catch (wsErr) {
      console.error('Failed to emit save update socket:', wsErr);
    }

    res.json({ saved: !isSaved });
  } catch (error) {
    console.error('Failed to toggle save post:', error);
    res.status(500).json({ error: 'Failed to toggle save post' });
  }
};

const updatePost = async (req, res) => {
  const { postId } = req.params;
  const { content, visibility } = req.body;
  const userId = req.user.id;

  try {
    const post = await datingPrisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const updatedPost = await datingPrisma.post.update({
      where: { id: parseInt(postId) },
      data: { content, visibility },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        likes: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    await invalidateFeedCache();

    // Broadcast updated post to all connected clients
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('POST_UPDATED', updatedPost);
      }
    } catch (wsErr) {
      console.error('Failed to emit post update socket:', wsErr);
    }

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

const deletePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await datingPrisma.post.findUnique({
      where: { id: parseInt(postId) },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== userId) return res.status(403).json({ error: 'Forbidden' });

    // Clean up connections first (Prisma SQLite disconnects automatically for implicit m-n, but let's delete post)
    // 1. Delete all comments on this post first to satisfy database foreign keys
    await datingPrisma.comment.deleteMany({
      where: { postId: parseInt(postId) },
    });

    // 2. Now delete the post itself
    await datingPrisma.post.delete({
      where: { id: parseInt(postId) },
    });

    await invalidateFeedCache();

    // Broadcast deleted post
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('POST_DELETED', { postId: parseInt(postId) });
      }
    } catch (wsErr) {
      console.error('Failed to emit post delete socket:', wsErr);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// ==========================================
// USER PROFILE CONTROLLERS
// ==========================================

const getProfile = async (req, res) => {
  const { userId: profileIdParam } = req.params;
  const currentUserId = req.user.id;

  try {
    const targetUserId = await resolveUserId(profileIdParam, currentUserId);
    if (!targetUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cacheKey = `user:profile:${currentUserId}:${targetUserId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const profileUser = await datingPrisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!profileUser) return res.status(404).json({ error: 'User not found' });

     let isFriend = false;
    let isCloseFriend = false;
    let isMyCloseFriend = false;
    let hasPendingRequest = false;
    let isRequestSender = false;
    if (currentUserId !== profileUser.id) {
      const friendship = await datingPrisma.friendship.findFirst({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: profileUser.id },
            { senderId: profileUser.id, receiverId: currentUserId }
          ]
        }
      });

      if (friendship) {
        isFriend = friendship.status === 'accepted';
        hasPendingRequest = friendship.status === 'pending';
        isRequestSender = friendship.senderId === currentUserId;

        // Check if profile owner has marked viewer as close friend
        const closeFriendRecord = await datingPrisma.closeFriendRequest.findFirst({
          where: {
            senderId: profileUser.id,
            receiverId: currentUserId,
            status: 'accepted'
          }
        });
        isCloseFriend = !!closeFriendRecord;

        // Check if viewer has marked profile owner as close friend
        const myCloseFriendRecord = await datingPrisma.closeFriendRequest.findFirst({
          where: {
            senderId: currentUserId,
            receiverId: profileUser.id,
            status: 'accepted'
          }
        });
        isMyCloseFriend = !!myCloseFriendRecord;
      }
    }

    if (currentUserId !== profileUser.id) {
      // Filter sensitive info based on relationship settings (email private by default)
      const contactFields = [
        { key: 'email', visibility: profileUser.emailVisibility || 'private' },
        { key: 'phoneNumber', visibility: profileUser.phoneVisibility },
        { key: 'whatsappNumber', visibility: profileUser.whatsappVisibility },
        { key: 'instagramHandle', visibility: profileUser.instagramVisibility },
        { key: 'facebookUrl', visibility: profileUser.facebookVisibility },
        { key: 'snapchatUsername', visibility: profileUser.snapchatVisibility },
        { key: 'linkedinUrl', visibility: profileUser.linkedinVisibility }
      ];

      contactFields.forEach(field => {
        if (field.visibility === 'private' || !field.visibility) {
          profileUser[field.key] = null;
        } else if (field.visibility === 'friends') {
          if (!isFriend && !isCloseFriend) profileUser[field.key] = null;
        } else if (field.visibility === 'close_friends') {
          if (!isCloseFriend) profileUser[field.key] = null;
        }
      });
    }

    const result = {
      ...profileUser,
      isFriend,
      isCloseFriend,
      isMyCloseFriend,
      hasPendingRequest,
      isRequestSender,
      password: null,
    };

    await cacheService.set(cacheKey, result, 60); // Cache for 60 seconds

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  const data = req.body;

  try {
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;

    const pic = data.profilePicture !== undefined ? data.profilePicture : data.avatar;
    if (pic !== undefined) {
      updateData.profilePicture = pic ? await saveBase64Image(pic, 'social/avatars') : null;
    }

    if (data.bio !== undefined) {
      let bioVal = data.bio || '';
      const bioWords = bioVal.trim().split(/\s+/).filter(Boolean);
      if (bioWords.length > 50) {
        bioVal = bioWords.slice(0, 50).join(' ');
      }
      updateData.bio = bioVal;
    }

    if (data.collegeName !== undefined) updateData.collegeName = data.collegeName;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.yearOfStudy !== undefined) updateData.yearOfStudy = data.yearOfStudy;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.phoneVisibility !== undefined) updateData.phoneVisibility = data.phoneVisibility;
    if (data.emailVisibility !== undefined) updateData.emailVisibility = data.emailVisibility;
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber;
    if (data.whatsappVisibility !== undefined) updateData.whatsappVisibility = data.whatsappVisibility;
    if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle;
    if (data.instagramVisibility !== undefined) updateData.instagramVisibility = data.instagramVisibility;
    if (data.facebookUrl !== undefined) updateData.facebookUrl = data.facebookUrl;
    if (data.facebookVisibility !== undefined) updateData.facebookVisibility = data.facebookVisibility;
    if (data.snapchatUsername !== undefined) updateData.snapchatUsername = data.snapchatUsername;
    if (data.snapchatVisibility !== undefined) updateData.snapchatVisibility = data.snapchatVisibility;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.linkedinVisibility !== undefined) updateData.linkedinVisibility = data.linkedinVisibility;
    if (data.coverImage !== undefined) {
      updateData.coverImage = data.coverImage ? await saveBase64Image(data.coverImage, 'social/covers') : null;
    }

    const updatedUser = await datingPrisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await invalidateProfileCache(userId, userEmail); // Clear cached profiles for this user
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchUsers = async (req, res) => {
  const { q } = req.query;
  const userId = req.user.id;

  if (!q || typeof q !== 'string' || q.trim().length < 2) return res.json([]);

  const trimmed = q.trim();

  try {
    const users = await datingPrisma.user.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: 'insensitive' } },
          { collegeName: { contains: trimmed, mode: 'insensitive' } },
          { department: { contains: trimmed, mode: 'insensitive' } },
        ],
        NOT: { id: userId },
      },
      select: {
        id: true,
        name: true,
        profilePicture: true,
        collegeName: true,
        department: true,
      },
      take: 10,
    });

    // Query friendships involving the current user and found users to return connection state
    const userIds = users.map(u => u.id);
    const friendships = await datingPrisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: userIds } },
          { senderId: { in: userIds }, receiverId: userId }
        ]
      }
    });

    const usersWithFriendship = users.map(u => {
      const friendship = friendships.find(f => 
        (f.senderId === userId && f.receiverId === u.id) ||
        (f.senderId === u.id && f.receiverId === userId)
      );

      return {
        ...u,
        friendshipStatus: friendship ? friendship.status : null,
        isFriendshipSender: friendship ? friendship.senderId === userId : false,
      };
    });

    res.json(usersWithFriendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSuggestedUsers = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 8;

  try {
    // 1. Get existing accepted friendships to avoid suggesting already connected friends
    const existingFriendships = await datingPrisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    const connectedUserIds = existingFriendships
      .filter(f => f.status === 'accepted')
      .map(f => f.senderId === userId ? f.receiverId : f.senderId);

    const excludeIds = [userId, ...connectedUserIds];

    // 2. Fetch suggested users excluding self and connected friends
    let suggested = await datingPrisma.user.findMany({
      where: {
        id: { notIn: excludeIds }
      },
      select: {
        id: true,
        name: true,
        profilePicture: true,
        collegeName: true,
        department: true,
        bio: true,
        createdAt: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fallback: If not enough users, include other users excluding only self
    if (suggested.length < limit) {
      const remaining = limit - suggested.length;
      const alreadyFetchedIds = [userId, ...suggested.map(u => u.id)];
      const fallbackUsers = await datingPrisma.user.findMany({
        where: {
          id: { notIn: alreadyFetchedIds }
        },
        select: {
          id: true,
          name: true,
          profilePicture: true,
          collegeName: true,
          department: true,
          bio: true,
          createdAt: true,
        },
        take: remaining,
        orderBy: {
          createdAt: 'desc'
        }
      });
      suggested = [...suggested, ...fallbackUsers];
    }

    // 3. Attach friendship status for each user
    const suggestedIds = suggested.map(u => u.id);
    const relevantFriendships = await datingPrisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: suggestedIds } },
          { senderId: { in: suggestedIds }, receiverId: userId }
        ]
      }
    });

    const suggestedWithStatus = suggested.map(u => {
      const friendship = relevantFriendships.find(f => 
        (f.senderId === userId && f.receiverId === u.id) ||
        (f.senderId === u.id && f.receiverId === userId)
      );

      return {
        ...u,
        friendshipStatus: friendship ? friendship.status : null,
        isFriendshipSender: friendship ? friendship.senderId === userId : false,
      };
    });

    res.json(suggestedWithStatus);
  } catch (error) {
    console.error('Failed to get suggested users:', error);
    res.status(500).json({ error: 'Failed to fetch suggested users' });
  }
};

// ==========================================
// SOCIAL CONTROLLERS
// ==========================================

const sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;
  const rId = parseInt(receiverId);

  if (senderId === rId) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }

  try {
    // 1. Check if a record already exists in either direction
    const existing = await datingPrisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId: rId },
          { senderId: rId, receiverId: senderId }
        ]
      }
    });

    let friendship;
    if (existing) {
      // If it exists, update it to pending with current user as sender
      friendship = await datingPrisma.friendship.update({
        where: { id: existing.id },
        data: {
          senderId,
          receiverId: rId,
          status: 'pending'
        },
        include: {
          sender: {
            select: { id: true, name: true, profilePicture: true, collegeName: true, department: true }
          }
        }
      });
    } else {
      // Otherwise, create a new record
      friendship = await datingPrisma.friendship.create({
        data: {
          senderId,
          receiverId: rId,
          status: 'pending',
        },
        include: {
          sender: {
            select: { id: true, name: true, profilePicture: true, collegeName: true, department: true }
          }
        }
      });
    }

    // Bust cache so the changes are reflected in real-time
    await invalidateFriendshipsCache();
    await invalidateProfileCache();

    // Notify receiver via WebSocket so their Friends badge updates in real-time
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = {
          requestId: friendship.id,
          sender: friendship.sender,
        };
        io.to(rId.toString()).emit('FRIEND_REQUEST_RECEIVED', payload);
        io.to(`user_${rId}`).emit('FRIEND_REQUEST_RECEIVED', payload);
      }
    } catch (wsErr) {
      console.error('Failed to emit FRIEND_REQUEST_RECEIVED:', wsErr);
    }

    // Send push notification to receiver
    try {
      sendPushNotification(
        [rId],
        `${req.user.name || 'Someone'} sent you a connection request!`,
        friendship.sender?.collegeName
          ? `${friendship.sender.collegeName} • Tap to view request`
          : 'Tap to view and respond on LearnProof.',
        {
          type: 'FRIEND_REQUEST_RECEIVED',
          requestId: friendship.id,
          senderId: senderId,
          url: '/dashboard/social?tab=friends&sub=pending',
          clickAction: '/dashboard/social?tab=friends&sub=pending'
        }
      );
    } catch (pnErr) {
      console.error('Failed to send friend request push notification:', pnErr);
    }

    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
};


const acceptFriendRequest = async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;

  try {
    const request = await datingPrisma.friendship.findUnique({
      where: { id: parseInt(requestId) },
    });

    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.receiverId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const friendship = await datingPrisma.friendship.update({
      where: { id: parseInt(requestId) },
      data: { status: 'accepted' },
    });

    await invalidateFeedCache();
    await invalidateRoomsCache();
    await invalidateFriendshipsCache();
    await invalidateProfileCache();

    // Notify both sender and receiver via WebSocket so their connections list & status update in real-time
    try {
      const io = req.app.get('io');
      if (io) {
        const payloadForSender = {
          requestId: friendship.id,
          userId: userId,
          targetUserId: userId,
          friend: {
            id: req.user.id,
            name: req.user.name,
            profilePicture: req.user.profilePicture,
            collegeName: req.user.collegeName || '',
            department: req.user.department || ''
          }
        };
        // Notify sender that receiver accepted
        io.to(request.senderId.toString()).emit('FRIEND_REQUEST_ACCEPTED', payloadForSender);
        io.to(`user_${request.senderId}`).emit('FRIEND_REQUEST_ACCEPTED', payloadForSender);

        const payloadForReceiver = {
          requestId: friendship.id,
          userId: request.senderId,
          targetUserId: request.senderId,
          friend: {
            id: request.senderId,
          }
        };
        // Notify receiver in case they have multiple tabs/windows open
        io.to(request.receiverId.toString()).emit('FRIEND_REQUEST_ACCEPTED', payloadForReceiver);
        io.to(`user_${request.receiverId}`).emit('FRIEND_REQUEST_ACCEPTED', payloadForReceiver);
      }
    } catch (wsErr) {
      console.error('Failed to emit FRIEND_REQUEST_ACCEPTED:', wsErr);
    }

    // Send push notification to the original sender
    try {
      sendPushNotification(
        [request.senderId],
        `${req.user.name || 'A user'} accepted your connection request!`,
        'You are now connected on LearnProof. Tap to view their profile or chat.',
        {
          type: 'FRIEND_REQUEST_ACCEPTED',
          requestId: friendship.id,
          userId: userId,
          url: '/dashboard/social?tab=friends'
        }
      );
    } catch (pnErr) {
      console.error('Failed to send friend accepted push notification:', pnErr);
    }

    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to accept' });
  }
};

const acceptFriendship = async (req, res) => {
  const { targetUserId } = req.body;
  const userId = req.user.id;

  try {
    const request = await datingPrisma.friendship.findFirst({
      where: {
        senderId: parseInt(targetUserId),
        receiverId: userId,
        status: 'pending',
      },
    });

    if (!request) return res.status(404).json({ error: 'Friend request not found' });

    const friendship = await datingPrisma.friendship.update({
      where: { id: request.id },
      data: { status: 'accepted' },
    });

    await invalidateFeedCache();
    await invalidateRoomsCache();
    await invalidateFriendshipsCache();
    await invalidateProfileCache();

    // Notify both sender and receiver via WebSocket so their connections list & status update in real-time
    try {
      const io = req.app.get('io');
      if (io) {
        const payloadForSender = {
          requestId: friendship.id,
          userId: userId,
          targetUserId: userId,
          friend: {
            id: req.user.id,
            name: req.user.name,
            profilePicture: req.user.profilePicture,
            collegeName: req.user.collegeName || '',
            department: req.user.department || ''
          }
        };
        io.to(request.senderId.toString()).emit('FRIEND_REQUEST_ACCEPTED', payloadForSender);
        io.to(`user_${request.senderId}`).emit('FRIEND_REQUEST_ACCEPTED', payloadForSender);

        const payloadForReceiver = {
          requestId: friendship.id,
          userId: request.senderId,
          targetUserId: request.senderId,
          friend: {
            id: request.senderId,
          }
        };
        io.to(request.receiverId.toString()).emit('FRIEND_REQUEST_ACCEPTED', payloadForReceiver);
        io.to(`user_${request.receiverId}`).emit('FRIEND_REQUEST_ACCEPTED', payloadForReceiver);
      }
    } catch (wsErr) {
      console.error('Failed to emit FRIEND_REQUEST_ACCEPTED:', wsErr);
    }

    // Send push notification to the original sender
    try {
      sendPushNotification(
        [request.senderId],
        `${req.user.name || 'A user'} accepted your connection request!`,
        'You are now connected on LearnProof. Tap to view their profile or chat.',
        {
          type: 'FRIEND_REQUEST_ACCEPTED',
          requestId: friendship.id,
          userId: userId,
          url: '/dashboard/social?tab=friends'
        }
      );
    } catch (pnErr) {
      console.error('Failed to send friend accepted push notification:', pnErr);
    }

    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to accept friendship' });
  }
};

const removeFriendship = async (req, res) => {
  const { targetUserId } = req.body;
  const userId = req.user.id;

  try {
    const resolvedTargetId = await resolveUserId(targetUserId, null);
    if (!resolvedTargetId) return res.status(404).json({ error: 'Target user not found' });

    const friendship = await datingPrisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: resolvedTargetId },
          { senderId: resolvedTargetId, receiverId: userId }
        ]
      }
    });

    if (!friendship) return res.status(404).json({ error: 'Friendship not found' });

    await datingPrisma.friendship.delete({
      where: { id: friendship.id },
    });

    await datingPrisma.closeFriendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: resolvedTargetId },
          { senderId: resolvedTargetId, receiverId: userId }
        ]
      }
    });

    await invalidateFeedCache();
    await invalidateRoomsCache();
    await invalidateFriendshipsCache();
    await invalidateProfileCache();

    // Notify target user via WebSocket so their friend list updates in real-time
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = { userId: userId };
        io.to(resolvedTargetId.toString()).emit('FRIEND_REQUEST_REMOVED', payload);
        io.to(`user_${resolvedTargetId}`).emit('FRIEND_REQUEST_REMOVED', payload);
      }
    } catch (wsErr) {
      console.error('Failed to emit FRIEND_REQUEST_REMOVED:', wsErr);
    }

    res.json({ message: 'Friendship removed' });
  } catch (error) {
    console.error(error);
    res.status(555).json({ error: 'Failed to remove friendship' });
  }
};

const toggleCloseFriend = async (req, res) => {
  const { friendId } = req.body;
  const userId = req.user.id;

  try {
    const friendship = await datingPrisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId, receiverId: parseInt(friendId) },
          { senderId: parseInt(friendId), receiverId: userId }
        ]
      }
    });

    if (!friendship) return res.status(404).json({ error: 'Accepted friendship not found' });

    const existingCloseFriend = await datingPrisma.closeFriendRequest.findFirst({
      where: {
        senderId: userId,
        receiverId: parseInt(friendId),
        status: 'accepted'
      }
    });

    let isCloseFriend = false;
    if (existingCloseFriend) {
      await datingPrisma.closeFriendRequest.delete({
        where: { id: existingCloseFriend.id }
      });
    } else {
      await datingPrisma.closeFriendRequest.create({
        data: {
          senderId: userId,
          receiverId: parseInt(friendId),
          status: 'accepted'
        }
      });
      isCloseFriend = true;
    }

    await invalidateFeedCache();
    await invalidateRoomsCache();
    await invalidateFriendshipsCache();
    await invalidateProfileCache();
    res.json({ isCloseFriend });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle close friend status' });
  }
};

const getFriendships = async (req, res) => {
  const userId = req.user.id;

  try {
    const cacheKey = `user:friendships:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const friendships = await datingPrisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, profilePicture: true, email: true, collegeName: true, department: true, yearOfStudy: true },
        },
        receiver: {
          select: { id: true, name: true, profilePicture: true, email: true, collegeName: true, department: true, yearOfStudy: true },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch blocked users (both blocked by user, and users who blocked user)
    let blockedUserIds = new Set();
    try {
      const blockedRecords = await datingPrisma.blockedUser.findMany({
        where: {
          OR: [
            { userId: Number(userId) },
            { blockedUserId: Number(userId) }
          ]
        },
        select: { userId: true, blockedUserId: true }
      });
      blockedRecords.forEach(b => {
        if (Number(b.userId) === Number(userId)) blockedUserIds.add(Number(b.blockedUserId));
        if (Number(b.blockedUserId) === Number(userId)) blockedUserIds.add(Number(b.userId));
      });
    } catch (bErr) {
      console.warn('Blocked users fetch in getFriendships warning:', bErr.message);
    }

    // Also consult Redis cache for blocked users as defensive fallback
    try {
      const cachedBlocked = await cacheService.get(`user:${userId}:blocked`);
      if (Array.isArray(cachedBlocked)) {
        cachedBlocked.forEach(id => blockedUserIds.add(Number(id)));
      }
    } catch (rErr) {}

    const acceptedFriendships = friendships.filter(f => f.status === 'accepted');

    // Deduplicate accepted friends by user ID and exclude blocked users
    const friendsMap = new Map();
    acceptedFriendships.forEach(f => {
      const friend = Number(f.senderId) === Number(userId) ? f.receiver : f.sender;
      if (friend && !friendsMap.has(Number(friend.id)) && !blockedUserIds.has(Number(friend.id))) {
        friendsMap.set(Number(friend.id), {
          id: friend.id,
          name: friend.name,
          email: friend.email,
          collegeName: friend.collegeName,
          department: friend.department,
          yearOfStudy: friend.yearOfStudy,
          profilePicture: friend.profilePicture,
          friendshipId: f.id,
          isCloseFriend: false,
          lastMessage: null,
          createdAt: f.createdAt,
        });
      }
    });

    const friendIds = Array.from(friendsMap.keys());

    // ── Batch last-message fetch (1 query instead of N) ──────────────────────
    let lastMessageMap = new Map();
    if (friendIds.length > 0) {
      try {
        const rawMessages = await datingPrisma.$queryRaw`
          SELECT DISTINCT ON (
            LEAST("senderId", "receiverId"),
            GREATEST("senderId", "receiverId")
          )
            id, content, "senderId", "receiverId", "isRead", "createdAt"
          FROM "social_messages"
          WHERE
            ("senderId" = ${userId} AND "receiverId" = ANY(${friendIds}::int[]))
            OR
            ("receiverId" = ${userId} AND "senderId" = ANY(${friendIds}::int[]))
          ORDER BY
            LEAST("senderId", "receiverId"),
            GREATEST("senderId", "receiverId"),
            "createdAt" DESC
        `;
        rawMessages.forEach(msg => {
          const friendId = msg.senderId === userId ? msg.receiverId : msg.senderId;
          lastMessageMap.set(Number(friendId), msg);
        });
      } catch (rawErr) {
        console.error('Last message batch query failed:', rawErr.message);
      }
    }

    const myCloseFriends = await datingPrisma.closeFriendRequest.findMany({
      where: {
        senderId: userId,
        status: 'accepted'
      },
      select: { receiverId: true }
    });
    const myCloseFriendIds = new Set(myCloseFriends.map(cf => cf.receiverId));

    // Finalize friends list with closeFriend & lastMessage metadata
    const friends = Array.from(friendsMap.values()).map(friend => ({
      ...friend,
      isCloseFriend: myCloseFriendIds.has(friend.id),
      lastMessage: lastMessageMap.get(friend.id) || null,
    }));

    // Deduplicate pending requests by senderId and exclude blocked users
    const pendingMap = new Map();
    friendships
      .filter(f => f.status === 'pending' && Number(f.receiverId) === Number(userId) && !blockedUserIds.has(Number(f.senderId)))
      .forEach(req => {
        if (!pendingMap.has(Number(req.senderId))) {
          pendingMap.set(Number(req.senderId), req);
        }
      });
    const pending = Array.from(pendingMap.values());

    const result = { friends, pending };
    await cacheService.set(cacheKey, result, 30); // Cache for 30 seconds

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch friendships' });
  }
};




const getPendingFriendCount = async (req, res) => {
  const userId = req.user.id;
  try {
    const count = await datingPrisma.friendship.count({
      where: {
        receiverId: userId,
        status: 'pending',
      }
    });
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending count' });
  }
};

// ==========================================
// MESSAGE CONTROLLERS
// ==========================================

const getMessages = async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user.id;
  // Pagination: default to last 50 messages, load older on scroll
  const page = parseInt(req.query.page) || 0;
  const PAGE_SIZE = 50;

  try {
    const resolvedTargetId = await resolveUserId(targetUserId, null);
    if (!resolvedTargetId) {
      return res.json([]);
    }

    const messages = await datingPrisma.message.findMany({
      where: {
        isDeleted: false,
        OR: [
          { senderId: userId, receiverId: resolvedTargetId },
          { senderId: resolvedTargetId, receiverId: userId }
        ]
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        isDeleted: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }, // newest first for pagination
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    });

    // Mark messages as read (non-blocking — don't await)
    datingPrisma.message.updateMany({
      where: {
        senderId: resolvedTargetId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    }).then(() => {
      // Invalidate unread cache after marking read
      cacheService.del(`user:unread:${userId}`);
    }).catch(() => {});

    // Return in chronological order (oldest first)
    res.json(messages.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const getUnreadCounts = async (req, res) => {
  const userId = req.user.id;

  try {
    // Cache unread counts — this is called on every Social Dashboard load
    const cacheKey = `user:unread:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const unread = await datingPrisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false,
        isDeleted: false,
      },
      _count: {
        senderId: true,
      },
    });

    const counts = {};
    unread.forEach((item) => {
      counts[item.senderId] = item._count.senderId;
    });

    await cacheService.set(cacheKey, counts, 10); // 10 second cache
    res.json(counts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
};

// ==========================================
// LANGUAGE ROOM CONTROLLERS
// ==========================================

const createLanguageRoom = async (req, res) => {
  const { roomName, topic, language, roomType, mediaType, maxParticipants, isFriendsOnly, isPrivate, invitedUserIds, scheduledFor } = req.body;
  const creatorId = req.user.id;

  try {
    if (!roomName || !language) {
      return res.status(400).json({ error: 'Room name and language are required' });
    }

    // Auto-generate clean unique roomName
    const baseSlug = roomName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40);

    let uniqueRoomName = baseSlug;
    let isUnique = false;
    let attempts = 0;

    const existingExact = await datingPrisma.languageRoom.findUnique({
      where: { roomName: uniqueRoomName },
    });

    if (!existingExact) {
      isUnique = true;
    }

    while (!isUnique && attempts < 5) {
      const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      uniqueRoomName = `${baseSlug}-${suffix}`;
      
      const checkRoom = await datingPrisma.languageRoom.findUnique({
        where: { roomName: uniqueRoomName },
      });
      
      if (!checkRoom) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      uniqueRoomName = `${baseSlug}-${Date.now()}`;
    }

    const finalRoomType = roomType || 'group';
    let finalMaxParticipants = parseInt(maxParticipants) || 10;
    if (finalRoomType === '1-on-1') {
      finalMaxParticipants = 2;
    }

    const finalIsPrivate = !!isPrivate;
    const finalIsFriendsOnly = finalIsPrivate ? false : !!isFriendsOnly;

    // Parse scheduled date if provided
    let parsedScheduledFor = null;
    let isScheduledRoom = false;
    if (scheduledFor) {
      const d = new Date(scheduledFor);
      if (!isNaN(d.getTime()) && d > new Date()) {
        parsedScheduledFor = d;
        isScheduledRoom = true;
      }
    }

    // Normalize invitedUserIds
    let invitedIds = [];
    if (invitedUserIds) {
      if (Array.isArray(invitedUserIds)) {
        invitedIds = invitedUserIds.map(Number).filter(n => !isNaN(n) && n !== creatorId);
      } else if (typeof invitedUserIds === 'string') {
        try {
          const parsed = JSON.parse(invitedUserIds);
          if (Array.isArray(parsed)) {
            invitedIds = parsed.map(Number).filter(n => !isNaN(n) && n !== creatorId);
          }
        } catch (e) {}
      }
    }

    const room = await datingPrisma.languageRoom.create({
      data: {
        roomName: uniqueRoomName,
        topic: topic || 'General Discussion',
        language,
        creatorId,
        roomType: finalRoomType,
        mediaType: mediaType || 'audio',
        maxParticipants: finalMaxParticipants,
        isFriendsOnly: finalIsFriendsOnly,
        isPrivate: finalIsPrivate,
        invitedUserIds: JSON.stringify(invitedIds),
        scheduledFor: parsedScheduledFor,
        isStartedNotificationSent: !isScheduledRoom, // if not scheduled, mark starting notifications as processed after immediate dispatch
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Ensure clean state for whiteboard, chat, and room settings for this room
    try {
      await redis.del(`live_room:wb:${uniqueRoomName}`);
      await redis.del(`live_room:chat:${uniqueRoomName}`);
      await redis.del(`live_room:settings:${uniqueRoomName}`);
      const initialWb = { isOpen: false, elements: [], mode: 'speakers', allowedIds: [] };
      await redis.set(`live_room:wb:${uniqueRoomName}`, JSON.stringify(initialWb), 'EX', 86400);
      const initialSettings = { allowWhiteboard: false, allowScreenShare: false };
      await redis.set(`live_room:settings:${uniqueRoomName}`, JSON.stringify(initialSettings), 'EX', 86400);
    } catch (redisErr) {
      console.error('[LiveRoom] Error resetting Redis state for room:', redisErr.message);
    }

    const creatorName = room.creator?.name || 'A friend';
    const formattedLanguage = room.language || 'English';
    const topicText = room.topic || 'General Discussion';
    const mediaTypeLabel = (mediaType || 'audio') === 'video' ? 'video' : 'audio';

    const formatScheduleText = (dateObj) => {
      try {
        return dateObj.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch {
        return 'soon';
      }
    };

    if (finalIsPrivate) {
      // Send invitations specifically to selected friends (if any were invited)
      if (invitedIds.length > 0) {
        try {
          const title = isScheduledRoom
            ? `📅 Private ${mediaTypeLabel.toUpperCase()} Room Scheduled`
            : `${creatorName} invited you to a private live room`;
          const body = isScheduledRoom
            ? `${creatorName} scheduled "${topicText}" (${formattedLanguage}) for ${formatScheduleText(parsedScheduledFor)}. Tap to view.`
            : `Join the private room "${topicText}" in ${formattedLanguage} now!`;

          sendPushNotification(
            invitedIds,
            title,
            body,
            { 
              type: isScheduledRoom ? 'LIVE_ROOM_SCHEDULED' : 'LIVE_ROOM_INVITATION', 
              roomName: room.roomName,
              scheduledFor: parsedScheduledFor ? parsedScheduledFor.toISOString() : null
            }
          );

          const io = req.app.get('io');
          if (io) {
            const creatorAvatar = room.creator?.profilePicture || null;
            invitedIds.forEach(targetId => {
              const payload = {
                roomName: room.roomName,
                creatorId: room.creatorId,
                creatorName,
                creatorAvatar,
                topic: room.topic,
                language: room.language,
                mediaType: room.mediaType,
                scheduledFor: parsedScheduledFor,
                isPrivate: true,
              };
              io.to(targetId.toString()).emit(isScheduledRoom ? 'ROOM_SCHEDULED' : 'ROOM_INVITATION', payload);
              io.to(`user_${targetId}`).emit(isScheduledRoom ? 'ROOM_SCHEDULED' : 'ROOM_INVITATION', payload);
            });
          }
        } catch (pushErr) {
          console.error('Error sending private room invite notification:', pushErr.message);
        }
      }
    } else {
      // Send push notification to creator's friends for public or friends-only rooms
      try {
        const friendships = await datingPrisma.friendship.findMany({
          where: {
            status: 'accepted',
            OR: [
              { senderId: creatorId },
              { receiverId: creatorId }
            ]
          }
        });
        const friendIds = friendships.map(f => f.senderId === creatorId ? f.receiverId : f.senderId);
        
        if (friendIds.length > 0) {
          const roomLabel = finalIsFriendsOnly ? 'Friends-only' : 'Live';
          const title = isScheduledRoom
            ? `📅 ${creatorName} scheduled a ${roomLabel} ${mediaTypeLabel.toUpperCase()} Room`
            : `${creatorName} started a ${roomLabel.toLowerCase()} room`;
          const body = isScheduledRoom
            ? `"${topicText}" (${formattedLanguage}) is scheduled for ${formatScheduleText(parsedScheduledFor)}. Mark your calendar!`
            : `Join the live room "${topicText}" in ${formattedLanguage} to discuss together!`;

          sendPushNotification(
            friendIds,
            title,
            body,
            { 
              type: isScheduledRoom ? 'LIVE_ROOM_SCHEDULED' : 'LIVE_ROOM_CREATED', 
              roomName: room.roomName,
              scheduledFor: parsedScheduledFor ? parsedScheduledFor.toISOString() : null
            }
          );

          const io = req.app.get('io');
          if (io) {
            const creatorAvatar = room.creator?.profilePicture || null;
            const payload = {
              roomName: room.roomName,
              creatorId: room.creatorId,
              creatorName,
              creatorAvatar,
              topic: room.topic,
              language: room.language,
              mediaType: room.mediaType,
              scheduledFor: parsedScheduledFor,
              isFriendsOnly: finalIsFriendsOnly,
            };

            friendIds.forEach(targetId => {
              io.to(targetId.toString()).emit(isScheduledRoom ? 'ROOM_SCHEDULED' : 'ROOM_CREATED', payload);
              io.to(`user_${targetId}`).emit(isScheduledRoom ? 'ROOM_SCHEDULED' : 'ROOM_CREATED', payload);
            });

            // If it is a public room starting live, broadcast to all connected users
            if (!finalIsFriendsOnly && !finalIsPrivate && !isScheduledRoom) {
              io.emit('ROOM_CREATED', payload);
            }
          }
        }
      } catch (pushErr) {
        console.error('Error sending room push notification to friends:', pushErr.message);
      }
    }

    await invalidateRoomsCache();
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('ROOMS_UPDATED');
      }
    } catch (ioErr) {
      console.error('Socket emit failed for room creation:', ioErr.message);
    }
    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

const sendRoomStartedNotification = async (room, io) => {
  if (!room || room.isStartedNotificationSent) return;
  try {
    let fullRoom = room;
    if (!room.creator && room.id) {
      try {
        const loaded = await datingPrisma.languageRoom.findUnique({
          where: { id: room.id },
          include: {
            creator: {
              select: { id: true, name: true, profilePicture: true }
            }
          }
        });
        if (loaded) fullRoom = loaded;
      } catch (_) {}
    }

    const creatorName = fullRoom.creator?.name || 'A friend';
    const creatorAvatar = fullRoom.creator?.profilePicture || null;
    const formattedLanguage = fullRoom.language || 'English';
    const topicText = fullRoom.topic || 'General Discussion';
    const mediaTypeLabel = (fullRoom.mediaType || 'audio') === 'video' ? 'Video' : 'Audio';
    const isPrivate = fullRoom.isPrivate;
    const isFriendsOnly = fullRoom.isFriendsOnly;

    if (isPrivate) {
      let invitedIds = [];
      try {
        const parsed = JSON.parse(fullRoom.invitedUserIds || '[]');
        if (Array.isArray(parsed)) invitedIds = parsed.map(Number).filter(n => !isNaN(n) && n !== fullRoom.creatorId);
      } catch (e) {}

      if (invitedIds.length > 0) {
        sendPushNotification(
          invitedIds,
          `🔴 Private ${mediaTypeLabel} Room Starting Now!`,
          `${creatorName}'s scheduled room "${topicText}" in ${formattedLanguage} is live now. Tap to join!`,
          { type: 'LIVE_ROOM_STARTED', roomName: fullRoom.roomName }
        );

        if (io) {
          const payload = {
            roomName: fullRoom.roomName,
            creatorId: fullRoom.creatorId,
            creatorName,
            creatorAvatar,
            topic: fullRoom.topic,
            language: fullRoom.language,
            mediaType: fullRoom.mediaType,
            isPrivate: true,
          };
          invitedIds.forEach(targetId => {
            io.to(targetId.toString()).emit('ROOM_STARTED', payload);
            io.to(`user_${targetId}`).emit('ROOM_STARTED', payload);
          });
        }
      }
    } else {
      // Friends-only or Public room
      const friendships = await datingPrisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [
            { senderId: fullRoom.creatorId },
            { receiverId: fullRoom.creatorId }
          ]
        }
      });
      const friendIds = friendships.map(f => f.senderId === fullRoom.creatorId ? f.receiverId : f.senderId);

      if (friendIds.length > 0) {
        const roomTypeLabel = isFriendsOnly ? 'Friends-only' : 'Live';
        sendPushNotification(
          friendIds,
          `🔴 ${roomTypeLabel} ${mediaTypeLabel} Room Starting Now!`,
          `${creatorName}'s scheduled room "${topicText}" in ${formattedLanguage} is live now. Tap to join!`,
          { type: 'LIVE_ROOM_STARTED', roomName: fullRoom.roomName }
        );

        if (io) {
          const payload = {
            roomName: fullRoom.roomName,
            creatorId: fullRoom.creatorId,
            creatorName,
            creatorAvatar,
            topic: fullRoom.topic,
            language: fullRoom.language,
            mediaType: fullRoom.mediaType,
            isFriendsOnly: isFriendsOnly,
          };
          friendIds.forEach(targetId => {
            io.to(targetId.toString()).emit('ROOM_STARTED', payload);
            io.to(`user_${targetId}`).emit('ROOM_STARTED', payload);
          });
          if (!isFriendsOnly && !isPrivate) {
            io.emit('ROOM_STARTED', payload);
          }
        }
      }
    }

    await datingPrisma.languageRoom.update({
      where: { id: room.id },
      data: { isStartedNotificationSent: true }
    });

    await invalidateRoomsCache();
    if (io) {
      io.emit('ROOMS_UPDATED');
    }
    console.log(`[Scheduled Rooms] Sent start notification for room: ${room.roomName}`);
  } catch (err) {
    console.error(`Failed to send room started notification for ${room?.roomName}:`, err);
  }
};

const checkScheduledRoomsToStart = async (io) => {
  try {
    const now = new Date();
    const dueRooms = await datingPrisma.languageRoom.findMany({
      where: {
        scheduledFor: {
          lte: now,
        },
        isStartedNotificationSent: false,
      },
      include: {
        creator: {
          select: { id: true, name: true, profilePicture: true }
        }
      }
    });

    for (const room of dueRooms) {
      await sendRoomStartedNotification(room, io);
    }
  } catch (err) {
    console.error('Error checking scheduled rooms to start:', err);
  }
};

const deleteLanguageRoom = async (req, res) => {
  const { id } = req.params;
  const creatorId = req.user.id;

  try {
    const room = await datingPrisma.languageRoom.findUnique({
      where: { id: parseInt(id) },
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.creatorId !== creatorId) return res.status(403).json({ error: 'Forbidden' });

    await datingPrisma.languageRoom.delete({
      where: { id: parseInt(id) },
    });

    if (room && room.roomName) {
      try {
        await redis.del(`live_room:wb:${room.roomName}`);
        await redis.del(`live_room:chat:${room.roomName}`);
        await redis.del(`live_room:settings:${room.roomName}`);
      } catch (_) {}
    }

    await invalidateRoomsCache();
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('ROOMS_UPDATED');
      }
    } catch (ioErr) {
      console.error('Socket emit failed for room deletion:', ioErr.message);
    }
    res.json({ message: 'Room ended successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};

const deleteLanguageRoomByName = async (req, res) => {
  const { roomName } = req.params;
  const creatorId = req.user.id;
  const source = req.query.source;

  try {
    const room = await datingPrisma.languageRoom.findUnique({
      where: { roomName },
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.creatorId !== creatorId) return res.status(403).json({ error: 'Forbidden' });

    if (source === 'unload') {
      // Never delete rooms on browser unload/refresh events
      return res.json({ message: 'Unload deletion ignored to prevent premature room termination' });
    }

    // Normal direct end (from explicit UI action)
    if (delayedDeletions.has(roomName)) {
      clearTimeout(delayedDeletions.get(roomName));
      delayedDeletions.delete(roomName);
    }

    await datingPrisma.languageRoom.delete({
      where: { roomName },
    });

    try {
      await redis.del(`live_room:wb:${roomName}`);
      await redis.del(`live_room:chat:${roomName}`);
      await redis.del(`live_room:settings:${roomName}`);
    } catch (_) {}

    await invalidateRoomsCache();
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`live_room_${roomName}`).emit('room_ended');
        io.emit('ROOMS_UPDATED');
      }
    } catch (ioErr) {
      console.error('Socket emit failed for room deletion by name:', ioErr.message);
    }
    res.json({ message: 'Room ended successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};

const refreshRoomsInBackground = async (userId, cacheKey) => {
  try {
    let activeLkRoomNames = [];
    try {
      const lkRooms = await livekitService.listRooms();
      activeLkRoomNames = Array.isArray(lkRooms) ? lkRooms.map(r => r.name) : [];
    } catch (lkErr) {
      console.error('Failed to list LiveKit rooms in background:', lkErr);
    }

    const friendships = await datingPrisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    const friendIds = friendships.map((f) => 
      f.senderId === userId ? f.receiverId : f.senderId
    );

    const rooms = await datingPrisma.languageRoom.findMany({
      where: {
        NOT: {
          roomName: {
            startsWith: 'privatecall-'
          }
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [
        { scheduledFor: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const now = new Date();
    const validRooms = [];

    for (const room of rooms) {
      const isScheduled = !!room.scheduledFor;
      const isScheduledFuture = isScheduled && (new Date(room.scheduledFor) > new Date(now.getTime() - 2 * 60 * 60 * 1000)); // allow up to 2h past scheduled start
      const isNew = (now - new Date(room.createdAt)) < 30 * 60 * 1000; // 30-minute grace period for newly created rooms

      if (isScheduledFuture || isNew || activeLkRoomNames.includes(room.roomName)) {
        // Determine if current user is authorized to see this room
        let canView = false;
        if (room.creatorId === userId) {
          canView = true;
        } else if (room.isPrivate) {
          try {
            const parsed = JSON.parse(room.invitedUserIds || '[]');
            canView = Array.isArray(parsed) && parsed.map(Number).includes(Number(userId));
          } catch (e) {
            canView = false;
          }
        } else if (room.isFriendsOnly) {
          canView = friendIds.includes(room.creatorId);
        } else {
          // Public room
          canView = true;
        }

        if (canView) {
          validRooms.push(room);
        }
      } else {
        // Auto delete old dead non-scheduled rooms or scheduled rooms expired over 2h ago
        datingPrisma.languageRoom.delete({
          where: { id: room.id }
        }).catch(err => console.error(`Failed to auto-delete dead room ${room.roomName} in background:`, err));
      }
    }

    await cacheService.set(cacheKey, validRooms, 15);
  } catch (err) {
    console.error('Failed background room refresh:', err);
  }
};

const getLanguageRooms = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `user:live-rooms:${userId}`;

  try {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Cache miss: do sync fetch
    let activeLkRoomNames = [];
    try {
      const lkRooms = await livekitService.listRooms();
      activeLkRoomNames = Array.isArray(lkRooms) ? lkRooms.map(r => r.name) : [];
    } catch (lkErr) {
      console.error('Failed to list LiveKit rooms:', lkErr);
    }

    const friendships = await datingPrisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    const friendIds = friendships.map((f) => 
      f.senderId === userId ? f.receiverId : f.senderId
    );

    const rooms = await datingPrisma.languageRoom.findMany({
      where: {
        NOT: {
          roomName: {
            startsWith: 'privatecall-'
          }
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [
        { scheduledFor: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const now = new Date();
    const validRooms = [];

    for (const room of rooms) {
      const isScheduled = !!room.scheduledFor;
      const isScheduledFuture = isScheduled && (new Date(room.scheduledFor) > new Date(now.getTime() - 2 * 60 * 60 * 1000));
      const isNew = (now - new Date(room.createdAt)) < 30 * 60 * 1000; // 30-minute grace period for newly created rooms

      if (isScheduledFuture || isNew || activeLkRoomNames.includes(room.roomName)) {
        // Determine if current user is authorized to see this room
        let canView = false;
        if (room.creatorId === userId) {
          canView = true;
        } else if (room.isPrivate) {
          try {
            const parsed = JSON.parse(room.invitedUserIds || '[]');
            canView = Array.isArray(parsed) && parsed.map(Number).includes(Number(userId));
          } catch (e) {
            canView = false;
          }
        } else if (room.isFriendsOnly) {
          canView = friendIds.includes(room.creatorId);
        } else {
          // Public room
          canView = true;
        }

        if (canView) {
          validRooms.push(room);
        }
      } else {
        datingPrisma.languageRoom.delete({
          where: { id: room.id }
        }).catch(err => console.error(`Failed to auto-delete dead room ${room.roomName}:`, err));
      }
    }

    await cacheService.set(cacheKey, validRooms, 15); // Cache for 15 seconds
    res.json(validRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

const getLanguageRoomByName = async (req, res) => {
  const { roomName } = req.params;
  const userId = req.user.id;

  try {
    const room = await datingPrisma.languageRoom.findUnique({
      where: { roomName },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (roomName.startsWith('privatecall-')) {
      const parts = roomName.split('-');
      const callerId = parseInt(parts[2], 10);
      const receiverId = parseInt(parts[3], 10);
      if (userId !== room.creatorId && userId !== callerId && userId !== receiverId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (room.isPrivate) {
      let isInvited = false;
      try {
        const parsed = JSON.parse(room.invitedUserIds || '[]');
        isInvited = Array.isArray(parsed) && parsed.map(Number).includes(Number(userId));
      } catch (e) {}
      if (room.creatorId !== userId && !isInvited) {
        return res.status(403).json({ error: 'Access denied: this is a private room' });
      }
    } else if (room.isFriendsOnly && room.creatorId !== userId) {
      const friendship = await datingPrisma.friendship.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { senderId: room.creatorId, receiverId: userId },
            { senderId: userId, receiverId: room.creatorId }
          ]
        }
      });
      if (!friendship) {
        return res.status(403).json({ error: 'Access denied: this is a friends-only room' });
      }
    }

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const inviteToLanguageRoom = async (req, res) => {
  const { roomName } = req.params;
  const { userIds } = req.body;
  const userId = req.user.id;

  try {
    const room = await datingPrisma.languageRoom.findUnique({
      where: { roomName },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the room creator can invite participants' });
    }

    const rawNewIds = Array.isArray(userIds) ? userIds.map(Number).filter(n => !isNaN(n) && n !== userId) : [];
    if (rawNewIds.length === 0) {
      return res.status(400).json({ error: 'No valid user IDs provided' });
    }

    let existingInvited = [];
    try {
      existingInvited = JSON.parse(room.invitedUserIds || '[]');
      if (!Array.isArray(existingInvited)) existingInvited = [];
    } catch (e) {
      existingInvited = [];
    }

    const combinedSet = new Set([...existingInvited.map(Number), ...rawNewIds]);
    const updatedInvited = Array.from(combinedSet);

    const updatedRoom = await datingPrisma.languageRoom.update({
      where: { roomName },
      data: {
        invitedUserIds: JSON.stringify(updatedInvited),
      },
    });

    const newlyAdded = rawNewIds.filter(id => !existingInvited.includes(id));
    if (newlyAdded.length > 0) {
      const creatorName = room.creator?.name || 'A friend';
      const formattedLanguage = room.language || 'English';
      const topicText = room.topic || 'General Discussion';

      sendPushNotification(
        newlyAdded,
        `${creatorName} invited you to a live room`,
        `Join "${topicText}" in ${formattedLanguage} now!`,
        { type: 'LIVE_ROOM_INVITATION', roomName: room.roomName }
      );

      try {
        const io = req.app.get('io');
        if (io) {
          const creatorAvatar = room.creator?.profilePicture || null;
          const payload = {
            roomName: room.roomName,
            creatorId: room.creatorId,
            creatorName,
            creatorAvatar,
            topic: room.topic,
            language: room.language,
            mediaType: room.mediaType,
          };
          newlyAdded.forEach(targetId => {
            io.to(targetId.toString()).emit('ROOM_INVITATION', payload);
            io.to(`user_${targetId}`).emit('ROOM_INVITATION', payload);
          });
          io.emit('ROOMS_UPDATED');
        }
      } catch (socketErr) {
        console.error('Socket emit failed for room invitation:', socketErr.message);
      }
    }

    await invalidateRoomsCache();
    return res.json({ success: true, room: updatedRoom, newlyAdded });
  } catch (error) {
    console.error('Error inviting users to room:', error);
    return res.status(500).json({ error: 'Failed to invite users' });
  }
};

const createGroup = async (req, res) => {
  const { name, description, isPrivate, entryKey, onlyAdminsCanPost } = req.body;
  const creatorId = req.user.id;

  try {
    const existingGroup = await datingPrisma.group.findUnique({
      where: { name },
    });

    if (existingGroup) {
      return res.status(400).json({ error: 'Group name already in use' });
    }

    const group = await datingPrisma.group.create({
      data: {
        name,
        description,
        isPrivate: !!isPrivate,
        entryKey: isPrivate ? entryKey : null,
        onlyAdminsCanPost: !!onlyAdminsCanPost,
        creatorId,
        members: {
          create: {
            userId: creatorId,
            role: 'admin',
          },
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
    });

    await invalidateGroupsCache();
    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

const joinGroup = async (req, res) => {
  const { groupId, entryKey } = req.body;
  const userId = req.user.id;

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.isLocked) {
      return res.status(403).json({ error: 'This group is locked by platform administrators and cannot be joined.' });
    }

    if (group.isPrivate && group.entryKey !== entryKey) {
      return res.status(400).json({ error: 'Invalid entry key' });
    }

    // Check if already a member
    const existingMember = await datingPrisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId,
        },
      },
    });

    if (existingMember) {
      return res.json({ message: 'Already a member', group });
    }

    await datingPrisma.groupMember.create({
      data: {
        groupId: parseInt(groupId),
        userId,
        role: 'member',
      },
    });

    await invalidateGroupsCache();
    res.json({ message: 'Successfully joined group', group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join group' });
  }
};

const leaveGroup = async (req, res) => {
  const { groupId } = req.body;
  const userId = req.user.id;

  try {
    const member = await datingPrisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }

    await datingPrisma.groupMember.delete({
      where: { id: member.id },
    });

    await invalidateGroupsCache();
    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
};

const getGroups = async (req, res) => {
  const userId = req.user.id;
  const isMainAdminUser = checkIsMainAdmin(req.user);

  try {
    const cacheKey = `user:groups:${userId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const groups = await datingPrisma.group.findMany({
      include: {
        creator: {
          select: { id: true, name: true, profilePicture: true },
        },
        members: {
          select: { userId: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Determine which groups user has joined
    const joinedGroupIds = groups
      .filter(g => g.members.some(m => m.userId === userId))
      .map(g => g.id);

    // ── Batch last-message fetch (1 query instead of N) ─────────────────────
    let lastMessageByGroupId = new Map();
    if (joinedGroupIds.length > 0) {
      try {
        const rawLastMessages = await datingPrisma.$queryRaw`
          SELECT DISTINCT ON ("groupId")
            gm.id, gm.content, gm."senderId", gm."groupId", gm."createdAt",
            u.id as "senderId", u.name as "senderName", u."profilePicture" as "senderPic"
          FROM "social_group_messages" gm
          JOIN "social_users" u ON u.id = gm."senderId"
          WHERE gm."groupId" = ANY(${joinedGroupIds}::int[])
            AND gm."isDeleted" = false
          ORDER BY "groupId", gm."createdAt" DESC
        `;
        rawLastMessages.forEach(msg => {
          lastMessageByGroupId.set(Number(msg.groupId), {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            sender: { id: msg.senderId, name: msg.senderName, profilePicture: msg.senderPic }
          });
        });
      } catch (rawErr) {
        console.error('Group last message batch query failed:', rawErr.message);
      }
    }

    const formattedGroups = groups.map(g => {
      const myMembership = g.members.find(m => m.userId === userId);
      const isJoined = !!myMembership;
      const isGroupAdmin = g.creatorId === userId || myMembership?.role === 'admin' || isMainAdminUser;
      return {
        ...g,
        isJoined,
        isGroupAdmin,
        isCreator: g.creatorId === userId,
        isLocked: !!g.isLocked,
        userRole: myMembership?.role || (g.creatorId === userId ? 'admin' : (isJoined ? 'member' : null)),
        memberCount: g.members.length,
        entryKey: (g.creatorId === userId || isMainAdminUser) ? g.entryKey : null,
        members: undefined,
        lastMessage: isJoined ? (lastMessageByGroupId.get(g.id) || null) : null,
      };
    });

    await cacheService.set(cacheKey, formattedGroups, 10); // Cache for 10 seconds

    res.json(formattedGroups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 0;
  const PAGE_SIZE = 50;

  try {
    // Verify membership
    const isMember = await datingPrisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId,
        },
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: join group first' });
    }

    // Paginated — newest 50 first, reversed for chronological display
    const messages = await datingPrisma.groupMessage.findMany({
      where: { groupId: parseInt(groupId), isDeleted: false },
      include: {
        sender: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
};

const sendGroupMessage = async (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const [isMember, group] = await Promise.all([
      datingPrisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: parseInt(groupId), userId: senderId } },
      }),
      datingPrisma.group.findUnique({
        where: { id: parseInt(groupId) },
      }),
    ]);

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: join group first' });
    }

    if (group && group.isLocked) {
      return res.status(403).json({ error: 'This group is locked by platform administrators. New messages cannot be sent.' });
    }

    if (group && group.onlyAdminsCanPost) {
      const isCreator = group.creatorId === senderId;
      const isCoAdmin = isMember.role === 'admin';
      if (!isCreator && !isCoAdmin && !isMainAdmin) {
        return res.status(403).json({ error: 'Only admins can send messages in this group' });
      }
    }

    const message = await datingPrisma.groupMessage.create({
      data: { groupId: parseInt(groupId), senderId, content },
      include: {
        sender: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
    });

    const messagePayload = {
      ...message,
      groupId: parseInt(groupId),
      groupName: group?.name || 'Group',
      group: group ? { id: group.id, name: group.name } : undefined,
    };

    // Emit real-time socket event to group room directly from server
    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('receiveGroupMessage', messagePayload);
    }

    // Invalidate group cache so getGroups has fresh lastMessage immediately
    invalidateGroupsCache().catch(() => {});

    // Send push notifications to group members (non-blocking)
    datingPrisma.groupMember.findMany({
      where: { groupId: parseInt(groupId), userId: { not: senderId } },
      select: { userId: true }
    }).then(async members => {
      const allReceiverIds = members.map(m => m.userId);
      if (allReceiverIds.length > 0 && group) {
        sendPushNotification(
          allReceiverIds,
          `New message in ${group.name}`,
          `${message.sender?.name || 'A member'}: ${content}`,
          { 
            type: 'GROUP_MESSAGE', 
            groupId: String(groupId),
            groupName: group.name,
            senderId: String(senderId),
            senderName: message.sender?.name || 'A member',
            senderPicture: (message.sender?.profilePicture && !message.sender.profilePicture.startsWith('data:') && message.sender.profilePicture.length < 500) ? message.sender.profilePicture : ''
          }
        );
      }
    }).catch(pushErr => {
      console.error('Error sending group message push notification:', pushErr.message);
    });

    res.status(201).json(messagePayload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send group message' });
  }
};

const getGroupDetails = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        creator: {
          select: { id: true, name: true, profilePicture: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, profilePicture: true, collegeName: true, department: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify membership or allow platform main admin
    const myMember = group.members.find(m => m.userId === userId);
    if (!myMember && !isMainAdmin) {
      return res.status(403).json({ error: 'Access denied: join group first' });
    }

    const isGroupAdmin = group.creatorId === userId || myMember?.role === 'admin' || isMainAdmin;

    res.json({
      ...group,
      isLocked: !!group.isLocked,
      isGroupAdmin,
      isMainAdmin,
      isCreator: group.creatorId === userId,
      userRole: myMember?.role || (group.creatorId === userId ? 'admin' : (isMainAdmin ? 'main_admin' : 'member')),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
};

const updateGroupSettings = async (req, res) => {
  const { groupId } = req.params;
  const { onlyAdminsCanPost, description, name, isPrivate, entryKey } = req.body;
  const userId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        members: { where: { userId } }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const myMember = group.members[0];
    const isGroupAdmin = group.creatorId === userId || myMember?.role === 'admin' || isMainAdmin;

    if (!isGroupAdmin) {
      return res.status(403).json({ error: 'Only group admins or platform administrators can update settings' });
    }

    if (name && name.trim() !== group.name) {
      const existing = await datingPrisma.group.findUnique({
        where: { name: name.trim() }
      });
      if (existing && existing.id !== group.id) {
        return res.status(400).json({ error: 'Group name already in use' });
      }
    }

    const updatedGroup = await datingPrisma.group.update({
      where: { id: parseInt(groupId) },
      data: {
        onlyAdminsCanPost: onlyAdminsCanPost !== undefined ? !!onlyAdminsCanPost : group.onlyAdminsCanPost,
        description: description !== undefined ? description : group.description,
        name: name !== undefined && name.trim() ? name.trim() : group.name,
        isPrivate: isPrivate !== undefined ? !!isPrivate : group.isPrivate,
        entryKey: isPrivate !== undefined ? (isPrivate ? (entryKey || group.entryKey) : null) : (entryKey !== undefined ? entryKey : group.entryKey),
      },
      include: {
        creator: {
          select: { id: true, name: true, profilePicture: true },
        }
      }
    });

    await invalidateGroupsCache();

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('groupSettingsUpdated', updatedGroup);
    }

    res.json(updatedGroup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update group settings' });
  }
};

const addGroupMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const adminId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        members: { where: { userId: adminId } }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const myMember = group.members[0];
    const isGroupAdmin = group.creatorId === adminId || myMember?.role === 'admin' || isMainAdmin;

    if (!isGroupAdmin) {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    // Check if already a member
    const existingMember = await datingPrisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId: parseInt(userId),
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    const newMember = await datingPrisma.groupMember.create({
      data: {
        groupId: parseInt(groupId),
        userId: parseInt(userId),
        role: 'member',
      },
      include: {
        user: {
          select: { id: true, name: true, profilePicture: true }
        }
      }
    });

    await invalidateGroupsCache();

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('groupMemberAdded', {
        groupId: parseInt(groupId),
        member: newMember,
      });
    }

    res.json(newMember);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

const removeGroupMember = async (req, res) => {
  const { groupId, userId } = req.params;
  const adminId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        members: true
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const targetUserId = parseInt(userId);
    const myMember = group.members.find(m => m.userId === adminId);
    const targetMember = group.members.find(m => m.userId === targetUserId);

    if (!targetMember) {
      return res.status(404).json({ error: 'User is not a member of this group' });
    }

    const isGroupCreator = group.creatorId === adminId;
    const isCoAdmin = myMember?.role === 'admin';

    if (!isGroupCreator && !isCoAdmin && !isMainAdmin) {
      return res.status(403).json({ error: 'Only group admins or platform administrators can remove members' });
    }

    if (targetUserId === group.creatorId) {
      return res.status(400).json({ error: 'The group creator cannot be removed' });
    }

    // Co-admins cannot remove other admins or creator
    if (isCoAdmin && !isGroupCreator && !isMainAdmin && targetMember.role === 'admin') {
      return res.status(403).json({ error: 'Co-admins cannot remove fellow group admins' });
    }

    await datingPrisma.groupMember.delete({
      where: { id: targetMember.id },
    });

    await invalidateGroupsCache();

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('groupMemberRemoved', {
        groupId: parseInt(groupId),
        userId: targetUserId,
      });
    }

    res.json({ message: 'Member successfully removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

const deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const numGroupId = parseInt(groupId);
    const group = await datingPrisma.group.findUnique({
      where: { id: numGroupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only Group Creator OR Main Admin can delete
    if (group.creatorId !== userId && !isMainAdmin) {
      return res.status(403).json({ error: 'Only the group creator or platform administrator can delete this group' });
    }

    // Safe transaction: cascade delete ONLY this group's messages, members, and the group itself
    await datingPrisma.$transaction([
      datingPrisma.groupMessage.deleteMany({ where: { groupId: numGroupId } }),
      datingPrisma.groupMember.deleteMany({ where: { groupId: numGroupId } }),
      datingPrisma.group.delete({ where: { id: numGroupId } }),
    ]);

    await invalidateGroupsCache();

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${numGroupId}`).emit('groupDeleted', {
        groupId: numGroupId,
        groupName: group.name,
        deletedBy: isMainAdmin && group.creatorId !== userId ? 'Platform Administrator' : 'Group Creator',
      });
    }

    res.json({ success: true, message: 'Group deleted successfully', groupId: numGroupId });
  } catch (error) {
    console.error('Failed to delete group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};

const transferGroupOwnership = async (req, res) => {
  const { groupId } = req.params;
  const { newOwnerId } = req.body;
  const userId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const numGroupId = parseInt(groupId);
    const numNewOwnerId = parseInt(newOwnerId);

    const group = await datingPrisma.group.findUnique({
      where: { id: numGroupId },
      include: {
        members: {
          where: { userId: numNewOwnerId },
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creatorId !== userId && !isMainAdmin) {
      return res.status(403).json({ error: 'Only the current group creator or platform administrator can transfer ownership' });
    }

    const targetMember = group.members[0];
    if (!targetMember) {
      return res.status(400).json({ error: 'The new owner must be an active member of this group' });
    }

    // Update group creator and set new owner role to admin
    await datingPrisma.$transaction([
      datingPrisma.group.update({
        where: { id: numGroupId },
        data: { creatorId: numNewOwnerId }
      }),
      datingPrisma.groupMember.update({
        where: { id: targetMember.id },
        data: { role: 'admin' }
      })
    ]);

    await invalidateGroupsCache();

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${numGroupId}`).emit('groupOwnershipTransferred', {
        groupId: numGroupId,
        newOwnerId: numNewOwnerId,
        newOwnerName: targetMember.user.name,
      });
    }

    res.json({
      success: true,
      message: `Ownership successfully transferred to ${targetMember.user.name}`,
      newOwnerId: numNewOwnerId
    });
  } catch (error) {
    console.error('Failed to transfer group ownership:', error);
    res.status(500).json({ error: 'Failed to transfer group ownership' });
  }
};

const updateMemberRole = async (req, res) => {
  const { groupId, userId: targetUserId } = req.params;
  const { role } = req.body; // 'admin' or 'member'
  const currentUserId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  if (!['admin', 'member'].includes(role)) {
    return res.status(400).json({ error: 'Role must be either "admin" or "member"' });
  }

  try {
    const numGroupId = parseInt(groupId);
    const numTargetUserId = parseInt(targetUserId);

    const group = await datingPrisma.group.findUnique({
      where: { id: numGroupId }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creatorId !== currentUserId && !isMainAdmin) {
      return res.status(403).json({ error: 'Only the group creator or platform administrator can assign admin roles' });
    }

    if (numTargetUserId === group.creatorId) {
      return res.status(400).json({ error: 'Cannot change the role of the group creator' });
    }

    const member = await datingPrisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: numGroupId,
          userId: numTargetUserId,
        }
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'User is not a member of this group' });
    }

    const updated = await datingPrisma.groupMember.update({
      where: { id: member.id },
      data: { role },
      include: {
        user: { select: { id: true, name: true, profilePicture: true } }
      }
    });

    await invalidateGroupsCache();

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${numGroupId}`).emit('groupMemberRoleUpdated', {
        groupId: numGroupId,
        userId: numTargetUserId,
        role,
        userName: member.user.name,
      });
    }

    res.json({
      success: true,
      message: `Member ${member.user.name} is now ${role === 'admin' ? 'a Group Admin' : 'a Member'}`,
      member: updated
    });
  } catch (error) {
    console.error('Failed to update member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
};



const getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const comments = await datingPrisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

const createComment = async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  const numPostId = parseInt(postId);

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    const comment = await datingPrisma.comment.create({
      data: {
        content: content.trim(),
        postId: numPostId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    const commentsCount = await datingPrisma.comment.count({
      where: { postId: numPostId }
    });

    await invalidateFeedCache();

    // Broadcast new comment in real-time
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('POST_COMMENT_ADDED', {
          postId: numPostId,
          comment,
          commentsCount
        });
      }
    } catch (wsErr) {
      console.error('Failed to emit new comment socket:', wsErr);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const numCommentId = parseInt(commentId);

  try {
    const comment = await datingPrisma.comment.findUnique({
      where: { id: numCommentId },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const post = await datingPrisma.post.findUnique({
      where: { id: comment.postId },
    });

    if (comment.authorId !== userId && post?.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await datingPrisma.comment.delete({
      where: { id: numCommentId },
    });

    const commentsCount = await datingPrisma.comment.count({
      where: { postId: comment.postId }
    });

    await invalidateFeedCache();

    // Broadcast comment deletion in real-time
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('POST_COMMENT_DELETED', {
          postId: comment.postId,
          commentId: numCommentId,
          commentsCount
        });
      }
    } catch (wsErr) {
      console.error('Failed to emit delete comment socket:', wsErr);
    }

    res.json({ message: 'Comment deleted successfully', commentsCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

const getPostLikes = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await datingPrisma.post.findUnique({
      where: { id: parseInt(postId) },
      include: {
        likes: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            bio: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post.likes || []);
  } catch (error) {
    console.error('Failed to fetch post likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
};

const getPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const post = await datingPrisma.post.findUnique({
      where: { id: parseInt(postId) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
        likes: {
          where: { id: userId },
          select: {
            id: true,
          },
        },
        savedBy: {
          where: { id: userId },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId && post.visibility !== 'public') {
      const friendship = await datingPrisma.friendship.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { senderId: userId, receiverId: post.authorId },
            { senderId: post.authorId, receiverId: userId }
          ]
        }
      });

      if (!friendship) {
        return res.status(403).json({ error: 'You are not authorized to view this post' });
      }

      if (post.visibility === 'close_friends') {
        const isAuthorCloseFriend = await datingPrisma.closeFriendRequest.findFirst({
          where: {
            senderId: post.authorId,
            receiverId: userId,
            status: 'accepted'
          }
        });
        if (!isAuthorCloseFriend) {
          return res.status(403).json({ error: 'You are not authorized to view this post' });
        }
      }
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const msg = await datingPrisma.message.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (msg.senderId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    const updated = await datingPrisma.message.update({
      where: { id: parseInt(messageId) },
      data: { isDeleted: true, content: 'This message was deleted' }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

const deleteGroupMessage = async (req, res) => {
  const { messageId, groupId } = req.params;
  const userId = req.user.id;
  const isMainAdmin = checkIsMainAdmin(req.user);

  try {
    const msg = await datingPrisma.groupMessage.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        members: { where: { userId } }
      }
    });

    const isGroupCreator = group && group.creatorId === userId;
    const isSender = msg.senderId === userId;
    const isCoAdmin = group?.members[0]?.role === 'admin';

    if (!isSender && !isGroupCreator && !isCoAdmin && !isMainAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    const updated = await datingPrisma.groupMessage.update({
      where: { id: parseInt(messageId) },
      data: { isDeleted: true, content: 'This message was deleted' }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`group-${groupId}`).emit('groupMessageDeleted', {
        messageId: parseInt(messageId),
        groupId: parseInt(groupId)
      });
    }

    invalidateGroupsCache().catch(() => {});

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

module.exports = {
  createPost,
  getFeed,
  getTags,
  likePost,
  getLikedPosts,
  getCommentedPosts,
  getSavedPosts,
  getActivityCounts,
  savePost,
  updatePost,
  deletePost,
  getProfile,
  updateProfile,
  searchUsers,
  getSuggestedUsers,
  sendFriendRequest,
  acceptFriendRequest,
  acceptFriendship,
  removeFriendship,
  toggleCloseFriend,
  getFriendships,
  getPendingFriendCount,
  getMessages,
  getUnreadCounts,
  createLanguageRoom,
  deleteLanguageRoom,
  deleteLanguageRoomByName,
  getLanguageRooms,
  getLanguageRoomByName,
  inviteToLanguageRoom,
  createGroup,
  joinGroup,
  leaveGroup,
  getGroups,
  getGroupMessages,
  sendGroupMessage,
  getGroupDetails,
  updateGroupSettings,
  addGroupMember,
  removeGroupMember,
  deleteGroup,
  transferGroupOwnership,
  updateMemberRole,
  getComments,
  createComment,
  deleteComment,
  getPost,
  getPostLikes,
  deleteMessage,
  deleteGroupMessage,
  cancelDelayedRoomDeletion,
  sendRoomStartedNotification,
  checkScheduledRoomsToStart,
};
