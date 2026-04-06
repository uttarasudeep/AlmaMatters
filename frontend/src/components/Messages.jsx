import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getConversations, getOrCreateConversation, getMessages,
  sendMessage, markConversationRead, searchUsers,
} from "./api";
import "./Messages.css";
import logo from "../assets/almamatterslogowithname.jpeg";

/* ─────────────────────────────────────
   AVATAR
───────────────────────────────────── */
function Avatar({ name, photo, size = 40 }) {
  const colors = ["#1c65a0","#0d7a5f","#7c3aed","#b45309","#0e7490"];
  const idx    = name ? name.charCodeAt(0) % colors.length : 0;
  if (photo) return (
    <img src={photo.startsWith("http") ? photo : `http://localhost:3000${photo}`}
      alt={name} className="msg-avatar-img"
      style={{ width: size, height: size }}
      onError={e => { e.target.style.display = "none"; }} />
  );
  return (
    <div className="msg-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: colors[idx] }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

/* ─────────────────────────────────────
   TIME FORMATTER
───────────────────────────────────── */
function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ─────────────────────────────────────
   ICONS
───────────────────────────────────── */
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Messages() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [currentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("currentUser") || "null"); } catch { return null; }
  });

  const [conversations,  setConversations]  = useState([]);
  const [activeConv,     setActiveConv]     = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [messageInput,   setMessageInput]   = useState("");
  const [loadingConvs,   setLoadingConvs]   = useState(true);
  const [loadingMsgs,    setLoadingMsgs]    = useState(false);
  const [sending,        setSending]        = useState(false);
  const [searchQ,        setSearchQ]        = useState("");
  const [searchResults,  setSearchResults]  = useState([]);
  const [searching,      setSearching]      = useState(false);
  const [showDropdown,   setShowDropdown]   = useState(false);

  const messagesEndRef = useRef(null);
  const pollingRef     = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => { if (!currentUser) navigate("/login"); }, [currentUser, navigate]);
  useEffect(() => { if (currentUser) loadConversations(); }, [currentUser]); // eslint-disable-line

  useEffect(() => {
    if (!activeConv) return;
    pollingRef.current = setInterval(() => {
      loadMessages(activeConv.conversation_id, false);
      loadConversations(false);
    }, 3000);
    return () => clearInterval(pollingRef.current);
  }, [activeConv]); // eslint-disable-line

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!searchQ || searchQ.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await searchUsers(searchQ);
        const filtered = (data.users || []).filter(
          u => !(u.type === currentUser.type && Number(u.id) === Number(currentUser.id))
        );
        setSearchResults(filtered); setShowDropdown(true);
      } catch { /* silent */ } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ, currentUser]);

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingConvs(true);
      const data = await getConversations(currentUser.type, currentUser.id);
      setConversations(data.conversations || []);
    } catch { /* silent */ } finally { if (showLoading) setLoadingConvs(false); }
  };

  const loadMessages = useCallback(async (convId, showLoading = true) => {
    try {
      if (showLoading) setLoadingMsgs(true);
      const data = await getMessages(convId);
      setMessages(data.messages || []);
    } catch { /* silent */ } finally { if (showLoading) setLoadingMsgs(false); }
  }, []);

  const openConversation = async (conv) => {
    setActiveConv(conv); setMessages([]);
    setSearchQ(""); setSearchResults([]); setShowDropdown(false);
    await loadMessages(conv.conversation_id);
    try {
      await markConversationRead(conv.conversation_id, currentUser.type, currentUser.id);
      setConversations(p => p.map(c =>
        c.conversation_id === conv.conversation_id ? { ...c, unread_count: 0 } : c
      ));
    } catch { /* silent */ }
  };

  const startConversationWithUser = async (user) => {
    try {
      const data = await getOrCreateConversation(currentUser.type, currentUser.id, user.type, user.id);
      const richConv = {
        ...data.conversation, other_type: user.type, other_id: user.id,
        other_name: user.name, other_photo: user.profile_photo_url || null,
        unread_count: 0, last_message: null,
      };
      setActiveConv(richConv); setMessages([]);
      setSearchQ(""); setSearchResults([]); setShowDropdown(false);
      await loadConversations(false);
      await loadMessages(data.conversation.conversation_id);
      inputRef.current?.focus();
    } catch { /* silent */ }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConv || sending) return;
    const content = messageInput.trim();
    setMessageInput(""); setSending(true);
    const tempMsg = {
      message_id: `temp-${Date.now()}`, conversation_id: activeConv.conversation_id,
      sender_type: currentUser.type, sender_id: currentUser.id,
      content, is_read: false, created_at: new Date().toISOString(),
    };
    setMessages(p => [...p, tempMsg]);
    try {
      await sendMessage(activeConv.conversation_id, currentUser.type, currentUser.id, content);
      await loadMessages(activeConv.conversation_id, false);
      await loadConversations(false);
    } catch {
      setMessages(p => p.filter(m => m.message_id !== tempMsg.message_id));
    } finally { setSending(false); }
  };

  if (!currentUser) return null;

  const unreadTotal = conversations.reduce((s, c) => s + (Number(c.unread_count) || 0), 0);

  return (
    <div className="msg-page">

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="nav-left">
          <button className="icon-btn" onClick={() => navigate(`/${username}/home`)} title="Home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
        </div>
        <div className="nav-center">
          <img src={logo} alt="AlmaMatters" className="nav-logo" />
          <h1 className="nav-title">Messaging</h1>
          {unreadTotal > 0 && (
            <span style={{ background: 'var(--denim-blue)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: '100px' }}>
              {unreadTotal}
            </span>
          )}
        </div>
        <div className="nav-right" />
      </nav>

      {/* ── LAYOUT ── */}
      <div className="msg-layout">

        {/* ════ SIDEBAR ════ */}
        <aside className="msg-sidebar">
          <div className="msg-sidebar-header">
            <span className="msg-sidebar-title">Messages</span>
            {conversations.length > 0 && (
              <span className="msg-sidebar-count">{conversations.length}</span>
            )}
          </div>

          <div className="msg-search-wrap">
            <div className="msg-search-box">
              <span className="msg-search-icon"><SearchIcon /></span>
              <input type="text" className="msg-search-input"
                placeholder="Search people…"
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)} />
              {searching && <span className="msg-search-spinner" />}
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div className="msg-search-dropdown">
                {searchResults.map(user => (
                  <div key={`${user.type}-${user.id}`} className="msg-search-result"
                    onMouseDown={() => startConversationWithUser(user)}>
                    <Avatar name={user.name} photo={user.profile_photo_url} size={34} />
                    <div className="msg-search-result-info">
                      <span className="msg-search-result-name">{user.name}</span>
                      <span className="msg-search-result-type">{user.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && !searching && searchQ.length >= 2 && searchResults.length === 0 && (
              <div className="msg-search-dropdown">
                <div className="msg-search-empty">No users found</div>
              </div>
            )}
          </div>

          <div className="msg-conv-list">
            {loadingConvs ? (
              <div className="msg-loading"><div className="spinner" /></div>
            ) : conversations.length === 0 ? (
              <div className="msg-conv-empty">
                <div className="msg-conv-empty-icon">💬</div>
                <p>No conversations yet.</p>
                <p>Search for someone to start chatting.</p>
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = activeConv?.conversation_id === conv.conversation_id;
                return (
                  <div key={conv.conversation_id}
                    className={`msg-conv-item${isActive ? " active" : ""}`}
                    onClick={() => openConversation(conv)}>
                    <Avatar name={conv.other_name} photo={conv.other_photo} size={44} />
                    <div className="msg-conv-info">
                      <div className="msg-conv-top">
                        <span className="msg-conv-name">{conv.other_name}</span>
                        <span className="msg-conv-time">{formatTime(conv.last_message_time)}</span>
                      </div>
                      <div className="msg-conv-bottom">
                        <span className="msg-conv-preview">
                          {conv.last_message
                            ? conv.last_message.length > 36 ? conv.last_message.slice(0,36) + "…" : conv.last_message
                            : "No messages yet"}
                        </span>
                        {Number(conv.unread_count) > 0 && (
                          <span className="msg-unread-badge">{conv.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ════ CHAT PANEL ════ */}
        <main className="msg-chat-panel">
          {!activeConv ? (
            <div className="msg-chat-empty">
              <div className="msg-chat-empty-icon">✉️</div>
              <h3>Your Messages</h3>
              <p>Send private messages to alumni and students.<br />Search to start a conversation.</p>
            </div>
          ) : (
            <>
              <div className="msg-chat-header">
                <Avatar name={activeConv.other_name} photo={activeConv.other_photo} size={40} />
                <div className="msg-chat-header-info">
                  <span className="msg-chat-header-name">{activeConv.other_name}</span>
                  <span className="msg-chat-header-type">{activeConv.other_type}</span>
                </div>
                <button className="msg-view-profile-btn"
                  onClick={() => navigate(`/${username}/profile/${activeConv.other_type}/${activeConv.other_id}`)}>
                  View Profile →
                </button>
              </div>

              <div className="msg-messages-scroll">
                {loadingMsgs ? (
                  <div className="msg-loading"><div className="spinner" /></div>
                ) : messages.length === 0 ? (
                  <div className="msg-thread-empty">
                    <Avatar name={activeConv.other_name} photo={activeConv.other_photo} size={60} />
                    <p>Start of your conversation with <strong>{activeConv.other_name}</strong>.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isMine = msg.sender_type === currentUser.type && Number(msg.sender_id) === Number(currentUser.id);
                      const prev   = messages[idx - 1];
                      const showTs = !prev || new Date(msg.created_at) - new Date(prev.created_at) > 5 * 60 * 1000;
                      return (
                        <React.Fragment key={msg.message_id}>
                          {showTs && (
                            <div className="msg-timestamp">
                              {new Date(msg.created_at).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                            </div>
                          )}
                          <div className={`msg-bubble-row ${isMine ? "mine" : "theirs"}`}>
                            {!isMine && <Avatar name={activeConv.other_name} photo={activeConv.other_photo} size={26} />}
                            <div className={`msg-bubble ${isMine ? "msg-bubble-mine" : "msg-bubble-theirs"}`}>
                              {msg.content}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="msg-input-bar">
                <textarea ref={inputRef} className="msg-input" rows={1}
                  placeholder={`Message ${activeConv.other_name}…`}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button className={`msg-send-btn${messageInput.trim() ? " active" : ""}`}
                  onClick={handleSend} disabled={!messageInput.trim() || sending}>
                  {sending
                    ? <span className="msg-send-spinner" />
                    : <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 21L23 12 2 3v7l15 2-15 2z"/></svg>}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
