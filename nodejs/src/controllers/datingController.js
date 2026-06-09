const datingPrisma = require('../utils/datingPrisma');

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
      },
    });
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

const getFeed = async (req, res) => {
  const userId = req.user.id;

  try {
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

    // 2. Query posts based on visibility permissions
    const posts = await datingPrisma.post.findMany({
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

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
    await datingPrisma.post.delete({
      where: { id: parseInt(postId) },
    });

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
    const profileUser = await datingPrisma.user.findUnique({
      where: { id: parseInt(profileIdParam) },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            posts: true,
            likedPosts: true,
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

    res.json({
      ...profileUser,
      isFriend,
      isCloseFriend,
      hasPendingRequest,
      isRequestSender,
      password: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const data = req.body;

  try {
    const updatedUser = await datingPrisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
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

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchUsers = async (req, res) => {
  const { q } = req.query;
  const userId = req.user.id;

  if (!q || typeof q !== 'string') return res.json([]);

  try {
    const users = await datingPrisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { collegeName: { contains: q } },
          { department: { contains: q } },
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

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle close friend status' });
  }
};

const getFriendships = async (req, res) => {
  const userId = req.user.id;

  try {
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

    const friends = friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => {
        const friend = f.senderId === userId ? f.receiver : f.sender;
        return {
          ...friend,
          isCloseFriend: f.isCloseFriend,
          friendshipId: f.id,
        };
      });

    const pending = friendships.filter((f) => f.status === 'pending' && f.receiverId === userId);

    res.json({ friends, pending });
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

  try {
    const messages = await datingPrisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: parseInt(targetUserId) },
          { senderId: parseInt(targetUserId), receiverId: userId }
        ]
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Mark messages as read
    await datingPrisma.message.updateMany({
      where: {
        senderId: parseInt(targetUserId),
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const getUnreadCounts = async (req, res) => {
  const userId = req.user.id;

  try {
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
  const { roomName, topic, language } = req.body;
  const creatorId = req.user.id;

  try {
    const existingRoom = await datingPrisma.languageRoom.findUnique({
      where: { roomName },
    });

    if (existingRoom) {
      return res.status(400).json({ message: 'Room name already in use' });
    }

    const room = await datingPrisma.languageRoom.create({
      data: {
        roomName,
        topic,
        language,
        creatorId,
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

    res.json({ message: 'Room ended successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};

const getLanguageRooms = async (req, res) => {
  try {
    const rooms = await datingPrisma.languageRoom.findMany({
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
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

const createGroup = async (req, res) => {
  const { name, description, isPrivate, entryKey } = req.body;
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

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
};

const getGroups = async (req, res) => {
  const userId = req.user.id;

  try {
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

    const formattedGroups = groups.map((g) => {
      const isJoined = g.members.some((m) => m.userId === userId);
      const memberCount = g.members.length;
      return {
        ...g,
        isJoined,
        memberCount,
        // Hide entry key for other users
        entryKey: g.creatorId === userId ? g.entryKey : null,
        members: undefined, // remove raw array from output
      };
    });

    res.json(formattedGroups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

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

    const messages = await datingPrisma.groupMessage.findMany({
      where: { groupId: parseInt(groupId) },
      include: {
        sender: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
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
    // Verify membership
    const isMember = await datingPrisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId: senderId,
        },
      },
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: join group first' });
    }

    const message = await datingPrisma.groupMessage.create({
      data: {
        groupId: parseInt(groupId),
        senderId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send group message' });
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
  getComments,
  createComment,
  deleteComment,
  getPost,
};
