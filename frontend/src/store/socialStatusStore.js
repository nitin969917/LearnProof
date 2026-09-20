import { create } from 'zustand';
import { getSocialSocket } from '../utils/socialSocket.js';
import { useSocialFeedStore } from './socialFeedStore.js';

export const useSocialStatusStore = create((set, get) => ({
  onlineUserIds: [],
  initializedForUserId: null,
  
  initializeStatus: (userId) => {
    if (!userId) return;
    const userIdStr = userId.toString();

    const socket = getSocialSocket(userIdStr);

    if (get().initializedForUserId === userIdStr) {
      if (socket.connected) {
        socket.emit('join', userIdStr);
      }
      return;
    }

    // Remove any stale listeners before adding fresh ones
    socket.off('getOnlineUsers');
    socket.off('userStatus');
    socket.off('NEW_POST');
    socket.off('POST_LIKE_UPDATED');
    socket.off('POST_SAVE_UPDATED');
    socket.off('POST_COMMENT_ADDED');
    socket.off('POST_COMMENT_DELETED');
    socket.off('POST_DELETED');
    socket.off('POST_UPDATED');
    socket.off('FRIEND_REQUEST_RECEIVED');
    socket.off('FRIEND_REQUEST_ACCEPTED');
    socket.off('FRIEND_REQUEST_REMOVED');
    
    socket.on('getOnlineUsers', (userIds) => {
      console.log('Received online users:', userIds);
      set({ onlineUserIds: Array.isArray(userIds) ? userIds.map(id => id.toString()) : [] });
    });
    
    socket.on('userStatus', ({ userId: updatedUserId, online }) => {
      console.log('User status update:', updatedUserId, online);
      if (!updatedUserId) return;
      const current = get().onlineUserIds;
      const idStr = updatedUserId.toString();
      if (online) {
        set({ onlineUserIds: [...new Set([...current, idStr])] });
      } else {
        set({ onlineUserIds: current.filter(id => id !== idStr) });
      }
    });

    socket.on('NEW_POST', (post) => {
      console.log('Real-time post received via socket:', post);
      useSocialFeedStore.getState().addPostLocally(post);
    });

    socket.on('POST_LIKE_UPDATED', (data) => {
      console.log('Real-time post like update received:', data);
      useSocialFeedStore.getState().handlePostLikeUpdated(data);
      window.dispatchEvent(new CustomEvent('social:post_like_updated', { detail: data }));
    });

    socket.on('POST_SAVE_UPDATED', (data) => {
      console.log('Real-time post save update received:', data);
      useSocialFeedStore.getState().handlePostSaveUpdated(data);
      window.dispatchEvent(new CustomEvent('social:post_save_updated', { detail: data }));
    });

    socket.on('POST_COMMENT_ADDED', (data) => {
      console.log('Real-time comment added received:', data);
      useSocialFeedStore.getState().handlePostCommentAdded(data);
      window.dispatchEvent(new CustomEvent('social:post_comment_added', { detail: data }));
    });

    socket.on('POST_COMMENT_DELETED', (data) => {
      console.log('Real-time comment deleted received:', data);
      useSocialFeedStore.getState().handlePostCommentDeleted(data);
      window.dispatchEvent(new CustomEvent('social:post_comment_deleted', { detail: data }));
    });

    socket.on('POST_DELETED', (data) => {
      console.log('Real-time post deleted received:', data);
      useSocialFeedStore.getState().handlePostDeleted(data);
      window.dispatchEvent(new CustomEvent('social:post_deleted', { detail: data }));
    });

    socket.on('POST_UPDATED', (post) => {
      console.log('Real-time post updated received:', post);
      useSocialFeedStore.getState().handlePostUpdated(post);
      window.dispatchEvent(new CustomEvent('social:post_updated', { detail: post }));
    });

    socket.on('FRIEND_REQUEST_RECEIVED', (data) => {
      console.log('Real-time friend request received:', data);
      useSocialFeedStore.getState().handleFriendRequestReceived(data);
    });

    socket.on('FRIEND_REQUEST_ACCEPTED', (data) => {
      console.log('Real-time friend request accepted:', data);
      useSocialFeedStore.getState().handleFriendRequestAccepted(data);
    });

    socket.on('FRIEND_REQUEST_REMOVED', (data) => {
      console.log('Real-time friend request removed:', data);
      useSocialFeedStore.getState().handleFriendRequestRemoved(data);
    });

    // Re-request the current online list
    socket.emit('join', userIdStr);

    set({ initializedForUserId: userIdStr });
  },
  
  isOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUserIds.some(id => id.toString() === userId.toString());
  }
}));
