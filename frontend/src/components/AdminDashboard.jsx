import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPendingSessions, getAllSessions, updateSessionStatus } from "./api";
import "./HomePage.css"; 

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'all'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.type !== 'admin') {
      navigate('/admin-login');
      return;
    }
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate, activeTab]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const data = await getPendingSessions();
        setSessions(data.sessions || []);
      } else {
        const data = await getAllSessions();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sessionId, status) => {
    try {
      await updateSessionStatus(sessionId, status, currentUser.id);
      // Remove from pending list if we are in pending tab, or reload if in all tab
      if (activeTab === 'pending') {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      } else {
        loadSessions();
      }
    } catch (e) {
      alert(`Failed to ${status} session.`);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    navigate('/admin-login');
  };

  return (
    <div className="homepage-container">
      <nav className="navbar" style={{backgroundColor: '#1E293B'}}>
        <div className="nav-left"></div>
        <div className="nav-center">
          <h1 className="nav-title" style={{color: 'white'}}>Admin Dashboard</h1>
        </div>
        <div className="nav-right">
          <button className="icon-btn" onClick={handleLogout} title="Logout" style={{color: 'white', backgroundColor: 'transparent', border:'none', fontSize: '1rem', cursor: 'pointer'}}>
            Log Out
          </button>
        </div>
      </nav>

      <main className="feed-container">
        
        {/* Tabs */}
        <div style={{display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px'}}>
          <button 
            style={{
              padding: '8px 16px', border: 'none', background: 'none', 
              fontSize: '1.1rem', fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
              color: activeTab === 'pending' ? '#3B82F6' : '#64748B',
              borderBottom: activeTab === 'pending' ? '3px solid #3B82F6' : '3px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('pending')}
          >
            Pending Requests
          </button>
          <button 
            style={{
              padding: '8px 16px', border: 'none', background: 'none', 
              fontSize: '1.1rem', fontWeight: activeTab === 'all' ? 'bold' : 'normal',
              color: activeTab === 'all' ? '#3B82F6' : '#64748B',
              borderBottom: activeTab === 'all' ? '3px solid #3B82F6' : '3px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('all')}
          >
            All Sessions
          </button>
        </div>

        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p>No sessions found here.</p>
        ) : (
          sessions.map(session => (
            <div key={session.session_id} className="post-card" style={{
              borderLeft: session.status === 'pending' ? '5px solid #F59E0B' : 
                          session.status === 'approved' ? '5px solid #10B981' : '5px solid #EF4444'
            }}>
              <div className="post-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <h3 style={{margin: '0 0 4px 0', fontSize: '1.2rem'}}>{session.title}</h3>
                  <p className="post-meta" style={{margin: 0}}>Requested by: <strong>{session.requester_name}</strong> ({session.requester_type})</p>
                </div>
                <span style={{
                  padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                  backgroundColor: session.status === 'pending' ? '#FEF3C7' : session.status === 'approved' ? '#D1FAE5' : '#FEE2E2',
                  color: session.status === 'pending' ? '#D97706' : session.status === 'approved' ? '#059669' : '#DC2626'
                }}>
                  {session.status.toUpperCase()}
                </span>
              </div>
              
              <p className="post-content" style={{marginTop: '12px'}}>{session.description}</p>
              
              <div style={{marginTop: '12px', fontSize: '0.9rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'}}>
                <div>
                  <strong>Proposed Time: </strong> 
                  {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'TBD'}
                </div>
                {activeTab === 'all' && session.status === 'approved' && (
                  <>
                    {session.approved_by_admin_name && (
                      <div>
                        <strong>Approved by:</strong> {session.approved_by_admin_name}
                      </div>
                    )}
                    <div>
                      <strong>Applicants:</strong> {session.applicant_count || 0}
                    </div>
                  </>
                )}
              </div>

              {session.status === 'pending' && (
                <div className="post-actions" style={{marginTop: '16px', gap: '8px'}}>
                  <button 
                    className="btn-primary" 
                    style={{padding: '6px 16px', backgroundColor: '#10B981', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer'}} 
                    onClick={() => handleStatusUpdate(session.session_id, 'approved')}
                  >
                    Accept & Publish
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{padding: '6px 16px', backgroundColor: '#EF4444', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer'}} 
                    onClick={() => handleStatusUpdate(session.session_id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
