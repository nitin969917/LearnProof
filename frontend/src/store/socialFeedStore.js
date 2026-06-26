import { create } from 'zustand';
import socialApi from '../api/socialApi.js';

export const useSocialFeedStore = create((set, get) => ({
  posts: [],
  friends: [],
  closeFriends: [],
  loadingPosts: false,
  loadingFriends: false,
  hasLoadedOnce: false,
  hasLoadedFriends: false,

  fetchPosts: async (force = false) => {
    const postsExist = get().posts.length > 0;
    if (!postsExist || force) {
      set({ loadingPosts: true });
    }
    
    try {
      const response = await socialApi.get('/posts/feed');
      set({ 
        posts: Array.isArray(response.data) ? response.data : [],
        loadingPosts: false,
        hasLoadedOnce: true
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
      const allFriends = Array.isArray(response.data?.friends) ? response.data.friends : [];
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
