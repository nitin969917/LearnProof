const express = require('express');
const router = express.Router();
const datingAuth = require('../middleware/datingAuth');
const {
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
} = require('../controllers/datingController');

// Post routes
router.post('/posts', datingAuth, createPost);
router.get('/posts/feed', datingAuth, getFeed);
router.get('/posts/:postId', datingAuth, getPost);
router.post('/posts/:postId/like', datingAuth, likePost);
router.put('/posts/:postId', datingAuth, updatePost);
router.delete('/posts/:postId', datingAuth, deletePost);

// Post comments routes
router.get('/posts/:postId/comments', datingAuth, getComments);
router.post('/posts/:postId/comments', datingAuth, createComment);
router.delete('/posts/comments/:commentId', datingAuth, deleteComment);

// User routes
router.get('/users/me', datingAuth, (req, res) => res.json(req.user));
router.get('/users/search', datingAuth, searchUsers);
router.get('/users/profile/:userId', datingAuth, getProfile);
router.put('/users/profile', datingAuth, updateProfile);

// Social connection routes
router.post('/social/friend-request', datingAuth, sendFriendRequest);
router.post('/social/friend-request/:requestId/accept', datingAuth, acceptFriendRequest);
router.post('/social/accept-friendship', datingAuth, acceptFriendship);
router.post('/social/remove-friendship', datingAuth, removeFriendship);
router.post('/social/toggle-close-friend', datingAuth, toggleCloseFriend);
router.get('/social/friendships', datingAuth, getFriendships);

// Direct message history
router.get('/messages/unread-counts', datingAuth, getUnreadCounts);
router.get('/messages/:targetUserId', datingAuth, getMessages);

// Language Room routes
router.post('/language-rooms', datingAuth, createLanguageRoom);
router.delete('/language-rooms/:id', datingAuth, deleteLanguageRoom);
router.delete('/language-rooms/by-name/:roomName', datingAuth, deleteLanguageRoomByName);
router.get('/language-rooms', datingAuth, getLanguageRooms);

// Group Discussion routes
router.get('/groups', datingAuth, getGroups);
router.post('/groups', datingAuth, createGroup);
router.post('/groups/join', datingAuth, joinGroup);
router.post('/groups/leave', datingAuth, leaveGroup);
router.get('/groups/:groupId/messages', datingAuth, getGroupMessages);
router.post('/groups/:groupId/messages', datingAuth, sendGroupMessage);
router.get('/groups/:groupId', datingAuth, getGroupDetails);
router.put('/groups/:groupId/settings', datingAuth, updateGroupSettings);
router.post('/groups/:groupId/members', datingAuth, addGroupMember);
router.delete('/groups/:groupId/members/:userId', datingAuth, removeGroupMember);
router.delete('/groups/:groupId/messages/:messageId', datingAuth, deleteGroupMessage);

// Message delete routes
router.delete('/messages/:messageId', datingAuth, deleteMessage);

module.exports = router;
