import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  getApprovedSessions, 
  requestSession, 
  applySession, 
  getSessionApplicants, 
  getNotifications,
  getMySessionRequests,
  markNotificationRead
} from "./api";
import "./HomePage.css";
import logo from '../assets/almamatterslogowithname.jpeg';

function RequestSessionModal({ currentUser, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { setError("Title and description are required."); return; }
    if (!scheduledAt) { setError("Proposed date & time is required."); return; }
    setLoading(true);
    try {
      await requestSession({
        requester_type: currentUser.type,
        requester_id: currentUser.id,
        title,
        description,
        scheduled_at: scheduledAt
      });
      onCreated();
      onClose();
    } catch (e) {
      setError("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="linkedin-modal-overlay" onClick={onClose}>
      <div className="session-modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="linkedin-modal-header">
          <h2>Request a Session</h2>
          <button className="linkedin-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="session-modal-body">
          <div className="session-form-group">
            <label className="session-form-label">Session Title <span className="session-required">*</span></label>
            <input
              type="text"
              className="session-form-input"
              placeholder="e.g. Interview Prep for SDE Roles"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="session-form-group">
            <label className="session-form-label">Description <span className="session-required">*</span></label>
            <textarea
              className="session-form-textarea"
              placeholder="What will this session cover? Who is it for? What should attendees expect?"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="session-form-group">
            <label className="session-form-label">Proposed Date &amp; Time <span className="session-required">*</span></label>
            <input
              type="datetime-local"
              className="session-form-input"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
            />
          </div>

          {error && (
            <div className="session-error-banner">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="session-modal-footer">
          <p className="session-modal-note">
            📋 Your request will be reviewed by an admin before going live.
          </p>
          <div className="session-modal-actions">
            <button className="session-cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="session-submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><span className="session-btn-spinner" /> Submitting...</>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Sessions() {
  const navigate = useNavigate();
  const { username } = useParams();
  
  const [currentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'my_requests'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  
  // Applicants
  const [applicants, setApplicants] = useState({});
  const [loadingApplicants, setLoadingApplicants] = useState({});
  const [applyStatus, setApplyStatus] = useState({});

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'upcoming') {
        const data = await getApprovedSessions();
        setSessions(data.sessions || []);
      } else {
        const data = await getMySessionRequests(currentUser.type, currentUser.id);
        const mySessions = data.sessions || [];
        
        if (activeTab === 'completed') {
           setSessions(mySessions.filter(s => s.status === 'approved' && new Date(s.scheduled_at) < new Date()));
        } else {
           setSessions(mySessions.filter(s => !(s.status === 'approved' && new Date(s.scheduled_at) < new Date())));
        }
      }
      
      // Load notifications in background
      getNotifications(currentUser.type, currentUser.id)
        .then(data => setNotifications(data.notifications || []))
        .catch(console.error);
        
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (sessionId) => {
    if (!currentUser) return;
    setApplyStatus(prev => ({ ...prev, [sessionId]: 'loading' }));
    try {
      await applySession(sessionId, {
        applicant_type: currentUser.type,
        applicant_id: currentUser.id
      });
      setApplyStatus(prev => ({ ...prev, [sessionId]: 'applied' }));
      setSuccessMsg('Applied to session successfully. Organizer has been notified.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      console.error('Failed to apply', e);
      setApplyStatus(prev => ({ ...prev, [sessionId]: 'failed' }));
      setSuccessMsg(e.response?.data?.message || 'Failed to apply. Maybe already applied.');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const loadApplicants = async (sessionId) => {
    if (!currentUser) return;
    setLoadingApplicants(prev => ({ ...prev, [sessionId]: true }));
    try {
      const data = await getSessionApplicants(sessionId, currentUser.type, currentUser.id);
      setApplicants(prev => ({ ...prev, [sessionId]: data.applicants || [] }));
    } catch (e) {
      console.error('Failed to load applicants', e);
    } finally {
      setLoadingApplicants(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleModalClose = () => setShowModal(false);
  const handleCreated = () => {
    setSuccessMsg("Session request submitted successfully! Pending admin approval.");
    setTimeout(() => setSuccessMsg(""), 5000);
    if (activeTab === 'my_requests') {
      loadData();
    } else {
      setActiveTab('my_requests');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.notification_id);
        setNotifications(prev => prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: 1 } : n));
      } catch(e) { console.error(e); }
    }
  };

  return (
    <div className="homepage-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <button className="icon-btn" title="Back to Home" onClick={() => navigate(`/${username}/home`)} style={{fontSize: '1.2rem'}}>🏠</button>
        </div>
        <div className="nav-center">
          <img src={logo} alt="Logo" className="nav-logo" />
          <h1 className="nav-title">AlmaMatters Sessions</h1>
        </div>
        <div className="nav-right" style={{position: 'relative'}}>
          <button className="icon-btn" title="Notifications" onClick={() => setShowNotifMenu(!showNotifMenu)} style={{position: 'relative'}}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', 
                borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifMenu && (
            <div style={{
              position: 'absolute', top: '40px', right: 0, width: '300px', maxHeight: '400px', overflowY: 'auto',
              background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100
            }}>
              <div style={{padding: '10px 15px', borderBottom: '1px solid #E2E8F0', fontWeight: 'bold'}}>Notifications</div>
              {notifications.length === 0 ? (
                <div style={{padding: '15px', color: '#64748B', textAlign: 'center'}}>No notifications</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.notification_id} 
                    onClick={() => handleNotifClick(n)}
                    style={{
                      padding: '12px 15px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                      backgroundColor: n.is_read ? 'white' : '#F0F9FF'
                    }}
                  >
                    <p style={{margin: 0, fontSize: '0.9rem', color: '#334155'}}>{n.message}</p>
                    <span style={{fontSize: '0.75rem', color: '#94A3B8'}}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="feed-container">
        
        {/* Header and Add Button */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <div style={{display: 'flex', gap: '15px'}}>
              <button 
                style={{
                  padding: '8px 4px', border: 'none', background: 'none', 
                  fontSize: '1.2rem', fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal',
                  color: activeTab === 'upcoming' ? '#3B82F6' : '#64748B',
                  borderBottom: activeTab === 'upcoming' ? '3px solid #3B82F6' : '3px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming Sessions
              </button>
              <button 
                style={{
                  padding: '8px 4px', border: 'none', background: 'none', 
                  fontSize: '1.2rem', fontWeight: activeTab === 'my_requests' ? 'bold' : 'normal',
                  color: activeTab === 'my_requests' ? '#3B82F6' : '#64748B',
                  borderBottom: activeTab === 'my_requests' ? '3px solid #3B82F6' : '3px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('my_requests')}
              >
                My Requests
              </button>
              <button 
                style={{
                  padding: '8px 4px', border: 'none', background: 'none', 
                  fontSize: '1.2rem', fontWeight: activeTab === 'completed' ? 'bold' : 'normal',
                  color: activeTab === 'completed' ? '#3B82F6' : '#64748B',
                  borderBottom: activeTab === 'completed' ? '3px solid #3B82F6' : '3px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('completed')}
              >
                Completed
              </button>
            </div>
            <button
               className="btn-primary"
               style={{padding: '8px 16px', borderRadius: '8px'}}
               onClick={() => setShowModal(true)}
            >
               + Request Session
            </button>
        </div>

        {successMsg && <div className="success-banner" style={{backgroundColor:'#10B981', color:'white', padding:'10px', borderRadius:'8px', marginBottom:'15px'}}>{successMsg}</div>}

        {/* Sessions List */}
        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <div className="feed-empty">
            <p>{activeTab === 'upcoming' ? 'No upcoming sessions scheduled. Why not request one?' : activeTab === 'completed' ? 'No completed sessions yet.' : 'You have not requested any sessions.'}</p>
          </div>
        ) : (
          sessions.map(session => {
            const isOrganizer = currentUser && session.requester_type === currentUser.type && Number(session.requester_id) === Number(currentUser.id);
            const sessionApplicants = applicants[session.session_id] || [];
            return (
              <div key={session.session_id} className="post-card" style={{
                borderLeft: session.status === 'pending' ? '5px solid #F59E0B' : 
                            session.status === 'approved' ? '5px solid #3B82F6' : '5px solid #EF4444', 
                marginBottom:'15px'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h3 style={{margin: '0 0 5px 0', fontSize: '1.2rem'}}>{session.title}</h3>
                    {activeTab === 'upcoming' && (
                      <p className="post-meta" style={{margin: '0 0 10px 0'}}>
                        Organized by: <strong>{session.requester_name}</strong>
                      </p>
                    )}
                  </div>
                  {(activeTab === 'my_requests' || activeTab === 'completed') && (
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                      backgroundColor: session.status === 'pending' ? '#FEF3C7' : session.status === 'approved' ? '#DBEAFE' : '#FEE2E2',
                      color: session.status === 'pending' ? '#D97706' : session.status === 'approved' ? '#1D4ED8' : '#DC2626'
                    }}>
                      {activeTab === 'completed' ? 'COMPLETED' : session.status.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <p className="post-content">{session.description}</p>
                <div style={{marginTop: '8px', color: '#0369A1', fontWeight: 'bold'}}>
                   📅 {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'TBD'}
                </div>
                
                {(activeTab === 'my_requests' || activeTab === 'completed') && session.status === 'approved' && (
                  <div style={{marginTop: '8px', fontSize: '0.9rem', color: '#64748B'}}>
                    <strong>Applicants:</strong> {session.applicant_count || 0}
                  </div>
                )}

                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'10px'}}>
                  {activeTab === 'upcoming' && !isOrganizer && (
                    <button
                      className="btn-primary"
                      style={{padding: '6px 14px', borderRadius: '6px'}}
                      onClick={() => handleApply(session.session_id)}
                      disabled={applyStatus[session.session_id] === 'loading' || applyStatus[session.session_id] === 'applied'}
                    >
                      {applyStatus[session.session_id] === 'loading' ? 'Applying...' : applyStatus[session.session_id] === 'applied' ? 'Applied' : 'Apply'}
                    </button>
                  )}

                  {isOrganizer && session.status === 'approved' && (
                    <button
                      className="btn-secondary"
                      style={{padding: '6px 14px', borderRadius: '6px'}}
                      onClick={() => loadApplicants(session.session_id)}
                    >
                      {loadingApplicants[session.session_id] ? 'Loading...' : 'View Applicants'}
                    </button>
                  )}
                </div>

                {isOrganizer && sessionApplicants.length > 0 && (
                  <div style={{marginTop:'10px', padding:'8px', backgroundColor:'#F8FAFC', border:'1px solid #CBD5E1', borderRadius:'6px'}}>
                    <strong>Applicants ({sessionApplicants.length})</strong>
                    <ul style={{margin:'5px 0 0 15px'}}>
                      {sessionApplicants.map((app) => (
                        <li key={`${app.applicant_type}-${app.applicant_id}`}>
                          {app.applicant_name || `${app.applicant_type} ${app.applicant_id}`} ({app.applicant_type})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/sessions`)} style={{color: '#3b82f6'}}>
          <span className="nav-icon">📅</span>
          <span>Sessions</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate(`/${username}/progress`)}>
          <span className="nav-icon">📈</span>
          <span>Progress</span>
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

      {showModal && (
        <RequestSessionModal
           currentUser={currentUser}
           onClose={handleModalClose}
           onCreated={handleCreated}
        />
      )}
    </div>
  );
}