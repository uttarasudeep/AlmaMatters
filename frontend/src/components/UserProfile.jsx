import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserByUsername } from './api';
import './UserProfile.css';

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserByUsername(username);
        setUser(data.user);
      } catch (err) {
        setError(err?.response?.data?.message || 'User not found');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username]);

  if (loading) return <div className="profile-loading">Loading...</div>;
  if (error) return <div className="profile-error">⚠️ {error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <div className="avatar-placeholder">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1>{user.name}</h1>
        <p className="profile-type">{user.type}</p>
      </div>
      <div className="profile-content">
        <p>This is the public profile of {user.name}.</p>
      </div>
      <button className="btn-back" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );
}