const datingPrisma = require('../utils/datingPrisma');
const { sendPushNotification } = require('../utils/pushNotifier');
const livekitService = require('../services/livekit.service');
const cacheService = require('../services/cache.service');

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


// ==========================================
// POST CONTROLLERS
// ==========================================

const createPost = async (req, res) => {
  const { content, image, visibility } = req.body;
  const authorId = req.user.id;

  try {
    const post = await datingPrisma.post.create({
      data: {
        content,
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
        // Emit to the author themselves (e.g. across multiple tabs/devices)
        io.to(authorId.toString()).emit('NEW_POST', post);

        // Emit to friends based on visibility
        let targetIds = [];
        if (post.visibility === 'close_friends') {
          targetIds = friendships
            .filter(f => f.isCloseFriend)
            .map(f => f.senderId === authorId ? f.receiverId : f.senderId);
        } else {
          // public or friends
          targetIds = friendIds;
        }

        targetIds.forEach(friendId => {
          io.to(friendId.toString()).emit('NEW_POST', post);
        });
      }
    } catch (wsError) {
      console.error('Failed to broadcast new post via socket:', wsError);
    }

    await invalidateFeedCache();
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

const getFeed = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 20;
  const targetAuthorId = req.query.authorId ? parseInt(req.query.authorId, 10) : null;

  try {
    const cacheKey = `user:feed:${userId}:${limit}:${targetAuthorId || 'all'}`;
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
    
    // Identify close friends
    const closeFriendIds = friendships
      .filter(f => f.isCloseFriend)
      .map(f => f.senderId === userId ? f.receiverId : f.senderId);

    const whereClause = {
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

    if (targetAuthorId) {
      whereClause.authorId = targetAuthorId;
    }

    // 2. Query posts based on visibility permissions
    const posts = await datingPrisma.post.findMany({
      where: whereClause,
      take: limit,
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

  try {
    const post = await datingPrisma.post.findUnique({
      where: { id: parseInt(postId) },
      include: { likes: true },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const isLiked = post.likes.some((user) => user.id === userId);

    const updatedPost = await datingPrisma.post.update({
      where: { id: parseInt(postId) },
      data: {
        likes: isLiked
          ? { disconnect: { id: userId } }
          : { connect: { id: userId } },
      },
    });

    await invalidateFeedCache();
    res.json({ liked: !isLiked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle like' });
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
    });

    await invalidateFeedCache();
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
    const cacheKey = `user:profile:${currentUserId}:${profileIdParam}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const profileUser = await datingPrisma.user.findUnique({
      where: { id: parseInt(profileIdParam) },
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
        isCloseFriend = friendship.isCloseFriend;
        hasPendingRequest = friendship.status === 'pending';
        isRequestSender = friendship.senderId === currentUserId;
      }
    }

    if (currentUserId !== profileUser.id) {
      // Filter sensitive info based on relationship settings
      const contactFields = [
        { key: 'phoneNumber', visibility: profileUser.phoneVisibility },
        { key: 'whatsappNumber', visibility: profileUser.whatsappVisibility },
        { key: 'instagramHandle', visibility: profileUser.instagramVisibility },
        { key: 'facebookUrl', visibility: profileUser.facebookVisibility },
        { key: 'snapchatUsername', visibility: profileUser.snapchatVisibility },
        { key: 'linkedinUrl', visibility: profileUser.linkedinVisibility }
      ];

      contactFields.forEach(field => {
        if (field.visibility === 'friends') {
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
  const data = req.body;

  try {
    // Enforce 50-word limit on bio
    let bioVal = data.bio || '';
    const bioWords = bioVal.trim().split(/\s+/).filter(Boolean);
    if (bioWords.length > 50) {
      bioVal = bioWords.slice(0, 50).join(' ');
    }

    const updatedUser = await datingPrisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: bioVal,
        collegeName: data.collegeName,
        department: data.department,
        yearOfStudy: data.yearOfStudy,
        phoneNumber: data.phoneNumber,
        phoneVisibility: data.phoneVisibility,
        whatsappNumber: data.whatsappNumber,
        whatsappVisibility: data.whatsappVisibility,
        instagramHandle: data.instagramHandle,
        instagramVisibility: data.instagramVisibility,
        facebookUrl: data.facebookUrl,
        facebookVisibility: data.facebookVisibility,
        snapchatUsername: data.snapchatUsername,
        snapchatVisibility: data.snapchatVisibility,
        linkedinUrl: data.linkedinUrl,
        linkedinVisibility: data.linkedinVisibility,
      },
    });

    await invalidateProfileCache(); // Clear cached profiles for this user
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

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==========================================
// SOCIAL CONTROLLERS
// ==========================================

const sendFriendRequest = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (senderId === parseInt(receiverId)) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }

  try {
    const friendship = await datingPrisma.friendship.create({
      data: {
        senderId,
        receiverId: parseInt(receiverId),
        status: 'pending',
      },
    });
    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Request already exists or failed' });
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
    const friendship = await datingPrisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: parseInt(targetUserId) },
          { senderId: parseInt(targetUserId), receiverId: userId }
        ]
      }
    });

    if (!friendship) return res.status(404).json({ error: 'Friendship not found' });

    await datingPrisma.friendship.delete({
      where: { id: friendship.id },
    });

    await invalidateFeedCache();
    await invalidateRoomsCache();
    await invalidateFriendshipsCache();
    await invalidateProfileCache();
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

    const updated = await datingPrisma.friendship.update({
      where: { id: friendship.id },
      data: { isCloseFriend: !friendship.isCloseFriend },
    });

    await invalidateFeedCache();
    await invalidateRoomsCache();
    await invalidateFriendshipsCache();
    await invalidateProfileCache();
    res.json(updated);
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
          select: { id: true, name: true, profilePicture: true },
        },
        receiver: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
    });

    const acceptedFriendships = friendships.filter(f => f.status === 'accepted');
    const friendIds = acceptedFriendships.map(f => f.senderId === userId ? f.receiverId : f.senderId);

    // ── Batch last-message fetch (1 query instead of N) ──────────────────────
    // Previously: 1 findFirst() per friend = N DB queries
    // Now: 1 raw query using DISTINCT ON to get latest message per conversation
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
        // Fallback gracefully if raw query fails (e.g. tables not yet created)
        console.error('Last message batch query failed:', rawErr.message);
      }
    }

    // Build friends list — zero additional queries
    const friends = acceptedFriendships.map(f => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return {
        ...friend,
        isCloseFriend: f.isCloseFriend,
        friendshipId: f.id,
        lastMessage: lastMessageMap.get(friend.id) || null,
      };
    });

    const pending = friendships.filter(f => f.status === 'pending' && f.receiverId === userId);

    const result = { friends, pending };
    await cacheService.set(cacheKey, result, 30); // Cache for 30 seconds

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch friendships' });
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
    const messages = await datingPrisma.message.findMany({
      where: {
        isDeleted: false,
        OR: [
          { senderId: userId, receiverId: parseInt(targetUserId) },
          { senderId: parseInt(targetUserId), receiverId: userId }
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
        senderId: parseInt(targetUserId),
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
  const { roomName, topic, language, roomType, mediaType, maxParticipants, isFriendsOnly } = req.body;
  const creatorId = req.user.id;

  try {
    // Generate a unique roomName by appending a random suffix and checking existence
    let uniqueRoomName = roomName;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      uniqueRoomName = `${roomName}-${suffix}`;
      
      const checkRoom = await datingPrisma.languageRoom.findUnique({
        where: { roomName: uniqueRoomName },
      });
      
      if (!checkRoom) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      uniqueRoomName = `${roomName}-${Date.now()}`;
    }

    const finalRoomType = roomType || 'group';
    let finalMaxParticipants = parseInt(maxParticipants) || 10;
    if (finalRoomType === '1-on-1') {
      finalMaxParticipants = 2;
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
        isFriendsOnly: !!isFriendsOnly,
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

    // Send push notification to creator's friends
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
        const creatorName = room.creator?.name || 'A friend';
        const formattedLanguage = room.language || 'English';
        const topicText = room.topic || 'General Discussion';
        
        sendPushNotification(
          friendIds,
          `${creatorName} started a live room`,
          `Join the live room "${topicText}" in ${formattedLanguage} to discuss together!`,
          { type: 'LIVE_ROOM_CREATED', roomName: room.roomName }
        );
      }
    } catch (pushErr) {
      console.error('Error sending room push notification to friends:', pushErr.message);
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

  try {
    const room = await datingPrisma.languageRoom.findUnique({
      where: { roomName },
    });

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.creatorId !== creatorId) return res.status(403).json({ error: 'Forbidden' });

    await datingPrisma.languageRoom.delete({
      where: { roomName },
    });

    await invalidateRoomsCache();
    try {
      const io = req.app.get('io');
      if (io) {
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
        OR: [
          { isFriendsOnly: false },
          { creatorId: userId },
          { creatorId: { in: friendIds } }
        ]
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    const validRooms = [];

    for (const room of rooms) {
      const isNew = (now - new Date(room.createdAt)) < 30000;
      if (isNew || activeLkRoomNames.includes(room.roomName)) {
        validRooms.push(room);
      } else {
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
        OR: [
          { isFriendsOnly: false },
          { creatorId: userId },
          { creatorId: { in: friendIds } }
        ]
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    const validRooms = [];

    for (const room of rooms) {
      const isNew = (now - new Date(room.createdAt)) < 30000;
      if (isNew || activeLkRoomNames.includes(room.roomName)) {
        validRooms.push(room);
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
          select: { userId: true },
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
      const isJoined = g.members.some(m => m.userId === userId);
      return {
        ...g,
        isJoined,
        memberCount: g.members.length,
        entryKey: g.creatorId === userId ? g.entryKey : null,
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

  try {
    // Run membership check and group settings lookup IN PARALLEL (was sequential)
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
    if (group && group.onlyAdminsCanPost && group.creatorId !== senderId) {
      return res.status(403).json({ error: 'Only admins can send messages in this group' });
    }

    const message = await datingPrisma.groupMessage.create({
      data: { groupId: parseInt(groupId), senderId, content },
      include: {
        sender: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
    });

    // Send push notifications to group members (non-blocking)
    datingPrisma.groupMember.findMany({
      where: { groupId: parseInt(groupId), userId: { not: senderId } },
      select: { userId: true }
    }).then(members => {
      const receiverIds = members.map(m => m.userId);
      if (receiverIds.length > 0 && group) {
        sendPushNotification(
          receiverIds,
          `New message in ${group.name}`,
          `${message.sender.name}: ${content}`,
          { type: 'GROUP_MESSAGE', groupId: String(groupId) }
        );
      }
    }).catch(pushErr => {
      console.error('Error sending group message push notification:', pushErr.message);
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send group message' });
  }
};

const getGroupDetails = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) },
      include: {
        creator: {
          select: { id: true, name: true, profilePicture: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, profilePicture: true, collegeName: true, department: true }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify membership
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: join group first' });
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
};

const updateGroupSettings = async (req, res) => {
  const { groupId } = req.params;
  const { onlyAdminsCanPost, description, name } = req.body;
  const userId = req.user.id;

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the group admin can update settings' });
    }

    const updatedGroup = await datingPrisma.group.update({
      where: { id: parseInt(groupId) },
      data: {
        onlyAdminsCanPost: onlyAdminsCanPost !== undefined ? !!onlyAdminsCanPost : group.onlyAdminsCanPost,
        description: description !== undefined ? description : group.description,
        name: name !== undefined ? name : group.name
      },
      include: {
        creator: {
          select: { id: true, name: true, profilePicture: true },
        }
      }
    });

    await invalidateGroupsCache();
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

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creatorId !== adminId) {
      return res.status(403).json({ error: 'Only the group admin can add members' });
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
      },
      include: {
        user: {
          select: { id: true, name: true, profilePicture: true }
        }
      }
    });

    await invalidateGroupsCache();
    res.json(newMember);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

const removeGroupMember = async (req, res) => {
  const { groupId, userId } = req.params;
  const adminId = req.user.id;

  try {
    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.creatorId !== adminId) {
      return res.status(403).json({ error: 'Only the group admin can remove members' });
    }

    if (parseInt(userId) === group.creatorId) {
      return res.status(400).json({ error: 'The group creator cannot be removed' });
    }

    const member = await datingPrisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId: parseInt(userId),
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'User is not a member of this group' });
    }

    await datingPrisma.groupMember.delete({
      where: { id: member.id },
    });

    await invalidateGroupsCache();
    res.json({ message: 'Member successfully removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove member' });
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

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  try {
    const comment = await datingPrisma.comment.create({
      data: {
        content: content.trim(),
        postId: parseInt(postId),
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
    await invalidateFeedCache();
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  try {
    const comment = await datingPrisma.comment.findUnique({
      where: { id: parseInt(commentId) },
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
      where: { id: parseInt(commentId) },
    });

    await invalidateFeedCache();
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete comment' });
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

      if (post.visibility === 'close_friends' && !friendship.isCloseFriend) {
        return res.status(403).json({ error: 'You are not authorized to view this post' });
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

  try {
    const msg = await datingPrisma.groupMessage.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const group = await datingPrisma.group.findUnique({
      where: { id: parseInt(groupId) }
    });

    const isGroupCreator = group && group.creatorId === userId;
    const isSender = msg.senderId === userId;

    if (!isSender && !isGroupCreator) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    const updated = await datingPrisma.groupMessage.update({
      where: { id: parseInt(messageId) },
      data: { isDeleted: true, content: 'This message was deleted' }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

module.exports = {
  createPost,
  getFeed,
  likePost,
  updatePost,
  deletePost,
  getProfile,
  updateProfile,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  acceptFriendship,
  removeFriendship,
  toggleCloseFriend,
  getFriendships,
  getMessages,
  getUnreadCounts,
  createLanguageRoom,
  deleteLanguageRoom,
  deleteLanguageRoomByName,
  getLanguageRooms,
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
  getComments,
  createComment,
  deleteComment,
  getPost,
  deleteMessage,
  deleteGroupMessage,
};
