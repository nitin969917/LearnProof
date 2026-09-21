import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Globe, Users2, Star, Trash2, Edit3, X, Check, Flag, UserX, AlertCircle, Bookmark } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import socialApi from '../../../api/socialApi.js';
import { useModal } from '../../../context/ModalContext';
import UserAvatar from '../../Common/UserAvatar.jsx';
import RenderableImage from '../../Common/RenderableImage.jsx';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import PostVisibilitySelector from './PostVisibilitySelector.jsx';

const renderContentWithHashtags = (text, onTagClick) => {
  if (!text) return null;
  const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (onTagClick) onTagClick(part);
          }}
          className="inline-block text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer bg-orange-50/80 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 px-1.5 py-0.5 rounded-md transition-colors mr-1 my-0.5"
          title={`Filter posts by ${part}`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

export default function SocialPostCard({ post, onLike, onSave, currentUserId, onViewProfile, onTagClick }) {
  const isAuthor = currentUserId === post.authorId;
  const { confirm } = useModal();

  const likePost = useSocialFeedStore(state => state.likePost);
  const savePost = useSocialFeedStore(state => state.savePost);
  const deletePost = useSocialFeedStore(state => state.deletePost);
  const updatePost = useSocialFeedStore(state => state.updatePost);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedVisibility, setEditedVisibility] = useState(post.visibility);

  // UGC Moderation State (Apple Guideline 1.2)
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isShared, setIsShared] = useState(false);

  // Likes Modal state
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesList, setLikesList] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // Derived values from store-managed post prop
  const liked = post.likes?.some((l) => l.id === currentUserId);
  const saved = post.savedBy?.some((l) => l.id === currentUserId) || post.isSaved || false;
  const likesCount = post._count?.likes || 0;

  // Local state only for comments count
  const [commentsCount, setCommentsCount] = useState(() => post._count?.comments || 0);

  useEffect(() => {
    setCommentsCount(post._count?.comments || 0);
  }, [post._count?.comments]);

  // Real-time synchronization for comments when comments are open or post is rendered
  useEffect(() => {
    const handleCommentAdded = (e) => {
      const { postId, comment } = e.detail;
      if (postId === post.id) {
        setComments(prev => {
          if (prev.some(c => c.id === comment.id)) return prev;
          const optIdx = prev.findIndex(c => c.isOptimistic && c.authorId === comment.authorId && c.content === comment.content);
          if (optIdx !== -1) {
            const next = [...prev];
            next[optIdx] = comment;
            return next;
          }
          return [...prev, comment];
        });
      }
    };

    const handleCommentDeleted = (e) => {
      const { postId, commentId } = e.detail;
      if (postId === post.id) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    };

    window.addEventListener('social:comment_added', handleCommentAdded);
    window.addEventListener('social:comment_deleted', handleCommentDeleted);

    return () => {
      window.removeEventListener('social:comment_added', handleCommentAdded);
      window.removeEventListener('social:comment_deleted', handleCommentDeleted);
    };
  }, [post.id]);

  const handleLike = async () => {
    try {
      await likePost(post.id, currentUserId);
      if (onLike) onLike(post.id);
    } catch (err) {
      console.error('Error liking post', err);
    }
  };

  const handleSave = async (e) => {
    if (e) e.stopPropagation();
    setShowMenu(false);
    try {
      await savePost(post.id, currentUserId);
      if (onSave) onSave(post.id);
    } catch (err) {
      console.error('Error saving post', err);
    }
  };

  const fetchLikesList = async () => {
    setLoadingLikes(true);
    setShowLikesModal(true);
    try {
      const res = await socialApi.get(`/posts/${post.id}/likes`);
      setLikesList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch likes', err);
      setLikesList([]);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleDeleteClick = async () => {
    setShowMenu(false);
    const confirmed = await confirm({
      title: "Delete Post?",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });

    if (confirmed) {
      deletePost(post.id);
    }
  };

  const handleReportPost = async () => {
    try {
      setIsSubmittingReport(true);
      await socialApi.post('/social/report', {
        targetType: 'post',
        targetId: post.id,
        reason: reportReason,
        details: reportDetails
      });
      toast.success("Report submitted. Our safety team reviews all reports within 24 hours.");
      setShowReportModal(false);
      setShowMenu(false);
      setIsSubmittingReport(false);
    } catch (err) {
      toast.error("Failed to submit report.");
      setIsSubmittingReport(false);
    }
  };

  const handleBlockUser = async () => {
    setShowMenu(false);
    const authorName = post.author?.name || 'this user';
    const targetUserId = post.authorId || post.author?.id;
    if (!targetUserId) return;

    const confirmed = await confirm({
      title: `Block ${authorName}?`,
      message: `You will no longer see posts or comments from ${authorName}.`,
      confirmText: 'Block User',
      type: 'danger'
    });
    if (!confirmed) return;

    const targetIdNum = Number(targetUserId);

    // Optimistic UI updates
    setIsBlocked(true);
    useSocialFeedStore.setState(state => ({
      posts: state.posts.filter(p => Number(p.authorId || p.author?.id) !== targetIdNum),
      friends: state.friends.filter(f => Number(f.id) !== targetIdNum),
      closeFriends: state.closeFriends.filter(f => Number(f.id) !== targetIdNum)
    }));

    try {
      await socialApi.post('/social/block', { targetUserId: targetIdNum });
      toast.success(`${authorName} has been blocked.`);
    } catch (err) {
      console.error('Failed to block user', err);
      toast.error("Failed to block user.");
    }
  };

  const handleCommentDeleteClick = async (commentId) => {
    const confirmed = await confirm({
      title: "Delete Comment?",
      message: "Are you sure you want to delete this comment? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });

    if (confirmed) {
      try {
        await socialApi.delete(`/posts/comments/${commentId}`);
        setComments(comments.filter(c => c.id !== commentId));
        setCommentsCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to delete comment', err);
      }
    }
  };

  const handleUpdate = async () => {
    try {
      await updatePost(post.id, editedContent, editedVisibility);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update post', err);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await socialApi.get(`/posts/${post.id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const socialUser = useSocialFeedStore(state => state.socialUser);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentText = newComment.trim();
    setNewComment('');

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempId,
      content: commentText,
      postId: post.id,
      authorId: currentUserId,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUserId,
        name: socialUser?.name || 'You',
        profilePicture: socialUser?.profilePicture || null
      },
      isOptimistic: true
    };

    // Optimistically update
    setComments(prev => [...prev, optimisticComment]);
    setCommentsCount(prev => prev + 1);

    try {
      const res = await socialApi.post(`/posts/${post.id}/comments`, {
        content: commentText
      });
      // Replace optimistic comment with real database comment
      setComments(prev => prev.map(c => c.id === tempId ? res.data : c));
    } catch (err) {
      console.error('Failed to submit comment', err);
      // Revert on failure
      setComments(prev => prev.filter(c => c.id !== tempId));
      setCommentsCount(prev => Math.max(0, prev - 1));
      setNewComment(commentText); // Restore input value
    }
  };

  const handleShare = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const shareUrl = `${window.location.origin}/dashboard/social?post=${post.id}`;
    const authorName = post.author?.name || 'LearnProof Community';
    const shareTitle = `${authorName} on LearnProof`;
    const shareText = post.content 
      ? (post.content.length > 120 ? `${post.content.substring(0, 117)}...` : post.content)
      : `Check out this post by ${authorName} on LearnProof`;

    // 1. Try Capacitor Native Share if running in mobile app container
    try {
      if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: 'Share Post'
        });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      console.debug('Capacitor share error:', err);
    }

    // 2. Try Web Share API (native on iOS Safari, Android Chrome, macOS, Edge, etc.)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        // User dismissed the share drawer or aborted
        if (err?.name === 'AbortError') return;
        console.debug('Web share error:', err);
      }
    }

    // 3. Fallback for browsers that do not support native Web Share (e.g. desktop non-Safari)
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsShared(true);
      toast.success('Post link copied to clipboard!');
      setTimeout(() => setIsShared(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link', err);
    }
  };

  if (isBlocked) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100/90 dark:border-gray-700/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 pb-2.5 sm:pb-3">
        <div 
          onClick={() => onViewProfile(post.author.id)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <UserAvatar 
            src={post.author.profilePicture} 
            name={post.author.name} 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0" 
            textClassName="text-base"
          />
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white hover:text-orange-500 transition-colors text-sm sm:text-[15px]">{post.author.name}</h4>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs">
               <span>{new Date(post.createdAt).toLocaleDateString()}</span>
               <span>•</span>
               <div className="flex items-center gap-1">
                  {post.visibility === 'public' && <Globe size={12} />}
                  {post.visibility === 'friends' && <Users2 size={12} />}
                  {post.visibility === 'close_friends' && <Star size={12} className="text-amber-500" fill="currentColor" />}
                  <span className="capitalize">{post.visibility?.replace('_', ' ')}</span>
               </div>
            </div>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition cursor-pointer"
            title="Post options"
          >
            <MoreHorizontal size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 min-w-[160px] p-1.5 flex flex-col gap-1">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition font-medium cursor-pointer"
              >
                <Bookmark size={15} fill={saved ? 'currentColor' : 'transparent'} className={saved ? 'text-amber-500' : ''} />
                <span>{saved ? 'Remove from Saved' : 'Save Post'}</span>
              </button>
              {isAuthor ? (
                <>
                  <button 
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 hover:text-orange-600 dark:hover:text-orange-400 transition font-medium cursor-pointer"
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button 
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/35 transition font-medium cursor-pointer"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/35 transition font-medium cursor-pointer"
                  >
                    <Flag size={15} /> Report Post
                  </button>
                  <button 
                    onClick={handleBlockUser}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/35 transition font-medium cursor-pointer"
                  >
                    <UserX size={15} /> Block User
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        {isEditing ? (
          <div className="flex flex-col gap-3 px-3.5 sm:px-4 pb-3">
            <textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[100px] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex justify-between items-center">
                <PostVisibilitySelector
                  value={editedVisibility}
                  onChange={setEditedVisibility}
                  placement="bottom"
                />
               <div className="flex gap-2">
                  <button 
                    onClick={() => { setIsEditing(false); setEditedContent(post.content); setEditedVisibility(post.visibility); }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center gap-1.5 transition"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 transition shadow-sm hover:shadow"
                  >
                    <Check size={14} /> Save
                  </button>
               </div>
            </div>
          </div>
        ) : (
          post.content && (
            <p className="px-3.5 sm:px-4 pb-2.5 sm:pb-3 text-gray-900 dark:text-gray-100 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words font-normal">
              {renderContentWithHashtags(post.content, onTagClick)}
            </p>
          )
        )}
        
        {post.image && (
          <div className="w-full bg-black/5 dark:bg-black/35 flex justify-center items-center overflow-hidden border-t border-gray-100 dark:border-gray-700/60">
            <RenderableImage 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto max-h-[600px] object-cover sm:object-contain" 
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5 sm:gap-6 border-t border-gray-100 dark:border-gray-700/70 px-3.5 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-1.5 font-semibold text-xs md:text-sm">
          <button 
            type="button"
            onClick={handleLike}
            className={`p-1 -m-1 rounded-full transition-transform active:scale-125 ${
              liked 
                ? 'text-orange-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-orange-500'
            }`}
            title={liked ? "Unlike" : "Like"}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'transparent'} />
          </button>
          <button
            type="button"
            onClick={() => likesCount > 0 && fetchLikesList()}
            disabled={likesCount === 0}
            className={`transition-colors select-none ${
              likesCount > 0 
                ? 'hover:underline cursor-pointer' 
                : 'cursor-default'
            } ${
              liked ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'
            }`}
            title={likesCount > 0 ? "View who liked this post" : "No likes yet"}
          >
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </button>
        </div>

        <button 
          onClick={toggleComments}
          className={`flex items-center gap-1.5 font-semibold text-xs md:text-sm transition-colors ${
            showComments 
              ? 'text-orange-500' 
              : 'text-gray-500 dark:text-gray-400 hover:text-orange-500'
          }`}
        >
          <MessageCircle size={18} fill={showComments ? 'currentColor' : 'transparent'} />
          <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
        </button>

        <button 
          onClick={handleShare}
          className={`hover:text-orange-500 ml-auto transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
            isShared ? 'text-green-500 hover:text-green-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Share post"
        >
          {isShared ? (
            <>
              <Check size={18} />
              <span className="text-[10px] md:text-xs">Copied!</span>
            </>
          ) : (
            <Share2 size={18} />
          )}
        </button>

        <button 
          onClick={handleSave}
          className={`transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
            saved ? 'text-amber-500 hover:text-amber-600' : 'text-gray-500 dark:text-gray-400 hover:text-amber-500'
          }`}
          title={saved ? "Remove from saved" : "Save post"}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'transparent'} />
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-gray-100 dark:border-gray-700/70 p-3.5 sm:p-4 bg-gray-50/40 dark:bg-gray-900/30">
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Write a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white text-xs md:text-sm font-bold rounded-xl transition"
            >
              Post
            </button>
          </form>

          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {comments.map((comment) => {
                const isCommentAuthor = currentUserId === comment.authorId;
                const canDelete = (isCommentAuthor || isAuthor) && !comment.isOptimistic; // comment author or post author, disable if optimistic
                return (
                  <div key={comment.id} className={`flex gap-3 text-xs md:text-sm items-start bg-gray-50/50 dark:bg-gray-900/30 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-700/30 transition-opacity duration-200 ${comment.isOptimistic ? 'opacity-65' : ''}`}>
                    <UserAvatar 
                      src={comment.author.profilePicture} 
                      name={comment.author.name} 
                      className={`w-8 h-8 rounded-full ${comment.isOptimistic ? 'cursor-default' : 'cursor-pointer'}`}
                      textClassName="text-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span 
                          onClick={() => !comment.isOptimistic && onViewProfile(comment.author.id)}
                          className={`font-bold text-gray-900 dark:text-white transition-colors ${comment.isOptimistic ? 'cursor-default' : 'hover:text-orange-500 cursor-pointer'}`}
                        >
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-550">
                          {comment.isOptimistic ? 'Posting...' : new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                    {canDelete && (
                      <button 
                        onClick={() => handleCommentDeleteClick(comment.id)}
                        className="text-gray-400 hover:text-red-500 p-0.5 rounded transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}

              {comments.length === 0 && (
                <p className="text-center py-4 text-xs text-gray-400 dark:text-gray-500 font-medium">No comments yet. Be the first to comment!</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Liked By Modal */}
      {showLikesModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowLikesModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-orange-500 fill-orange-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Liked by ({loadingLikes ? '...' : likesList.length})
                </h3>
              </div>
              <button 
                onClick={() => setShowLikesModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingLikes ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-orange-500 border-t-transparent"></div>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Loading likes...</p>
                </div>
              ) : likesList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No likes found.
                </div>
              ) : (
                likesList.map((user) => (
                  <div 
                    key={user.id}
                    onClick={() => {
                      setShowLikesModal(false);
                      onViewProfile(user.id);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/50 dark:hover:bg-gray-700/50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar 
                        src={user.profilePicture} 
                        name={user.name} 
                        className="w-10 h-10 rounded-full"
                        textClassName="text-sm font-bold"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-orange-500 transition-colors truncate">
                          {user.name} {user.id === currentUserId && <span className="text-xs text-gray-400 font-normal">(You)</span>}
                        </h4>
                        {user.bio && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      type="button"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition"
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* UGC Report Modal (Apple Guideline 1.2) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Flag size={18} />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Report Content</h3>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Please select the reason for reporting this post. Our safety and moderation team acts on all reports within 24 hours.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Inappropriate Content">Inappropriate / Explicit Content</option>
                <option value="Harassment or Bullying">Harassment or Bullying</option>
                <option value="Hate Speech">Hate Speech</option>
                <option value="Spam or Scam">Spam or Scam</option>
                <option value="Misinformation">Misinformation</option>
                <option value="Other">Other Policy Violation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Details (Optional)</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide additional context..."
                rows={2}
                className="w-full text-xs p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReport}
                onClick={handleReportPost}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
