import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { searchUsers } from './api';
//import './SearchUsers.css'; // Let's create some simple styles if needed, or use inline

export default function SearchUsers() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const data = await searchUsers(query.trim());
          setResults(data.users || []);
        } catch (err) {
          console.error('Search failed', err);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  // Navigate to profile
  const goToProfile = (user) => {
    navigate(`/${username}/profile/${user.type}/${user.id}`);
  };

  return (
    <div className="search-page-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <button
        style={{ marginBottom: '20px', background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '1rem' }}
        onClick={() => navigate(`/${username}/home`)}>
        ← Back to Home
      </button>

      <h2 style={{ marginBottom: '15px' }}>Search Alumni & Students</h2>

      <div className="search-bar" style={{ position: 'relative', marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Search by name, username, email, or Roll No..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', padding: '15px 20px', borderRadius: '30px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none' }}
        />
        {loading && <span style={{ position: 'absolute', right: '20px', top: '15px', color: '#999' }}>Loading...</span>}
      </div>

      <div className="search-results">
        {results.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.map((user) => (
              <li
                key={`${user.type}-${user.id}`}
                onClick={() => goToProfile(user)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '15px',
                  borderBottom: '1px solid #eee', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f9f9f9'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {user.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt={user.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginRight: '15px' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#3498db', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '15px' }}>
                    {user.name[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2c3e50' }}>{user.name}</div>
                  <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>@{user.username}</div>
                </div>
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  background: user.type === 'alumni' ? '#fdf2e9' : '#eaf2f8',
                  color: user.type === 'alumni' ? '#e67e22' : '#2980b9'
                }}>
                  {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          query.trim().length >= 2 && !loading ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>No users found for "{query}".</p>
          ) : query.trim().length > 0 && query.trim().length < 2 ? (
            <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Type at least 2 characters to search...</p>
          ) : (
            <div style={{ textAlign: 'center', color: '#ccc', marginTop: '50px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
              <p>Find friends, classmates, and alumni</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
