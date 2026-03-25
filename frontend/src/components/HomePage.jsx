import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/almamatterslogowithname.jpeg';
import { getFeed, createPost, deletePost, likePost, unlikePost, getComments, addComment, sharePost, deleteComment } from './api';

// ── helpers ──────────────────────────────────────────────────
export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Avatar({ name, url, size = 38 }) {
  if (url) return <img src={url} alt={name} className="post-avatar-img" style={{ width: size, height: size }} />;
  const letter = (name || '?')[0].toUpperCase();
  return <div className="post-avatar" style={{ width: size, height: size, fontSize: size * 0.45 }}>{letter}</div>;
}

// ── Comment component (recursive) ────────────────────────────
export function Comment({ comment, postId, currentUser, onReply, onDelete }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await onReply(postId, replyText, comment.comment_id);
    setReplyText('');
    setShowReply(false);
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <Avatar name={comment.commenter_name} url={comment.commenter_avatar} size={28} />
        <div>
          <span className="comment-author">{comment.commenter_name}</span>
          <span className="comment-time">{timeAgo(comment.created_at)}</span>
        </div>
      </div>
      <p className="comment-text">{comment.content}</p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button className="reply-btn" onClick={() => setShowReply(v => !v)}>↩ Reply</button>
        {currentUser && currentUser.type === comment.commenter_type && String(currentUser.id) === String(comment.commenter_id) && (
          <button className="reply-btn" onClick={() => onDelete(comment.comment_id)} style={{ color: '#e74c3c' }}>🗑️ Delete</button>
        )}
      </div>
      {showReply && (
        <div className="reply-input-row">
          <input
            className="comment-input"
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply()}
          />
          <button className="comment-submit-btn" onClick={handleReply}>Send</button>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-list">
          {comment.replies.map(r => (
            <Comment key={r.comment_id} comment={r} postId={postId} currentUser={currentUser} onReply={onReply} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PostCard component ────────────────────────────────────────
export function PostCard({ post, currentUser, onLike, onUnlike, onComment, onShare, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const data = await getComments(post.post_id);
        setComments(data.comments || []);
      } catch {
        // silent fail
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(v => !v);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    if (liked) {
      const data = await onUnlike(post.post_id);
      setLikeCount(data.like_count);
      setLiked(false);
    } else {
      const data = await onLike(post.post_id);
      setLikeCount(data.like_count);
      setLiked(true);
    }
  };

  const handleAddComment = async (postId, text, parentId = null) => {
    if (!currentUser) return;
    await onComment(postId, text, parentId);
    const data = await getComments(postId);
    setComments(data.comments || []);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    await handleAddComment(post.post_id, commentText);
    setCommentText('');
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteComment(post.post_id, commentId);
      const data = await getComments(post.post_id);
      setComments(data.comments || []);
    } catch {
      alert("Failed to delete comment.");
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Avatar name={post.poster_name} url={post.poster_avatar} />
        <div className="post-meta">
          <p className="post-author">{post.poster_name || 'Unknown'}</p>
          <span className="post-time">{timeAgo(post.created_at)}</span>
          <span className="post-badge">{post.poster_type}</span>
        </div>
      </div>

      <p className="post-content">{post.content}</p>
      {post.media_url && (
        <img src={post.media_url} alt="post media" className="post-media" />
      )}

      <div className="post-stats">
        <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
        <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
        <span>{post.share_count} {post.share_count === 1 ? 'share' : 'shares'}</span>
      </div>

      <div className="post-actions">
        <button className={`action-btn${liked ? ' liked' : ''}`} onClick={handleLike}>
          {liked ? '❤️' : '🤍'} Like
        </button>
        <button className="action-btn" onClick={toggleComments}>
          💬 Comment
        </button>
        <button className="action-btn" onClick={() => onShare(post.post_id)}>
          📤 Share
        </button>
        {currentUser && currentUser.type === post.poster_type && String(currentUser.id) === String(post.poster_id) && (
          <button className="action-btn" onClick={() => onDelete(post.post_id)} style={{ color: '#e74c3c' }}>
            🗑️ Delete
          </button>
        )}
      </div>

      {showComments && (
        <div className="comments-section">
          {loadingComments ? (
            <p className="loading-text">Loading comments…</p>
          ) : (
            <>
              {currentUser && (
                <div className="comment-input-row">
                  <input
                    className="comment-input"
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                  />
                  <button className="comment-submit-btn" onClick={handleSubmitComment}>Post</button>
                </div>
              )}
              {comments.length === 0 ? (
                <p className="no-comments">No comments yet. Be the first!</p>
              ) : (
                comments.map(c => (
                  <Comment
                    key={c.comment_id}
                    comment={c}
                    postId={post.post_id}
                    currentUser={currentUser}
                    onReply={handleAddComment}
                    onDelete={handleDeleteComment}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create Post Modal ─────────────────────────────────────────
function CreatePostModal({ currentUser, onClose, onCreated }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl.trim()) { setError('Post must contain text or media.'); return; }
    if (!currentUser) { setError('You must be logged in to post.'); return; }
    setLoading(true);
    try {
      await createPost({
        poster_type: currentUser.type,
        poster_id: currentUser.id,
        content,
        media_url: mediaUrl || undefined
      });
      onCreated();
      onClose();
    } catch (e) {
      setError('Failed to create post. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="linkedin-modal-overlay" onClick={onClose}>
      <div className="linkedin-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="linkedin-modal-header">
          <h2>Create a post</h2>
          <button className="linkedin-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* User Identity */}
        <div className="linkedin-modal-user">
          <Avatar name={currentUser?.username || 'User'} url={currentUser?.profilePic || sessionStorage.getItem('profilePic')} size={48} />
          <div className="linkedin-modal-user-info">
            <span className="linkedin-modal-name">{currentUser?.username || 'Unknown User'}</span>
            <span className="linkedin-modal-privacy">Anyone ▾</span>
          </div>
        </div>

        {/* Body Textarea */}
        <div className="linkedin-modal-body">
          <textarea
            className="linkedin-post-textarea"
            placeholder="What do you want to talk about?"
            value={content}
            onChange={e => setContent(e.target.value)}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = (e.target.scrollHeight) + 'px';
            }}
            rows={4}
          />
          
          {showMediaInput && (
            <input 
              type="text" 
              placeholder="Paste an Image URL here" 
              className="linkedin-media-input" 
              value={mediaUrl} 
              onChange={e => setMediaUrl(e.target.value)} 
              autoFocus
            />
          )}
          {mediaUrl && (
            <div className="linkedin-media-preview">
              <img src={mediaUrl} alt="Attachment preview" onError={(e) => e.target.style.display='none'} />
              <button className="linkedin-remove-media" onClick={() => setMediaUrl('')}>✕</button>
            </div>
          )}
          {error && <p className="error-msg" style={{marginTop: '10px'}}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="linkedin-modal-footer">
          <div className="linkedin-modal-tools">
            <button 
              className="linkedin-tool-btn" 
              onClick={() => setShowMediaInput(!showMediaInput)}
              title="Add media URL"
            >
              🖼️
            </button>
            <button className="linkedin-tool-btn" title="Coming soon">📅</button>
            <button className="linkedin-tool-btn" title="Coming soon">📊</button>
          </div>
          <button 
            className="linkedin-post-btn" 
            onClick={handleSubmit} 
            disabled={loading || (!content.trim() && !mediaUrl.trim())}
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { username } = useParams(); // get username from URL
  const [profilePic, setProfilePic] = useState(() => sessionStorage.getItem('profilePic') || null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Read currently logged-in user from sessionStorage
  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
  })();

  // Logout function
  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('profilePic');
    navigate('/login');
  };

  const handleProfileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setProfilePic(url);

      const reader = new FileReader();
      reader.onloadend = () => {
         sessionStorage.setItem('profilePic', reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const loadPosts = async (pageNum = 1, replace = false) => {
    setLoading(true);
    try {
      const data = await getFeed(pageNum, 20, currentUser?.type, currentUser?.id);
      const incoming = data.posts || [];
      setPosts(prev => replace ? incoming : [...prev, ...incoming]);
      setHasMore(incoming.length === 20);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(1, true); }, []);

  const handleLike = (postId) => {
    if (!currentUser) return Promise.resolve({ like_count: 0 });
    return likePost(postId, currentUser.type, currentUser.id);
  };

  const handleUnlike = (postId) => {
    if (!currentUser) return Promise.resolve({ like_count: 0 });
    return unlikePost(postId, currentUser.type, currentUser.id);
  };

  const handleComment = (postId, text, parentId) => {
    if (!currentUser) return Promise.resolve();
    return addComment(postId, {
      commenter_type: currentUser.type,
      commenter_id: currentUser.id,
      content: text,
      parent_comment_id: parentId || null,
    });
  };

  const handleShare = (postId) => {
    if (!currentUser) return;
    sharePost(postId, currentUser.type, currentUser.id).catch(console.error);
    console.log('Shared post', postId);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.post_id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post.");
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPosts(next, false);
  };

  return (
    <div className="homepage-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <label className="profile-upload">
            <input type="file" accept="image/*" onChange={handleProfileUpload} hidden />
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="profile-img" />
            ) : (
              <div className="profile-placeholder">📷</div>
            )}
          </label>
          {currentUser && (
            <span style={{ color: '#2c3e50', fontWeight: 500, marginLeft: 8 }}>
              {currentUser.username}
            </span>
          )}
          <button className="icon-btn" title="Requests Inbox">🔔</button>
        </div>

        <div className="nav-center">
          <img src={logo} alt="Logo" className="nav-logo" />
          <h1 className="nav-title">AlmaMatters</h1>
        </div>

        <div className="nav-right">
          <button className="icon-btn" title="Search" onClick={() => navigate(`/${username}/search`)}>🔍</button>
          <button className="icon-btn" title="Messages" onClick={() => navigate(`/${username}/messages`)}>✉️</button>
          <button className="icon-btn" title="Logout" onClick={handleLogout} style={{ fontSize: '1.2rem' }}>🚪</button>
        </div>
      </nav>

      {/* Feed */}
      <main className="feed-container">
        <h2>Your Feed</h2>

        {loading && posts.length === 0 ? (
          <div className="feed-loading">
            <div className="spinner" />
            <p>Loading posts…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <p>No posts yet! Be the first to share something.</p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard
                key={post.post_id}
                post={post}
                currentUser={currentUser}
                onLike={handleLike}
                onUnlike={handleUnlike}
                onComment={handleComment}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <button className="load-more-btn" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/sessions`)}>
          <span className="nav-icon">📅</span>
          <span>Sessions</span>
        </button>
        <button className="bottom-nav-item" onClick={() => {
          if (currentUser) {
            navigate(`/${username}/profile/${currentUser.type}/${currentUser.id}`);
          }
        }}>
          <span className="nav-icon">👤</span>
          <span>Profile</span>
        </button>
        <button className="bottom-nav-item post-btn" onClick={() => setShowCreateModal(true)}>
          <span className="nav-icon add-icon">➕</span>
          <span>Post</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/jobs`)}>
          <span className="nav-icon">💼</span>
          <span>Jobs</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/communities`)}>
          <span className="nav-icon">🏘️</span>
          <span>Communities</span>
        </button>
      </footer>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => loadPosts(1, true)}
        />
      )}

      {/* Alumni Transition Modal */}
      {currentUser?.requires_alumni_transition && (
        <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-box" style={{ textAlign: 'center', padding: '40px 30px' }}>
            <h2 style={{ marginBottom: '15px', color: '#e74c3c' }}>Congratulations, Graduate! 🎓</h2>
            <p style={{ marginBottom: '25px', color: '#34495e', lineHeight: '1.6' }}>
              Our records indicate that you have graduated! You can no longer access the student portal. 
              Please transition your account to the Alumni Portal to stay connected.
            </p>
            <button 
              onClick={() => {
                sessionStorage.removeItem('currentUser');
                sessionStorage.removeItem('profilePic');
                navigate('/signup/alumni');
              }}
              style={{
                background: '#2ecc71', color: '#fff', border: 'none', padding: '15px 30px',
                borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(46, 204, 113, 0.3)'
              }}
            >
              Update to Alumni Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}