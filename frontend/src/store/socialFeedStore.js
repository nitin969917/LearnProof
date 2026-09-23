import { create } from 'zustand';
import socialApi from '../api/socialApi.js';

let inFlightFetchSocialUser = null;
let inFlightFetchFriends = null;

export const useSocialFeedStore = create((set, get) => ({
  posts: [],
  friends: [],
  closeFriends: [],
  socialUser: (() => {
    try {
      const saved = localStorage.getItem('learnproof_social_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && typeof parsed.id === 'number' ? parsed : null;
    } catch {
      return null;
    }
  })(),
  loadingPosts: false,
  loadingFriends: false,
  loadingSocialUser: false,
  hasLoadedOnce: false,
  hasLoadedFriends: false,
  feedPage: 0,
  hasMorePosts: true,
  selectedTag: null,
  setSelectedTag: (tag) => set({ selectedTag: tag, feedPage: 0, hasMorePosts: true }),
  // Pending friend request badge count & list
  pendingFriendCount: 0,
  pendingRequests: [],

  // Live / Active language rooms tracking for notification indicators (only friends' rooms)
  activeRoomsCount: 0,
  setActiveRoomsCount: (count) => set({ activeRoomsCount: count }),
  fetchActiveRoomsCount: async () => {
    try {
      let friendsList = get().friends;
      if (!get().hasLoadedFriends || !Array.isArray(friendsList) || friendsList.length === 0) {
        try {
          const fRes = await socialApi.get('/social/friendships');
          friendsList = Array.isArray(fRes.data?.friends) ? fRes.data.friends : [];
          set({ friends: friendsList, hasLoadedFriends: true });
        } catch (e) {}
      }

      const friendIds = new Set((friendsList || []).map(f => Number(f.id)));
      if (friendIds.size === 0) {
        set({ activeRoomsCount: 0 });
        return;
      }

      const response = await socialApi.get('/language-rooms');
      const rooms = Array.isArray(response.data) ? response.data : [];
      const currentUserId = get().socialUser?.id ? Number(get().socialUser.id) : null;

      const friendRooms = rooms.filter(r => {
        const isFutureScheduled = r.scheduledFor && new Date(r.scheduledFor).getTime() > Date.now() && !r.isStartedNotificationSent;
        if (isFutureScheduled) return false;
        
        const creatorId = Number(r.creatorId || r.creator?.id);
        return creatorId !== currentUserId && friendIds.has(creatorId);
      });

      set({ activeRoomsCount: friendRooms.length });
    } catch (err) {
      // Quietly handle
    }
  },

  setPendingRequests: (requests) => set({ 
    pendingRequests: requests, 
    pendingFriendCount: requests.length 
  }),

  fetchPendingFriendCount: async () => {
    try {
      const response = await socialApi.get('/social/friendships');
      const rawPending = Array.isArray(response.data?.pending) ? response.data.pending : [];
      set({ 
        pendingRequests: rawPending, 
        pendingFriendCount: rawPending.length 
      });
    } catch (err) {
      console.error('Failed to fetch pending friend count', err);
    }
  },

  incrementPendingFriendCount: () => {
    set((state) => ({ pendingFriendCount: state.pendingFriendCount + 1 }));
  },

  clearPendingFriendCount: () => {
    set({ pendingFriendCount: 0, pendingRequests: [] });
  },

  acceptFriendRequestLocally: (requestId) => {
    set((state) => {
      const nextPending = state.pendingRequests.filter(r => r.id !== requestId);
      return {
        pendingRequests: nextPending,
        pendingFriendCount: nextPending.length
      };
    });
  },

  declineFriendRequestLocally: (senderId) => {
    set((state) => {
      const nextPending = state.pendingRequests.filter(r => r.senderId !== senderId);
      return {
        pendingRequests: nextPending,
        pendingFriendCount: nextPending.length
      };
    });
  },

  updateSocialUser: (partialData) => {
    set((state) => {
      if (!state.socialUser) return {};
      const updated = {
        ...state.socialUser,
        ...partialData
      };
      try {
        localStorage.setItem('learnproof_social_user', JSON.stringify(updated));
      } catch (e) {}
      return { socialUser: updated };
    });
  },

  fetchSocialUser: async (force = false, authUser = null) => {
    // If we already have a verified user with a numeric database ID, avoid redundant network hit unless forced
    if (get().socialUser && typeof get().socialUser.id === 'number' && !force) return;

    // Optimistically set fallback user if available to prevent UI lockup
    if (!get().socialUser && authUser) {
      set({
        socialUser: {
          id: typeof authUser.id === 'number' ? authUser.id : null,
          name: authUser.name || 'Student',
          email: authUser.email || '',
          profilePicture: authUser.picture || '',
          avatar: authUser.picture || ''
        }
      });
    }

    if (inFlightFetchSocialUser) return inFlightFetchSocialUser;

    inFlightFetchSocialUser = (async () => {
      set({ loadingSocialUser: true });
      try {
        const response = await socialApi.get('/users/me');
        if (response.data && response.data.id) {
          set({ 
            socialUser: response.data,
            loadingSocialUser: false 
          });
          try {
            localStorage.setItem('learnproof_social_user', JSON.stringify(response.data));
          } catch (e) {}
        } else {
          set({ loadingSocialUser: false });
        }
      } catch (err) {
        console.error('Failed to fetch social user', err);
        if (!get().socialUser && authUser) {
          set({
            socialUser: {
              id: authUser.id || authUser.uid,
              name: authUser.name || 'Student',
              email: authUser.email || '',
              profilePicture: authUser.picture || '',
              avatar: authUser.picture || ''
            }
          });
        }
        set({ loadingSocialUser: false });
      }
    })().finally(() => {
      inFlightFetchSocialUser = null;
    });

    return inFlightFetchSocialUser;
  },

  fetchPosts: async (force = false, isRefresh = false, overrideTag = undefined) => {
    let activeTag = get().selectedTag;
    if (overrideTag !== undefined) {
      activeTag = overrideTag;
      set({ selectedTag: overrideTag, feedPage: 0, hasMorePosts: true });
      isRefresh = true;
    } else if (isRefresh) {
      set({ feedPage: 0, hasMorePosts: true });
    }
    const currentPage = isRefresh ? 0 : get().feedPage;
    const isMore = get().hasMorePosts;
    if (!isMore && !isRefresh) return;

    const postsExist = get().posts.length > 0;
    if (!postsExist || force || isRefresh) {
      set({ loadingPosts: true });
    }
    
    try {
      const limit = 10;
      const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : '';
      const response = await socialApi.get(`/posts/feed?limit=${limit}&page=${currentPage}${tagParam}`);
      const fetchedPosts = Array.isArray(response.data) ? response.data : [];
      
      set((state) => {
        const nextPosts = isRefresh ? fetchedPosts : [...state.posts, ...fetchedPosts];
        // Deduplicate posts
        const uniquePosts = nextPosts.filter((post, index, self) => 
          self.findIndex(p => p.id === post.id) === index
        );
        return {
          posts: uniquePosts,
          loadingPosts: false,
          hasLoadedOnce: true,
          feedPage: currentPage + 1,
          hasMorePosts: fetchedPosts.length === limit,
        };
      });
    } catch (err) {
      console.error('Failed to fetch posts', err);
      set({ loadingPosts: false });
    }
  },

  fetchFriends: async (force = false) => {
    const friendsExist = get().friends.length > 0;
    if (!friendsExist || force) {
      set({ loadingFriends: true });
    }

    if (inFlightFetchFriends && !force) return inFlightFetchFriends;
    
    inFlightFetchFriends = (async () => {
      try {
        const response = await socialApi.get('/social/friendships');
        const rawFriends = Array.isArray(response.data?.friends) ? response.data.friends : [];
        const rawPending = Array.isArray(response.data?.pending) ? response.data.pending : [];
        // Enforce strict uniqueness by user ID (numeric comparison)
        const allFriends = rawFriends.filter((f, idx, self) => 
          self.findIndex(item => Number(item.id) === Number(f.id)) === idx
        );
        const close = allFriends.filter(f => f.isCloseFriend);
        set({ 
          friends: allFriends, 
          closeFriends: close,
          pendingRequests: rawPending,
          pendingFriendCount: rawPending.length,
          loadingFriends: false,
          hasLoadedFriends: true
        });
      } catch (err) {
        console.error('Failed to fetch friends', err);
        set({ loadingFriends: false, hasLoadedFriends: true });
      }
    })().finally(() => {
      inFlightFetchFriends = null;
    });

    return inFlightFetchFriends;
  },

  syncLatestPosts: async (silent = true) => {
    try {
      const activeTag = get().selectedTag;
      const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : '';
      const response = await socialApi.get(`/posts/feed?limit=10&page=0${tagParam}`);
      const latestPosts = Array.isArray(response.data) ? response.data : [];
      if (latestPosts.length === 0) return;

      set((state) => {
        const existingMap = new Map(state.posts.map(p => [p.id, p]));
        const newIncoming = [];

        for (const post of latestPosts) {
          if (!existingMap.has(post.id)) {
            newIncoming.push(post);
          } else {
            const existing = existingMap.get(post.id);
            existingMap.set(post.id, {
              ...existing,
              ...post,
              likes: post.likes || existing.likes,
              _count: post._count || existing._count
            });
          }
        }

        if (newIncoming.length > 0) {
          return { posts: [...newIncoming, ...state.posts] };
        } else {
          return { posts: state.posts.map(p => existingMap.get(p.id) || p) };
        }
      });
    } catch (err) {
      // Background sync quietly handles errors
    }
  },

  addPostLocally: (newPost) => {
    if (!newPost || !newPost.id) return;
    const posts = get().posts;
    if (posts.some(p => p.id === newPost.id)) {
      set({
        posts: posts.map(p => p.id === newPost.id ? { ...p, ...newPost } : p)
      });
      return;
    }
    const formatted = {
      ...newPost,
      likes: Array.isArray(newPost.likes) ? newPost.likes : [],
      comments: Array.isArray(newPost.comments) ? newPost.comments : [],
      _count: {
        likes: typeof newPost._count?.likes === 'number'
          ? newPost._count.likes
          : (Array.isArray(newPost.likes) ? newPost.likes.length : 0),
        comments: typeof newPost._count?.comments === 'number'
          ? newPost._count.comments
          : (Array.isArray(newPost.comments) ? newPost.comments.length : 0)
      }
    };
    set({ posts: [formatted, ...posts] });
  },

  handlePostUpdated: (updatedPost) => {
    if (!updatedPost || !updatedPost.id) return;
    set((state) => ({
      posts: state.posts.map(p => {
        if (p.id === updatedPost.id) {
          return {
            ...p,
            ...updatedPost,
            likes: updatedPost.likes || p.likes,
            _count: {
              ...p._count,
              ...(updatedPost._count || {})
            }
          };
        }
        return p;
      })
    }));
  },

  likePost: async (postId, currentUserId) => {
    const posts = get().posts;
    const postIndex = posts.findIndex(p => p.id === postId);
    let post = null;
    const myId = currentUserId ? String(currentUserId) : '';

    if (postIndex !== -1) {
      post = posts[postIndex];
      const liked = Boolean(
        post.isLiked ||
        post.liked ||
        (myId && post.likes?.some(l => String(l?.id ?? l) === myId))
      );
      const nextLiked = !liked;

      // Optimistic update
      const updatedPost = {
        ...post,
        isLiked: nextLiked,
        liked: nextLiked,
        likes: nextLiked
          ? [...(post.likes || []), { id: currentUserId }]
          : (post.likes || []).filter(l => String(l?.id ?? l) !== myId),
        _count: {
          ...post._count,
          likes: nextLiked
            ? (post._count?.likes || 0) + 1
            : Math.max(0, (post._count?.likes || 0) - 1)
        }
      };

      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      set({ posts: newPosts });
    }

    try {
      await socialApi.post(`/posts/${postId}/like`);
    } catch (err) {
      console.error('Failed to like post', err);
      // Revert on failure
      if (postIndex !== -1 && post) {
        const revertedPosts = [...get().posts];
        revertedPosts[postIndex] = post;
        set({ posts: revertedPosts });
      }
      throw err;
    }
  },

  deletePost: async (postId) => {
    const posts = get().posts;
    const postToDelete = posts.find(p => p.id === postId);
    
    if (postToDelete) {
      set({ posts: posts.filter(p => p.id !== postId) });
    }

    try {
      await socialApi.delete(`/posts/${postId}`);
    } catch (err) {
      console.error('Failed to delete post', err);
      // Revert on failure
      if (postToDelete) {
        set({ posts: [postToDelete, ...get().posts] });
      }
      throw err;
    }
  },

  updatePost: async (postId, content, visibility) => {
    const posts = get().posts;
    const postIndex = posts.findIndex(p => p.id === postId);
    let originalPost = null;

    if (postIndex !== -1) {
      originalPost = posts[postIndex];
      const updatedPost = {
        ...originalPost,
        content,
        visibility
      };

      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      set({ posts: newPosts });
    }

    try {
      await socialApi.put(`/posts/${postId}`, { content, visibility });
    } catch (err) {
      console.error('Failed to update post', err);
      // Revert on failure
      if (postIndex !== -1 && originalPost) {
        const revertedPosts = [...get().posts];
        revertedPosts[postIndex] = originalPost;
        set({ posts: revertedPosts });
      }
      throw err;
    }
  },

  savePost: async (postId, currentUserId) => {
    const posts = get().posts;
    const postIndex = posts.findIndex(p => p.id === postId);
    let post = null;
    const myId = currentUserId ? String(currentUserId) : '';

    if (postIndex !== -1) {
      post = posts[postIndex];
      const isSaved = Boolean(
        post.isSaved ||
        post.saved ||
        (myId && post.savedBy?.some(u => String(u?.id ?? u) === myId))
      );
      const nextSaved = !isSaved;

      const updatedPost = {
        ...post,
        isSaved: nextSaved,
        saved: nextSaved,
        savedBy: nextSaved
          ? [...(post.savedBy || []), { id: currentUserId }]
          : (post.savedBy || []).filter(u => String(u?.id ?? u) !== myId)
      };

      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      set({ posts: newPosts });
    }

    try {
      const res = await socialApi.post(`/posts/${postId}/save`);
      return res.data;
    } catch (err) {
      console.error('Failed to toggle save post', err);
      if (postIndex !== -1 && post) {
        const revertedPosts = [...get().posts];
        revertedPosts[postIndex] = post;
        set({ posts: revertedPosts });
      }
      throw err;
    }
  },

  handlePostSaveUpdated: ({ postId, userId, isSaved }) => {
    const currentUserId = get().socialUser?.id;
    set((state) => ({
      posts: state.posts.map(post => {
        if (post.id === postId) {
          let updatedSaved = post.savedBy || [];
          if (currentUserId && userId === currentUserId) {
            if (isSaved) {
              if (!updatedSaved.some(u => u.id === currentUserId)) {
                updatedSaved = [...updatedSaved, { id: currentUserId }];
              }
            } else {
              updatedSaved = updatedSaved.filter(u => u.id !== currentUserId);
            }
          }
          return {
            ...post,
            savedBy: updatedSaved
          };
        }
        return post;
      })
    }));
  },

  handlePostLikeUpdated: ({ postId, userId, isLiked, likesCount }) => {
    const currentUserId = get().socialUser?.id;
    set((state) => ({
      posts: state.posts.map(post => {
        if (post.id === postId) {
          let updatedLikes = post.likes || [];
          if (currentUserId && userId === currentUserId) {
            if (isLiked) {
              if (!updatedLikes.some(l => l.id === currentUserId)) {
                updatedLikes = [...updatedLikes, { id: currentUserId }];
              }
            } else {
              updatedLikes = updatedLikes.filter(l => l.id !== currentUserId);
            }
          }
          return {
            ...post,
            likes: updatedLikes,
            _count: {
              ...post._count,
              likes: typeof likesCount === 'number'
                ? likesCount
                : (isLiked ? (post._count?.likes || 0) + 1 : Math.max(0, (post._count?.likes || 0) - 1))
            }
          };
        }
        return post;
      })
    }));
  },

  handlePostCommentAdded: ({ postId, comment, commentsCount }) => {
    set((state) => ({
      posts: state.posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            _count: {
              ...post._count,
              comments: typeof commentsCount === 'number'
                ? commentsCount
                : (post._count?.comments || 0) + 1
            }
          };
        }
        return post;
      })
    }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('social:comment_added', {
        detail: { postId, comment, commentsCount }
      }));
    }
  },

  handlePostCommentDeleted: ({ postId, commentId, commentsCount }) => {
    set((state) => ({
      posts: state.posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            _count: {
              ...post._count,
              comments: typeof commentsCount === 'number'
                ? commentsCount
                : Math.max(0, (post._count?.comments || 0) - 1)
            }
          };
        }
        return post;
      })
    }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('social:comment_deleted', {
        detail: { postId, commentId, commentsCount }
      }));
    }
  },

  handlePostDeleted: ({ postId }) => {
    set((state) => ({
      posts: state.posts.filter(post => post.id !== postId)
    }));
  },

  handleFriendRequestReceived: (data) => {
    if (!data) return;
    const { requestId, sender } = data;
    set((state) => {
      const alreadyHas = state.pendingRequests.some(r => r.id === requestId || (sender && r.senderId === sender.id));
      if (alreadyHas) return {};
      const newRequest = {
        id: requestId,
        senderId: sender?.id,
        sender: sender,
        createdAt: new Date().toISOString()
      };
      return {
        pendingRequests: [newRequest, ...state.pendingRequests],
        pendingFriendCount: state.pendingFriendCount + 1
      };
    });
  },

  handleFriendRequestAccepted: ({ requestId, userId, targetUserId, friend }) => {
    const targetId = Number(friend?.id || targetUserId || userId);
    set((state) => {
      const nextPending = state.pendingRequests.filter(r => r.id !== requestId && Number(r.senderId) !== targetId && Number(r.id) !== targetId);
      const alreadyFriend = state.friends.some(f => Number(f.id) === targetId);
      const newFriends = alreadyFriend ? state.friends : [...state.friends, friend || { id: targetId }];
      return {
        friends: newFriends,
        pendingRequests: nextPending,
        pendingFriendCount: nextPending.length
      };
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('social:friend_accepted', {
        detail: { requestId, userId: targetId, targetUserId: targetId, friend }
      }));
    }
  },

  handleFriendRequestRemoved: ({ userId }) => {
    const targetId = Number(userId);
    set((state) => ({
      friends: state.friends.filter(f => Number(f.id) !== targetId),
      pendingRequests: state.pendingRequests.filter(r => Number(r.senderId) !== targetId && Number(r.id) !== targetId),
      pendingFriendCount: state.pendingRequests.filter(r => Number(r.senderId) !== targetId && Number(r.id) !== targetId).length
    }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('social:friend_removed', {
        detail: { userId: targetId }
      }));
    }
  }
}));
