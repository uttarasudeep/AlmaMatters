import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { searchUsers } from './api';
import './SearchUsers.css';

export default function SearchUsers() {
  const navigate = useNavigate();
  const { username } = useParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
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

  const goToProfile = (user) => {
    navigate(`/${username}/profile/${user.type}/${user.id}`);
  };

  const renderEmpty = () => {
    if (query.trim().length === 0) {
      return (
        <div className="su-empty">
          <div className="su-empty-icon">🔍</div>
          <div className="su-empty-title">Search the network</div>
          <div className="su-empty-sub">
            Find friends, batchmates, and alumni by name, username, email, or Roll No.
          </div>
        </div>
      );
    }
    if (query.trim().length < 2) {
      return (
        <div className="su-empty">
          <div className="su-empty-icon">✏️</div>
          <div className="su-empty-title">Keep typing…</div>
          <div className="su-empty-sub">Enter at least 2 characters to start searching.</div>
        </div>
      );
    }
    if (!loading) {
      return (
        <div className="su-empty">
          <div className="su-empty-icon">😶</div>
          <div className="su-empty-title">No results found</div>
          <div className="su-empty-sub">
            No users matched "{query}". Try a different name or roll number.
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="su-page">
      <div className="su-container">

        {/* Back Button */}
        <button className="su-back-btn" onClick={() => navigate(`/${username}/home`)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Home
        </button>

        {/* Header */}
        <div className="su-header">
          <h2 className="su-title">
            Search <span>Alumni & Students</span>
          </h2>
          <p className="su-subtitle">Discover people across your institution's network</p>
        </div>

        {/* Search Input */}
        <div className="su-search-wrap">
          <span className="su-search-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="su-input"
            type="text"
            placeholder="Search by name, username, email, or Roll No..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <span className="su-loading-indicator">
              <span className="su-dot" />
              <span className="su-dot" />
              <span className="su-dot" />
            </span>
          )}
        </div>

        {/* Results or Empty State */}
        {results.length > 0 ? (
          <>
            <div className="su-divider">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
            <ul className="su-results">
              {results.map((user) => (
                <li
                  key={`${user.type}-${user.id}`}
                  className="su-result-item"
                  onClick={() => goToProfile(user)}
                >
                  {user.profile_photo_url ? (
                    <img
                      className="su-avatar-img"
                      src={user.profile_photo_url}
                      alt={user.name}
                    />
                  ) : (
                    <div className="su-avatar-placeholder">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="su-info">
                    <div className="su-name">{user.name}</div>
                    <div className="su-username">@{user.username}</div>
                  </div>
                  <span className={`su-badge ${user.type === 'alumni' ? 'su-badge-alumni' : 'su-badge-student'}`}>
                    {user.type}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          renderEmpty()
        )}

      </div>
    </div>
  );
}
