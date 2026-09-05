import { create } from 'zustand';
import socialApi from '../api/socialApi.js';

export const useSocialFeedStore = create((set, get) => ({
  posts: [],
  friends: [],
  closeFriends: [],
  socialUser: (() => {
    try {
      const saved = localStorage.getItem('learnproof_social_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
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
  // Pending friend request badge count
  pendingFriendCount: 0,

  fetchPendingFriendCount: async () => {
    try {
      const response = await socialApi.get('/social/friend-requests/count');
      set({ pendingFriendCount: response.data?.count || 0 });
    } catch (err) {
      console.error('Failed to fetch pending friend count', err);
    }
  },

  incrementPendingFriendCount: () => {
    set((state) => ({ pendingFriendCount: state.pendingFriendCount + 1 }));
  },

  clearPendingFriendCount: () => {
    set({ pendingFriendCount: 0 });
  },

  fetchSocialUser: async (force = false) => {
    if (get().socialUser && !force) return;
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
      set({ loadingSocialUser: false });
    }
  },

  fetchPosts: async (force = false, isRefresh = false) => {
    if (isRefresh) {
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
      const response = await socialApi.get(`/posts/feed?limit=${limit}&page=${currentPage}`);
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
    
    try {
      const response = await socialApi.get('/social/friendships');
      const rawFriends = Array.isArray(response.data?.friends) ? response.data.friends : [];
      // Enforce strict uniqueness by user ID
      const allFriends = rawFriends.filter((f, idx, self) => 
        self.findIndex(item => item.id === f.id) === idx
      );
      const close = allFriends.filter(f => f.isCloseFriend);
      set({ 
        friends: allFriends, 
        closeFriends: close,
        loadingFriends: false,
        hasLoadedFriends: true
      });
    } catch (err) {
      console.error('Failed to fetch friends', err);
      set({ loadingFriends: false });
    }
  },

  addPostLocally: (newPost) => {
    const posts = get().posts;
    // Prevent duplicate adds from websocket and HTTP post callback
    if (posts.some(p => p.id === newPost.id)) return;
    set({ posts: [newPost, ...posts] });
  },

  likePost: async (postId, currentUserId) => {
    const posts = get().posts;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const liked = post.likes?.some(l => l.id === currentUserId);
    const nextLiked = !liked;

    // Optimistic update
    const updatedPost = {
      ...post,
      likes: nextLiked
        ? [...(post.likes || []), { id: currentUserId }]
        : (post.likes || []).filter(l => l.id !== currentUserId),
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

    try {
      await socialApi.post(`/posts/${postId}/like`);
    } catch (err) {
      console.error('Failed to like post', err);
      // Revert on failure
      const revertedPosts = [...get().posts];
      revertedPosts[postIndex] = post;
      set({ posts: revertedPosts });
    }
  },

  deletePost: async (postId) => {
    const posts = get().posts;
    const postToDelete = posts.find(p => p.id === postId);
    
    set({ posts: posts.filter(p => p.id !== postId) });

    try {
      await socialApi.delete(`/posts/${postId}`);
    } catch (err) {
      console.error('Failed to delete post', err);
      // Revert on failure
      if (postToDelete) {
        set({ posts: [postToDelete, ...get().posts] });
      }
    }
  },

  updatePost: async (postId, content, visibility) => {
    const posts = get().posts;
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const originalPost = posts[postIndex];
    const updatedPost = {
      ...originalPost,
      content,
      visibility
    };

    const newPosts = [...posts];
    newPosts[postIndex] = updatedPost;
    set({ posts: newPosts });

    try {
      await socialApi.put(`/posts/${postId}`, { content, visibility });
    } catch (err) {
      console.error('Failed to update post', err);
      // Revert on failure
      const revertedPosts = [...get().posts];
      revertedPosts[postIndex] = originalPost;
      set({ posts: revertedPosts });
      throw err;
    }
  }
}));
