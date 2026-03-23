import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfileInfo, followUser, getFollowStatus, acceptFollow, rejectFollow, unfollowUser, getFeed } from './api';

export default function UserProfile() {
  const { username, userType, userId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null); // 'pending', 'accepted', 'rejected', or null
  const [reverseStatus, setReverseStatus] = useState(null); // the status of them following US
  const [error, setError] = useState('');
  
  // Read currently logged-in user
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
        // Check if WE follow THEM
        const fs = await getFollowStatus(currentUser.type, currentUser.id, userType, userId);
        setFollowStatus(fs.status);
        
        // Check if THEY follow US
        const rs = await getFollowStatus(userType, userId, currentUser.type, currentUser.id);
        setReverseStatus(rs.status);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userType, userId]);

  const handleAction = async (action) => {
    if (!currentUser) return;
    try {
      if (action === 'follow') {
        await followUser({ follower_type: currentUser.type, follower_id: currentUser.id, following_type: userType, following_id: userId });
        setFollowStatus('pending');
      } else if (action === 'unfollow' || action === 'cancel') {
        await unfollowUser(currentUser.type, currentUser.id, userType, userId);
        setFollowStatus(null);
      } else if (action === 'accept') {
        await acceptFollow({ follower_type: userType, follower_id: userId, following_type: currentUser.type, following_id: currentUser.id });
        setReverseStatus('accepted');
      } else if (action === 'reject') {
        await rejectFollow({ follower_type: userType, follower_id: userId, following_type: currentUser.type, following_id: currentUser.id });
        setReverseStatus(null);
      }
    } catch (err) {
      console.error('Follow action failed', err);
      // alert('Action failed');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading profile...</div>;
  if (error || !profile) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error || 'User not found'}</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: "'Inter', sans-serif", border: '1px solid #eee', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <button 
        style={{ padding: '15px', background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '1rem', width: '100%', textAlign: 'left', borderBottom: '1px solid #eee' }}
        onClick={() => navigate(`/${username}/home`)}>
        ← Back to Home
      </button>

      <div style={{ padding: '30px', textAlign: 'center' }}>
        {profile.profile_photo_url ? (
          <img src={profile.profile_photo_url} alt={profile.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px' }} />
        ) : (
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#3498db', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '3rem', margin: '0 auto 15px' }}>
            {profile.name[0].toUpperCase()}
          </div>
        )}
        
        <h2 style={{ margin: '0 0 5px 0' }}>{profile.name}</h2>
        <div style={{ color: '#7f8c8d', marginBottom: '15px' }}>@{profile.username} • {profile.type.charAt(0).toUpperCase() + profile.type.slice(1)}</div>
        
        {profile.type === 'student' ? (
          <div style={{ fontSize: '0.9rem', color: '#34495e', marginBottom: '20px' }}>
            Class of {profile.expected_graduation_date ? new Date(profile.expected_graduation_date).getFullYear() : 'Unknown'}
          </div>
        ) : (
          <div style={{ fontSize: '0.9rem', color: '#34495e', marginBottom: '20px' }}>
            Graduation Year: {profile.batch_year || 'Unknown'}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '15px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{profile.follower_count}</div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Followers</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{profile.following_count}</div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Following</div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isSelf && currentUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {/* Our follow status -> Them */}
            {followStatus === 'accepted' ? (
              <button 
                onClick={() => handleAction('unfollow')}
                style={{ width: '80%', padding: '10px', borderRadius: '25px', border: '1px solid #bdc3c7', background: '#f5f6fa', color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer' }}>
                Following
              </button>
            ) : followStatus === 'pending' ? (
              <button 
                onClick={() => handleAction('cancel')}
                style={{ width: '80%', padding: '10px', borderRadius: '25px', border: '1px solid #bdc3c7', background: '#f5f6fa', color: '#2c3e50', fontWeight: 'bold', cursor: 'pointer' }}>
                Requested
              </button>
            ) : (
              <button 
                onClick={() => handleAction('follow')}
                style={{ width: '80%', padding: '10px', borderRadius: '25px', border: 'none', background: '#3498db', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                Follow
              </button>
            )}

            {/* Their follow status -> Us */}
            {reverseStatus === 'pending' && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#fdf2e9', borderRadius: '10px', width: '90%' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#d35400' }}>{profile.name} requested to follow you.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => handleAction('accept')} style={{ padding: '8px 20px', border: 'none', borderRadius: '20px', background: '#e67e22', color: 'white', cursor: 'pointer' }}>Accept</button>
                  <button onClick={() => handleAction('reject')} style={{ padding: '8px 20px', border: '1px solid #e67e22', borderRadius: '20px', background: 'transparent', color: '#e67e22', cursor: 'pointer' }}>Reject</button>
                </div>
              </div>
            )}
            {reverseStatus === 'accepted' && (
              <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Follows you</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}