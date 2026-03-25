import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getUserProfileInfo, followUser, getFollowStatus, acceptFollow, rejectFollow, unfollowUser, 
  getFollowers, getFollowing, getPendingRequests,
  getUserPosts, getUserActivity, getUserAttendedSessions,
} from './api';
import './UserProfile.css';

// --- Helpers ---
import { PostCard, Avatar } from './HomePage';
import { deletePost, likePost, unlikePost, addComment, sharePost } from './api';

export default function UserProfile() {
  const { username, userType, userId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [reverseStatus, setReverseStatus] = useState(null);
  const [error, setError] = useState('');

  // New states for Dashboard integration
  const [activeTab, setActiveTab] = useState('posts'); // 'posts', 'activity', 'sessions'
  const [posts, setPosts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  
  const [showModal, setShowModal] = useState(null); // 'followers', 'following', null
  const [modalUsers, setModalUsers] = useState([]);
  
  const [pendingRequests, setPendingRequests] = useState([]);

  // Logged-in context
  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
  })();

  const isSelf = currentUser && currentUser.type === userType && String(currentUser.id) === String(userId);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const resp = await getUserProfileInfo(userType, userId);
      setProfile(resp.profile);
      
      if (currentUser && !isSelf) {
        const fs = await getFollowStatus(currentUser.type, currentUser.id, userType, userId);
        setFollowStatus(fs.status);
        const rs = await getFollowStatus(userType, userId, currentUser.type, currentUser.id);
        setReverseStatus(rs.status);
      }
      
      if (isSelf) {
        const reqs = await getPendingRequests(userType, userId);
        setPendingRequests(reqs.requests || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const loadTabContent = async (tab) => {
    setLoadingContent(true);
    try {
      if (tab === 'posts') {
        const data = await getUserPosts(userType, userId);
        setPosts(data.posts || []);
      } else if (tab === 'activity') {
        const data = await getUserActivity(userType, userId);
        setActivity(data.posts || []);
      } else if (tab === 'sessions') {
        const data = await getUserAttendedSessions(userType, userId);
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error('Failed to content:', e);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userType, userId]);

  useEffect(() => {
    if (profile) loadTabContent(activeTab);
  }, [activeTab, profile, userType, userId]);

  const handleAction = async (action, targetOverride = null) => {
    if (!currentUser) return;
    try {
      // Determine targets for action inside our own lists (e.g Accept/Decline pending)
      const tUser = targetOverride || { type: userType, id: userId };
      
      if (action === 'follow') {
        await followUser({ follower_type: currentUser.type, follower_id: currentUser.id, following_type: tUser.type, following_id: tUser.id });
        if (!targetOverride) setFollowStatus('pending');
      } else if (action === 'unfollow' || action === 'cancel') {
        await unfollowUser(currentUser.type, currentUser.id, tUser.type, tUser.id);
        if (!targetOverride) {
          setFollowStatus(null);
          setProfile(p => ({ ...p, follower_count: Math.max(0, p.follower_count - 1) }));
        }
      } else if (action === 'accept') {
        await acceptFollow({ follower_type: tUser.type, follower_id: tUser.id, following_type: currentUser.type, following_id: currentUser.id });
        if (!targetOverride) {
          setReverseStatus('accepted');
        } else {
          setPendingRequests(prev => prev.filter(r => r.id !== tUser.id));
          setProfile(p => ({ ...p, follower_count: p.follower_count + 1 }));
        }
      } else if (action === 'reject') {
        await rejectFollow({ follower_type: tUser.type, follower_id: tUser.id, following_type: currentUser.type, following_id: currentUser.id });
        if (!targetOverride) setReverseStatus(null);
        else setPendingRequests(prev => prev.filter(r => r.id !== tUser.id));
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    }
  };

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
      if (activeTab === 'posts') {
        setPosts(prev => prev.filter(p => p.post_id !== postId));
      } else if (activeTab === 'activity') {
        setActivity(prev => prev.filter(p => p.post_id !== postId));
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      // alert("Failed to delete post."); 
      // avoiding alert for smooth UI
    }
  };

  const openUsersModal = async (type) => { // 'followers' or 'following'
    setShowModal(type);
    setModalUsers([]);
    try {
      const resp = type === 'followers' 
        ? await getFollowers(userType, userId) 
        : await getFollowing(userType, userId);
      setModalUsers(resp[type] || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading profile...</div>;
  if (error || !profile) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error || 'User not found'}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px', fontFamily: "'Inter', sans-serif" }}>
      <button 
        style={{ padding: '15px', background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '1rem', width: '100%', textAlign: 'left' }}
        onClick={() => navigate(`/${currentUser?.username || username}/home`)}>
        ← Back to Home
      </button>

      {/* Profile Header */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', marginBottom: '20px' }}>
        <Avatar name={profile.name} url={profile.profile_photo_url} size={100} />
        <h2 style={{ margin: '15px 0 5px 0' }}>{profile.name}</h2>
        <div style={{ color: '#7f8c8d', marginBottom: '15px' }}>@{profile.username} • {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}</div>
        
        <div style={{ fontSize: '0.9rem', color: '#34495e', marginBottom: '20px' }}>
          {profile.type === 'student' ? `Class of ${profile.expected_graduation_date ? new Date(profile.expected_graduation_date).getFullYear() : 'Unknown'}` 
            : `Graduation Year: ${profile.batch_year || 'Unknown'}`}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px' }}>
          <div style={{ cursor: 'pointer', padding: '10px', borderRadius: '10px' }} className="stat-box" onClick={() => openUsersModal('followers')}>
            <div style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>{profile.follower_count}</div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Followers</div>
          </div>
          <div style={{ cursor: 'pointer', padding: '10px', borderRadius: '10px' }} className="stat-box" onClick={() => openUsersModal('following')}>
            <div style={{ fontWeight: 'bold', fontSize: '1.4rem' }}>{profile.following_count}</div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Following</div>
          </div>
        </div>

        {/* Action Buttons */}
        {isSelf && currentUser && currentUser.type === 'student' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button onClick={() => navigate(`/${currentUser.username}/edit-profile`)} style={{ padding: '10px 25px', borderRadius: '25px', border: 'none', background: '#e67e22', color: 'white', fontWeight: 'bold', cursor: 'pointer', minWidth: '120px' }}>Edit Profile</button>
          </div>
        )}
        {!isSelf && currentUser && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {followStatus === 'accepted' ? (
              <button onClick={() => handleAction('unfollow')} style={{ padding: '10px 25px', borderRadius: '25px', border: '1px solid #bdc3c7', background: '#f5f6fa', color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer', minWidth: '120px' }}>Following</button>
            ) : followStatus === 'pending' ? (
              <button onClick={() => handleAction('cancel')} style={{ padding: '10px 25px', borderRadius: '25px', border: '1px solid #bdc3c7', background: '#f5f6fa', color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer', minWidth: '120px' }}>Requested</button>
            ) : (
              <button onClick={() => handleAction('follow')} style={{ padding: '10px 25px', borderRadius: '25px', border: 'none', background: '#3498db', color: 'white', fontWeight: 'bold', cursor: 'pointer', minWidth: '120px' }}>Follow</button>
            )}
          </div>
        )}
      </div>

      {/* Pending Follow Requests Manager (Self Only) */}
      {isSelf && pendingRequests.length > 0 && (
        <div style={{ background: '#fdf2e9', padding: '20px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#d35400' }}>Incoming Follow Requests ({pendingRequests.length})</h3>
          {pendingRequests.map(req => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${currentUser.username}/profile/${req.type}/${req.id}`)}>
                <Avatar name={req.name} url={req.profile_photo_url} size={30} />
                <span style={{ marginLeft: '10px', fontWeight: '500' }}>{req.name}</span>
                <span style={{ marginLeft: '5px', color: '#7f8c8d', fontSize: '0.8rem' }}>@{req.username}</span>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => handleAction('accept', req)} style={{ padding: '6px 15px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>Accept</button>
                <button onClick={() => handleAction('reject', req)} style={{ padding: '6px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px', background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
        <button onClick={() => setActiveTab('posts')} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: activeTab === 'posts' ? '3px solid #3498db' : '3px solid transparent', fontWeight: activeTab === 'posts' ? 'bold' : 'normal', color: activeTab === 'posts' ? '#3498db' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s' }}>Posts</button>
        <button onClick={() => setActiveTab('activity')} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: activeTab === 'activity' ? '3px solid #3498db' : '3px solid transparent', fontWeight: activeTab === 'activity' ? 'bold' : 'normal', color: activeTab === 'activity' ? '#3498db' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s' }}>Activity</button>
        <button onClick={() => setActiveTab('sessions')} style={{ flex: 1, padding: '15px', background: 'none', border: 'none', borderBottom: activeTab === 'sessions' ? '3px solid #3498db' : '3px solid transparent', fontWeight: activeTab === 'sessions' ? 'bold' : 'normal', color: activeTab === 'sessions' ? '#3498db' : '#7f8c8d', cursor: 'pointer', transition: 'all 0.2s' }}>Progress Dashboard</button>
      </div>

      {/* Tab Dynamic Content */}
      <div style={{ padding: '0 5px' }}>
        {loadingContent ? <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>Loading content...</div> : (
          <>
            {activeTab === 'posts' && (
              posts.length === 0 ? <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>No posts yet.</p> : 
              posts.map(p => <PostCard key={p.post_id} post={p} currentUser={currentUser} onLike={handleLike} onUnlike={handleUnlike} onComment={handleComment} onShare={handleShare} onDelete={handleDelete} />)
            )}
            {activeTab === 'activity' && (
              activity.length === 0 ? <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>No recent activity.</p> : 
              activity.map(p => <PostCard key={p.post_id} post={p} currentUser={currentUser} onLike={handleLike} onUnlike={handleUnlike} onComment={handleComment} onShare={handleShare} onDelete={handleDelete} />)
            )}
            {activeTab === 'sessions' && (
              sessions.length === 0 ? <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '40px' }}>No sessions attended.</p> : 
              sessions.map(s => (
                <div key={s.session_id} style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '15px', borderLeft: '4px solid #9b59b6' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#2c3e50' }}>{s.title}</h4>
                  <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '10px' }}>📅 {new Date(s.scheduled_at).toLocaleString()} • Organized by {s.requester_name}</div>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#34495e', lineHeight: '1.5' }}>{s.description}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Followers / Following Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }} onClick={() => setShowModal(null)}>
          <div style={{ background: 'white', width: '90%', maxWidth: '400px', borderRadius: '15px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 15px 0', textTransform: 'capitalize', borderBottom: '1px solid #eee', paddingBottom: '10px', textAlign: 'center' }}>{showModal}</h3>
            {modalUsers.length === 0 ? <p style={{ color: '#7f8c8d', textAlign: 'center', padding: '20px 0' }}>No {showModal} found.</p> : 
              modalUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #fafafa', cursor: 'pointer', transition: 'background 0.2s', borderRadius: '10px' }} 
                     onMouseOver={e => e.currentTarget.style.background = '#f8f9fa'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                     onClick={() => { setShowModal(null); navigate(`/${currentUser?.username || username}/profile/${u.type}/${u.id}`); }}>
                  <Avatar name={u.name} url={u.profile_photo_url} size={45} />
                  <div style={{ marginLeft: '12px' }}>
                    <div style={{ fontWeight: '600', color: '#2c3e50' }}>{u.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>@{u.username}</div>
                  </div>
                </div>
              ))}
            <button onClick={() => setShowModal(null)} style={{ width: '100%', padding: '12px', background: '#ecf0f1', border: 'none', borderRadius: '25px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}