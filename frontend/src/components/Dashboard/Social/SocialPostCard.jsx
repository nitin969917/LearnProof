import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Globe, Users, Star, Trash2, Edit3, X, Check } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';

export default function SocialPostCard({ post, onLike, currentUserId, onViewProfile }) {
  const isLiked = post.likes?.some((l) => l.id === currentUserId);
  const isAuthor = currentUserId === post.authorId;

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedVisibility, setEditedVisibility] = useState(post.visibility);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleLike = async () => {
    try {
      await socialApi.post(`/posts/${post.id}/like`);
      onLike();
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await socialApi.delete(`/posts/${post.id}`);
      onLike(); // Refresh feed
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const handleUpdate = async () => {
    try {
      await socialApi.put(`/posts/${post.id}`, { 
        content: editedContent, 
        visibility: editedVisibility 
      });
      setIsEditing(false);
      onLike(); // Refresh feed
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await socialApi.post(`/posts/${post.id}/comments`, {
        content: newComment
      });
      setNewComment('');
      setComments([...comments, res.data]);
      onLike(); // Refresh comment count on post card
    } catch (err) {
      console.error('Failed to submit comment', err);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await socialApi.delete(`/posts/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      onLike(); // Refresh comment count on post card
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/dashboard/social?post=${post.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    }).catch(err => {
      console.error('Failed to copy share link', err);
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div 
          onClick={() => onViewProfile(post.author.id)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            {post.author.profilePicture ? (
              <img src={post.author.profilePicture} alt={post.author.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-lg">
                {post.author.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white hover:text-orange-500 transition-colors">{post.author.name}</h4>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
               <span>{new Date(post.createdAt).toLocaleDateString()}</span>
               <span>•</span>
               <div className="flex items-center gap-1">
                  {post.visibility === 'public' && <Globe size={12} />}
                  {post.visibility === 'friends' && <Users size={12} />}
                  {post.visibility === 'close_friends' && <Star size={12} className="text-amber-500" fill="currentColor" />}
                  <span className="capitalize">{post.visibility?.replace('_', ' ')}</span>
               </div>
            </div>
          </div>
        </div>
        
        {isAuthor && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition"
            >
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-650 rounded-xl shadow-xl z-20 min-w-[140px] p-1.5 flex flex-col gap-1">
                <button 
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-600 hover:text-orange-600 dark:hover:text-orange-400 transition font-medium"
                >
                  <Edit3 size={16} /> Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/35 transition font-medium"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[100px] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex justify-between items-center">
               <select 
                  value={editedVisibility}
                  onChange={(e) => setEditedVisibility(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer font-medium"
               >
                  <option value="public">🌐 Public</option>
                  <option value="friends">👥 Friends</option>
                  <option value="close_friends">⭐️ Close Friends</option>
               </select>
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
          <p className="text-gray-800 dark:text-gray-200 text-sm md:text-base white-space-pre-wrap font-medium">{post.content}</p>
        )}
        
        {post.image && (
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-750 bg-gray-50 dark:bg-gray-900/30 flex justify-center items-center">
            <img 
              src={post.image} 
              alt="Post content" 
              className="w-full h-auto max-h-[600px] object-contain" 
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-gray-100 dark:border-gray-750 pt-3">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-semibold text-xs md:text-sm transition-colors ${
            isLiked 
              ? 'text-orange-500' 
              : 'text-gray-500 dark:text-gray-400 hover:text-orange-500'
          }`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'transparent'} />
          <span>{post._count?.likes || 0}</span>
        </button>
        <button 
          onClick={toggleComments}
          className={`flex items-center gap-1.5 font-semibold text-xs md:text-sm transition-colors ${
            showComments 
              ? 'text-orange-500' 
              : 'text-gray-500 dark:text-gray-400 hover:text-orange-500'
          }`}
        >
          <MessageCircle size={18} fill={showComments ? 'currentColor' : 'transparent'} />
          <span>{post._count?.comments || 0}</span>
        </button>
        <button 
          onClick={handleShare}
          className={`hover:text-orange-500 ml-auto transition-colors flex items-center gap-1.5 text-xs font-semibold ${
            isShared ? 'text-green-500 hover:text-green-500' : 'text-gray-500 dark:text-gray-400'
          }`}
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
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-100 dark:border-gray-750 pt-4">
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
                const canDelete = isCommentAuthor || isAuthor; // comment author or post author
                return (
                  <div key={comment.id} className="flex gap-3 text-xs md:text-sm items-start bg-gray-50/50 dark:bg-gray-900/30 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-750/30">
                    <div 
                      onClick={() => onViewProfile(comment.author.id)}
                      className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                    >
                      {comment.author.profilePicture ? (
                        <img src={comment.author.profilePicture} alt={comment.author.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                          {comment.author.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span 
                          onClick={() => onViewProfile(comment.author.id)}
                          className="font-bold text-gray-900 dark:text-white hover:text-orange-500 cursor-pointer transition-colors"
                        >
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    {canDelete && (
                      <button 
                        onClick={() => handleCommentDelete(comment.id)}
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
    </div>
  );
}
