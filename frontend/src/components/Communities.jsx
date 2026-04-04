import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCommunities, createCommunity, joinCommunity,
  getCommunityMessages, sendCommunityMessage,
} from './api';
import './Communities.css';
import logo from '../assets/almamatterslogowithname.jpeg';

/* ══ ICONS ══ */
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="12" height="12">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 21L23 12 2 3v7l15 2-15 2z"/></svg>
);

/* ══ HELPERS ══ */
function commColor(name) {
  const colors = [
    'linear-gradient(135deg,#1c65a0,#0e4a7a)',
    'linear-gradient(135deg,#0d7a5f,#065f46)',
    'linear-gradient(135deg,#7c3aed,#5b21b6)',
    'linear-gradient(135deg,#b45309,#92400e)',
    'linear-gradient(135deg,#0e7490,#0c4a6e)',
  ];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
}

function AvatarCircle({ name, size = 28 }) {
  const colors = ['#1c65a0','#0d7a5f','#7c3aed','#b45309','#0e7490'];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div className="comm-msg-avatar" style={{ width: size, height: size, background: bg }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function Communities() {
  const navigate  = useNavigate();
  const { username } = useParams();

  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
  })();

  const [communities,     setCommunities]     = useState([]);
  const [activeTab,       setActiveTab]       = useState('discover');
  const [selectedComm,    setSelectedComm]    = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [newMessage,      setNewMessage]      = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form,            setForm]            = useState({ name: '', description: '' });
  const [loading,         setLoading]         = useState(false);
  const [joinStatus,      setJoinStatus]      = useState({});
  const chatEndRef = useRef(null);

  const loadCommunities = async () => {
    setLoading(true);
    try {
      const data = await getCommunities(currentUser?.type, currentUser?.id);
      setCommunities(data.communities || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadMessages = async (commId) => {
    try {
      const data = await getCommunityMessages(commId, currentUser?.type, currentUser?.id);
      setMessages(data.messages || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadCommunities(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!selectedComm) return;
    loadMessages(selectedComm.community_id);
    const iv = setInterval(() => loadMessages(selectedComm.community_id), 3000);
    return () => clearInterval(iv);
  }, [selectedComm]); // eslint-disable-line

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await createCommunity({ ...form, owner_type: currentUser.type, owner_id: currentUser.id });
      setShowCreateModal(false);
      setForm({ name: '', description: '' });
      loadCommunities();
    } catch (e) { console.error(e); }
  };

  const handleJoin = async (commId) => {
    setJoinStatus(p => ({ ...p, [commId]: 'loading' }));
    try {
      await joinCommunity(commId, { user_type: currentUser.type, user_id: currentUser.id });
      setJoinStatus(p => ({ ...p, [commId]: 'done' }));
      loadCommunities();
    } catch (e) { console.error(e); setJoinStatus(p => ({ ...p, [commId]: 'error' })); }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedComm) return;
    const text = newMessage; setNewMessage('');
    try {
      await sendCommunityMessage(selectedComm.community_id, {
        sender_type: currentUser.type, sender_id: currentUser.id, content: text,
      });
      loadMessages(selectedComm.community_id);
    } catch (e) { console.error(e); }
  };

  const myComms      = communities.filter(c => c.membership_status === 'accepted');
  const discoverComms= communities.filter(c => c.membership_status !== 'accepted');
  const stagger = i => ({ animationDelay: `${i * 0.05}s` });

  return (
    <div className="comm-page">

      {/* ══ NAVBAR ══ */}
      <nav className="comm-navbar">
        <div className="comm-nav-left">
          <button className="comm-icon-btn" onClick={() => navigate(`/${username}/home`)} title="Home">
            <HomeIcon />
          </button>
        </div>
        <div className="comm-nav-center">
          <img src={logo} alt="AlmaMatters" className="comm-nav-logo" />
          <h1 className="comm-nav-title">Communities</h1>
        </div>
        <div className="comm-nav-right">
          <button className="btn-create-comm" onClick={() => setShowCreateModal(true)}>
            <PlusIcon /> New
          </button>
        </div>
      </nav>

      {/* ══ LAYOUT ══ */}
      <div className="comm-layout">

        {/* ════ SIDEBAR ════ */}
        <aside className="comm-sidebar">
          <div className="comm-sidebar-header">
            <div className="comm-sidebar-top">
              <span className="comm-sidebar-title">Channels</span>
            </div>
            <div className="comm-sidebar-tabs">
              <div className={`comm-sidebar-tab${activeTab === 'my' ? ' active' : ''}`}
                onClick={() => setActiveTab('my')}>My Channels</div>
              <div className={`comm-sidebar-tab${activeTab === 'discover' ? ' active' : ''}`}
                onClick={() => { setActiveTab('discover'); setSelectedComm(null); }}>Discover</div>
            </div>
          </div>

          <div className="comm-list">
            {loading ? (
              <div className="comm-loading"><div className="comm-spinner" /></div>
            ) : activeTab === 'my' ? (
              myComms.length === 0 ? (
                <div className="comm-list-empty">
                  <div className="comm-list-empty-icon">🏘️</div>
                  <p>You haven't joined any channels yet. Discover some!</p>
                </div>
              ) : myComms.map((c, i) => (
                <div key={c.community_id}
                  className={`comm-item${selectedComm?.community_id === c.community_id ? ' active' : ''}`}
                  onClick={() => setSelectedComm(c)} style={stagger(i)}>
                  <div className="comm-item-icon" style={{ background: commColor(c.name) }}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="comm-item-info">
                    <div className="comm-item-name">{c.name}</div>
                    <div className="comm-item-meta">{c.member_count} members</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="comm-list-empty">
                <div className="comm-list-empty-icon">🔍</div>
                <p>Browse communities in the Discover panel →</p>
              </div>
            )}
          </div>
        </aside>

        {/* ════ MAIN PANEL ════ */}
        <main className="comm-main">

          {/* ── DISCOVER ── */}
          {activeTab === 'discover' ? (
            <div className="comm-discover">
              <h2 className="comm-discover-heading">Discover <span>Communities</span></h2>
              <p className="comm-discover-sub">Find your people. Join groups that match your interests and career goals.</p>
              {loading ? (
                <div className="comm-loading"><div className="comm-spinner" /></div>
              ) : discoverComms.length === 0 ? (
                <div className="comm-empty" style={{ marginTop: 60 }}>
                  <div className="comm-empty-icon">🌐</div>
                  <h3>No communities yet</h3>
                  <p>Be the first to create one!</p>
                </div>
              ) : (
                <div className="comm-discover-grid">
                  {discoverComms.map((c, i) => {
                    const js = joinStatus[c.community_id];
                    return (
                      <div key={c.community_id} className="comm-discover-card" style={stagger(i)}>
                        <div className="comm-discover-card-icon" style={{ background: commColor(c.name) }}>
                          {c.name[0].toUpperCase()}
                        </div>
                        <div className="comm-discover-card-name">{c.name}</div>
                        <div className="comm-discover-card-desc">{c.description || 'No description available.'}</div>
                        <div className="comm-discover-card-meta">By {c.owner_name} · {c.member_count} members</div>
                        {c.membership_status === 'pending' || js === 'done' ? (
                          <button className="btn-join pending" disabled>⏳ Pending Review</button>
                        ) : (
                          <button className="btn-join" onClick={() => handleJoin(c.community_id)}
                            disabled={js === 'loading'}>
                            {js === 'loading' ? 'Requesting…' : '+ Request to Join'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          /* ── MY CHANNELS ── */
          ) : !selectedComm ? (
            <div className="comm-empty">
              <div className="comm-empty-icon">💬</div>
              <h3>Select a Channel</h3>
              <p>Pick a channel from the sidebar to start chatting with your community.</p>
            </div>

          /* ── CHAT ── */
          ) : (
            <>
              <div className="comm-chat-header">
                <div className="comm-chat-icon" style={{ background: commColor(selectedComm.name) }}>
                  {selectedComm.name[0].toUpperCase()}
                </div>
                <div className="comm-chat-info">
                  <div className="comm-chat-name">{selectedComm.name}</div>
                  <div className="comm-chat-meta">{selectedComm.member_count} members · Active now</div>
                </div>
              </div>

              <div className="comm-chat-messages">
                {messages.length === 0 ? (
                  <div className="comm-empty">
                    <div className="comm-empty-icon">👋</div>
                    <h3>Start the conversation</h3>
                    <p>Be the first to say something in <strong style={{ color: 'var(--t2)' }}>{selectedComm.name}</strong>!</p>
                  </div>
                ) : messages.map((msg, idx) => {
                  const isMe = msg.sender_type === currentUser?.type && String(msg.sender_id) === String(currentUser?.id);
                  const prev = messages[idx - 1];
                  const showTs = !prev || new Date(msg.created_at) - new Date(prev.created_at) > 5 * 60 * 1000;
                  return (
                    <React.Fragment key={msg.message_id}>
                      {showTs && (
                        <div className="comm-msg-timestamp">
                          {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      <div className={`comm-msg-row${isMe ? ' mine' : ' theirs'}`}>
                        {!isMe && <AvatarCircle name={msg.sender_name} />}
                        <div className="comm-msg-wrap">
                          {!isMe && <div className="comm-msg-sender">{msg.sender_name}</div>}
                          <div className={`comm-bubble${isMe ? ' comm-bubble-mine' : ' comm-bubble-theirs'}`}>
                            {msg.content}
                          </div>
                          <div className="comm-msg-time" style={{ textAlign: isMe ? 'right' : 'left' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="comm-input-bar">
                <input className="comm-input"
                  placeholder={`Message #${selectedComm.name}…`}
                  value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <button className={`comm-send-btn${newMessage.trim() ? ' active' : ''}`} onClick={handleSend}>
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ══ CREATE MODAL ══ */}
      {showCreateModal && (
        <div className="comm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="comm-modal-box" onClick={e => e.stopPropagation()}>
            <div className="comm-modal-header">
              <span className="comm-modal-title">Create a Community</span>
              <button className="comm-modal-close" onClick={() => setShowCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="13" height="13">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="comm-modal-field">
                <label className="comm-modal-label">Community Name</label>
                <input className="comm-modal-input" placeholder="e.g. AI Enthusiasts"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="comm-modal-field">
                <label className="comm-modal-label">Description</label>
                <textarea className="comm-modal-textarea" rows={3}
                  placeholder="What's this community about?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="comm-modal-actions">
                <button type="button" className="comm-modal-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="comm-modal-submit">Create Community</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
