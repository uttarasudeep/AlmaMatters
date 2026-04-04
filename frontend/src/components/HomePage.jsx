import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/almamatterslogowithname.jpeg';
import {
  getFeed, createPost, deletePost,
  likePost, unlikePost, getComments,
  addComment, sharePost, deleteComment
} from './api';

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Avatar({ name, url, size = 42 }) {
  const colors = ['#1c65a0', '#0d7a5f', '#7c3aed', '#b45309', '#0e7490'];
  const idx    = name ? name.charCodeAt(0) % colors.length : 0;
  if (url) return (
    <img src={url} alt={name} className="post-avatar-img"
      style={{ width: size, height: size }} />
  );
  return (
    <div className="post-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: colors[idx] }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

/* ══════════════════════════════════════════
   COMMENT (recursive)
══════════════════════════════════════════ */
export function Comment({ comment, postId, currentUser, onReply, onDelete }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const submit = async () => {
    if (!replyText.trim()) return;
    await onReply(postId, replyText, comment.comment_id);
    setReplyText(''); setShowReply(false);
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <Avatar name={comment.commenter_name} url={comment.commenter_avatar} size={26} />
        <div>
          <span className="comment-author">{comment.commenter_name}</span>
          <span className="comment-time">{timeAgo(comment.created_at)}</span>
        </div>
      </div>
      <p className="comment-text">{comment.content}</p>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button className="reply-btn" onClick={() => setShowReply(v => !v)}>↩ Reply</button>
        {currentUser?.type === comment.commenter_type &&
          String(currentUser.id) === String(comment.commenter_id) && (
            <button className="reply-btn" style={{ color: '#f87171' }}
              onClick={() => onDelete(comment.comment_id)}>
              🗑 Delete
            </button>
          )}
      </div>
      {showReply && (
        <div className="reply-input-row">
          <input className="comment-input" placeholder="Write a reply…"
            value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          <button className="comment-submit-btn" onClick={submit}>Send</button>
        </div>
      )}
      {comment.replies?.length > 0 && (
        <div className="replies-list">
          {comment.replies.map(r => (
            <Comment key={r.comment_id} comment={r} postId={postId}
              currentUser={currentUser} onReply={onReply} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   POST CARD
══════════════════════════════════════════ */
export function PostCard({ post, currentUser, onLike, onUnlike, onComment, onShare, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [comments,     setComments]     = useState([]);
  const [loadingCmts,  setLoadingCmts]  = useState(false);
  const [commentText,  setCommentText]  = useState('');
  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(post.like_count || 0);

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingCmts(true);
      try { const d = await getComments(post.post_id); setComments(d.comments || []); }
      catch { /* silent */ }
      finally { setLoadingCmts(false); }
    }
    setShowComments(v => !v);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    if (liked) { const d = await onUnlike(post.post_id); setLikeCount(d.like_count); setLiked(false); }
    else        { const d = await onLike(post.post_id);  setLikeCount(d.like_count); setLiked(true);  }
  };

  const refreshComments = async (id) => {
    const d = await getComments(id); setComments(d.comments || []);
  };

  const handleAddComment = async (postId, text, parentId = null) => {
    if (!currentUser) return;
    await onComment(postId, text, parentId);
    await refreshComments(postId);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    await handleAddComment(post.post_id, commentText);
    setCommentText('');
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try { await deleteComment(post.post_id, commentId); await refreshComments(post.post_id); }
    catch { alert('Failed to delete comment.'); }
  };

  const isOwner = currentUser?.type === post.poster_type &&
    String(currentUser?.id) === String(post.poster_id);

  const badgeClass = post.poster_type === 'alumni' ? 'post-badge post-badge-alumni' : 'post-badge post-badge-student';

  return (
    <div className="post-card">

      {/* ── Header ── */}
      <div className="post-header">
        <Avatar name={post.poster_name} url={post.poster_avatar} size={42} />
        <div className="post-meta">
          <div className="post-meta-top">
            <span className="post-author">{post.poster_name || 'Unknown'}</span>
            <span className={badgeClass}>{post.poster_type}</span>
          </div>
          <span className="post-time">{timeAgo(post.created_at)}</span>
        </div>
      </div>

      {/* ── Content ── */}
      <p className="post-content">{post.content}</p>
      {post.media_url && (
        <img src={post.media_url} alt="media" className="post-media" />
      )}

      {/* ── Stats ── */}
      <div className="post-stats">
        <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
        <span>·</span>
        <span>{post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}</span>
        <span>·</span>
        <span>{post.share_count} {post.share_count === 1 ? 'share' : 'shares'}</span>
      </div>

      {/* ── Actions ── */}
      <div className="post-actions">
        <button className={`action-btn${liked ? ' liked' : ''}`} onClick={handleLike}>
          {liked ? '❤️' : '🤍'} Like
        </button>
        <button className="action-btn" onClick={toggleComments}>
          💬 Comment
        </button>
        <button className="action-btn" onClick={() => onShare(post.post_id)}>
          ↗ Share
        </button>
        {isOwner && (
          <button className="action-btn action-btn-delete" onClick={() => onDelete(post.post_id)}>
            🗑 Delete
          </button>
        )}
      </div>

      {/* ── Comments ── */}
      {showComments && (
        <div className="comments-section">
          {loadingCmts ? (
            <p className="loading-text">Loading…</p>
          ) : (
            <>
              {currentUser && (
                <div className="comment-input-row">
                  <Avatar
                    name={currentUser.username}
                    url={currentUser.profilePic || sessionStorage.getItem('profilePic')}
                    size={28}
                  />
                  <input className="comment-input" placeholder="Write a comment…"
                    value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitComment()} />
                  <button className="comment-submit-btn" onClick={handleSubmitComment}>Post</button>
                </div>
              )}
              {comments.length === 0
                ? <p className="no-comments">No comments yet. Be the first!</p>
                : comments.map(c => (
                    <Comment key={c.comment_id} comment={c} postId={post.post_id}
                      currentUser={currentUser} onReply={handleAddComment}
                      onDelete={handleDeleteComment} />
                  ))
              }
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   CREATE POST MODAL
══════════════════════════════════════════ */
function CreatePostModal({ currentUser, onClose, onCreated }) {
  const [content,        setContent]        = useState('');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [mediaUrl,       setMediaUrl]       = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && !mediaUrl.trim()) { setError('Post must have text or media.'); return; }
    if (!currentUser) { setError('You must be logged in.'); return; }
    setLoading(true);
    try {
      await createPost({ poster_type: currentUser.type, poster_id: currentUser.id, content, media_url: mediaUrl || undefined });
      onCreated(); onClose();
    } catch { setError('Failed to post. Try again.'); }
    finally  { setLoading(false); }
  };

  return (
    <div className="linkedin-modal-overlay" onClick={onClose}>
      <div className="linkedin-modal-box" onClick={e => e.stopPropagation()}>

        <div className="linkedin-modal-header">
          <h2>Create a post</h2>
          <button className="linkedin-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="linkedin-modal-user">
          <Avatar name={currentUser?.username} url={currentUser?.profilePic || sessionStorage.getItem('profilePic')} size={44} />
          <div className="linkedin-modal-user-info">
            <span className="linkedin-modal-name">{currentUser?.username || 'You'}</span>
            <span className="linkedin-modal-privacy">🌐 Anyone ▾</span>
          </div>
        </div>

        <div className="linkedin-modal-body">
          <textarea className="linkedin-post-textarea"
            placeholder="What do you want to talk about?"
            value={content}
            onChange={e => setContent(e.target.value)}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            rows={4}
          />
          {showMediaInput && (
            <input type="text" className="linkedin-media-input"
              placeholder="Paste an image URL…" value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)} autoFocus />
          )}
          {mediaUrl && (
            <div className="linkedin-media-preview">
              <img src={mediaUrl} alt="preview" onError={e => e.target.style.display = 'none'} />
              <button className="linkedin-remove-media" onClick={() => setMediaUrl('')}>✕</button>
            </div>
          )}
          {error && <p className="error-msg">{error}</p>}
        </div>

        <div className="linkedin-modal-footer">
          <div className="linkedin-modal-tools">
            <button className="linkedin-tool-btn" title="Add image URL"
              onClick={() => setShowMediaInput(v => !v)}>🖼️</button>
            <button className="linkedin-tool-btn" title="Coming soon">📅</button>
            <button className="linkedin-tool-btn" title="Coming soon">📊</button>
          </div>
          <button className="linkedin-post-btn" onClick={handleSubmit}
            disabled={loading || (!content.trim() && !mediaUrl.trim())}>
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [profilePic,      setProfilePic]      = useState(() => sessionStorage.getItem('profilePic') || null);
  const [posts,           setPosts]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [page,            setPage]            = useState(1);
  const [hasMore,         setHasMore]         = useState(true);
  const [showModal,       setShowModal]       = useState(false);

  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); }
    catch { return null; }
  })();

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('profilePic');
    navigate('/login');
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePic(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () => sessionStorage.setItem('profilePic', reader.result);
    reader.readAsDataURL(file);
  };

  const loadPosts = async (pageNum = 1, replace = false) => {
    setLoading(true);
    try {
      const data = await getFeed(pageNum, 20, currentUser?.type, currentUser?.id);
      const incoming = data.posts || [];
      setPosts(prev => replace ? incoming : [...prev, ...incoming]);
      setHasMore(incoming.length === 20);
    } catch (e) { console.error('Feed error:', e); }
    finally     { setLoading(false); }
  };

  useEffect(() => { loadPosts(1, true); }, []); // eslint-disable-line

  const handleLike    = id => currentUser ? likePost(id, currentUser.type, currentUser.id)   : Promise.resolve({ like_count: 0 });
  const handleUnlike  = id => currentUser ? unlikePost(id, currentUser.type, currentUser.id) : Promise.resolve({ like_count: 0 });
  const handleComment = (id, text, parentId) => currentUser
    ? addComment(id, { commenter_type: currentUser.type, commenter_id: currentUser.id, content: text, parent_comment_id: parentId || null })
    : Promise.resolve();
  const handleShare   = id => { if (currentUser) sharePost(id, currentUser.type, currentUser.id).catch(console.error); };
  const handleDelete  = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try { await deletePost(id); setPosts(p => p.filter(x => x.post_id !== id)); }
    catch { alert('Failed to delete.'); }
  };

  /* ── stagger animation delay ── */
  const staggerStyle = (i) => ({ animationDelay: `${i * 0.05}s` });

  return (
    <div className="homepage-container">

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-left">
          <label className="profile-upload">
            <input type="file" accept="image/*" onChange={handleProfileUpload} hidden />
            {profilePic
              ? <img src={profilePic} alt="Profile" className="profile-img" />
              : <div className="profile-placeholder">📷</div>}
          </label>
          {currentUser && <span className="nav-username">{currentUser.username}</span>}
          <button className="icon-btn" title="Notifications">🔔</button>
        </div>

        <div className="nav-center">
          <img src={logo} alt="Logo" className="nav-logo" />
          <h1 className="nav-title">AlmaMatters</h1>
        </div>

        <div className="nav-right">
          <button className="icon-btn" onClick={() => navigate(`/${username}/search`)}>🔍</button>
          <button className="icon-btn" onClick={() => navigate(`/${username}/messages`)}>✉️</button>
          <button className="icon-btn" onClick={handleLogout}>🚪</button>
        </div>
      </nav>

      {/* ── Feed ── */}
      <main className="feed-container">
        <h2 className="feed-heading">
          Your <span className="feed-heading-accent">Feed</span>
        </h2>

        {loading && posts.length === 0 ? (
          <div className="feed-loading">
            <div className="spinner" />
            <p style={{ color: 'var(--t3)', fontSize: '0.9rem' }}>Loading posts…</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">📭</div>
            <p>No posts yet — be the first to share something!</p>
          </div>
        ) : (
          <>
            {posts.map((post, i) => (
              <div key={post.post_id} style={staggerStyle(i)}>
                <PostCard post={post} currentUser={currentUser}
                  onLike={handleLike} onUnlike={handleUnlike}
                  onComment={handleComment} onShare={handleShare}
                  onDelete={handleDelete} />
              </div>
            ))}
            {hasMore && (
              <button className="load-more-btn" disabled={loading}
                onClick={() => { const n = page + 1; setPage(n); loadPosts(n, false); }}>
                {loading ? 'Loading…' : 'Load more posts'}
              </button>
            )}
          </>
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <footer className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/sessions`)}>
          <span className="nav-icon">📅</span>
          <span>Sessions</span>
        </button>
        <button className="bottom-nav-item" onClick={() => {
          if (currentUser) navigate(`/${username}/profile/${currentUser.type}/${currentUser.id}`);
        }}>
          <span className="nav-icon">👤</span>
          <span>Profile</span>
        </button>

        <button className="bottom-nav-item post-btn" onClick={() => setShowModal(true)}>
          <div className="add-icon-wrapper">➕</div>
          <span>Post</span>
        </button>

        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/jobs`)}>
          <span className="nav-icon">💼</span>
          <span>Jobs</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/communities`)}>
          <span className="nav-icon">🏘️</span>
          <span>Community</span>
        </button>
      </footer>

      {/* ── Create Post Modal ── */}
      {showModal && (
        <CreatePostModal currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onCreated={() => loadPosts(1, true)} />
      )}

      {/* ── Alumni Transition ── */}
      {currentUser?.requires_alumni_transition && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.82)' }}>
          <div className="modal-box">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎓</div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', color: '#fbbf24', marginBottom: '14px', fontSize: '1.15rem' }}>
              Congratulations, Graduate!
            </h2>
            <p style={{ color: 'var(--t2)', lineHeight: '1.7', fontSize: '0.9rem', marginBottom: '28px' }}>
              Our records show you've graduated. Transition your account to the
              Alumni Portal to stay connected with your network.
            </p>
            <button style={{
              background: 'linear-gradient(135deg,#1d71b3,#145a92)',
              color: '#fff', border: 'none', padding: '13px 34px',
              borderRadius: '100px', fontSize: '0.9rem', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 18px rgba(28,101,160,0.5)', letterSpacing: '0.02em',
            }} onClick={() => {
              sessionStorage.removeItem('currentUser');
              sessionStorage.removeItem('profilePic');
              navigate('/signup/alumni');
            }}>
              Update to Alumni Profile →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
