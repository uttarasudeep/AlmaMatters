import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  searchUsers,
} from "./api";
import "./Messages.css";
import logo from "../assets/almamatterslogowithname.jpeg";

function Avatar({ name, photo, size = 40 }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const colorIdx =
    name ? name.charCodeAt(0) % colors.length : 0;

  if (photo) {
    return (
      <img
        src={photo.startsWith("http") ? photo : `http://localhost:3000${photo}`}
        alt={name}
        className="msg-avatar-img"
        style={{ width: size, height: size }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className="msg-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        backgroundColor: colors[colorIdx],
      }}
    >
      {initial}
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Messages() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [currentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("currentUser") || "null");
    } catch {
      return null;
    }
  });

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  // Search state
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const inputRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Load conversations on mount
  useEffect(() => {
    if (!currentUser) return;
    loadConversations();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new messages in active conversation
  useEffect(() => {
    if (!activeConv) return;
    pollingRef.current = setInterval(() => {
      loadMessages(activeConv.conversation_id, false);
      loadConversations(false);
    }, 3000);
    return () => clearInterval(pollingRef.current);
  }, [activeConv]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConversations = async (showLoading = true) => {
    try {
      if (showLoading) setLoadingConvs(true);
      const data = await getConversations(currentUser.type, currentUser.id);
      setConversations(data.conversations || []);
    } catch (e) {
      console.error("Failed to load conversations", e);
    } finally {
      if (showLoading) setLoadingConvs(false);
    }
  };

  const loadMessages = useCallback(async (convId, showLoading = true) => {
    try {
      if (showLoading) setLoadingMsgs(true);
      const data = await getMessages(convId);
      setMessages(data.messages || []);
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      if (showLoading) setLoadingMsgs(false);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMessages([]);
    setSearchQ("");
    setSearchResults([]);
    setShowDropdown(false);
    await loadMessages(conv.conversation_id);
    // Mark as read
    try {
      await markConversationRead(conv.conversation_id, currentUser.type, currentUser.id);
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === conv.conversation_id
            ? { ...c, unread_count: 0 }
            : c
        )
      );
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const startConversationWithUser = async (user) => {
    try {
      const data = await getOrCreateConversation(
        currentUser.type,
        currentUser.id,
        user.type,
        user.id
      );
      const conv = data.conversation;
      // Build a rich conv object for the active state
      const richConv = {
        ...conv,
        other_type: user.type,
        other_id: user.id,
        other_name: user.name,
        other_photo: user.profile_photo_url || null,
        unread_count: 0,
        last_message: null,
      };
      setActiveConv(richConv);
      setMessages([]);
      setSearchQ("");
      setSearchResults([]);
      setShowDropdown(false);
      // Refresh conversations list
      await loadConversations(false);
      await loadMessages(conv.conversation_id);
      inputRef.current?.focus();
    } catch (e) {
      console.error("Failed to open conversation", e);
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConv || sending) return;
    const content = messageInput.trim();
    setMessageInput("");
    setSending(true);

    // Optimistic UI
    const tempMsg = {
      message_id: `temp-${Date.now()}`,
      conversation_id: activeConv.conversation_id,
      sender_type: currentUser.type,
      sender_id: currentUser.id,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await sendMessage(
        activeConv.conversation_id,
        currentUser.type,
        currentUser.id,
        content
      );
      // Refresh to get actual message from server
      await loadMessages(activeConv.conversation_id, false);
      await loadConversations(false);
    } catch (e) {
      console.error("Failed to send message", e);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((m) => m.message_id !== tempMsg.message_id)
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Search users
  useEffect(() => {
    if (!searchQ || searchQ.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchUsers(searchQ);
        // Filter out current user
        const filtered = (data.users || []).filter(
          (u) =>
            !(u.type === currentUser.type && Number(u.id) === Number(currentUser.id))
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQ, currentUser]);

  if (!currentUser) return null;

  return (
    <div className="msg-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-left">
          <button
            className="icon-btn"
            title="Back to Home"
            onClick={() => navigate(`/${username}/home`)}
          >
            🏠
          </button>
        </div>
        <div className="nav-center">
          <img src={logo} alt="Logo" className="nav-logo" />
          <h1 className="nav-title">Messaging</h1>
        </div>
        <div className="nav-right" />
      </nav>

      {/* Two-panel layout */}
      <div className="msg-layout">
        {/* LEFT SIDEBAR */}
        <aside className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h2 className="msg-sidebar-title">Messages</h2>
          </div>

          {/* Search new people */}
          <div className="msg-search-wrap">
            <div className="msg-search-box">
              <span className="msg-search-icon">🔍</span>
              <input
                type="text"
                className="msg-search-input"
                placeholder="Search people to message..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {searching && <span className="msg-search-spinner" />}
            </div>

            {showDropdown && searchResults.length > 0 && (
              <div className="msg-search-dropdown">
                {searchResults.map((user) => (
                  <div
                    key={`${user.type}-${user.id}`}
                    className="msg-search-result"
                    onMouseDown={() => startConversationWithUser(user)}
                  >
                    <Avatar name={user.name} photo={user.profile_photo_url} size={36} />
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

          {/* Conversation list */}
          <div className="msg-conv-list">
            {loadingConvs ? (
              <div className="msg-loading">
                <div className="spinner" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="msg-conv-empty">
                <p>💬</p>
                <p>No messages yet.</p>
                <p>Search for someone to start chatting!</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive =
                  activeConv?.conversation_id === conv.conversation_id;
                return (
                  <div
                    key={conv.conversation_id}
                    className={`msg-conv-item ${isActive ? "active" : ""}`}
                    onClick={() => openConversation(conv)}
                  >
                    <Avatar
                      name={conv.other_name}
                      photo={conv.other_photo}
                      size={48}
                    />
                    <div className="msg-conv-info">
                      <div className="msg-conv-top">
                        <span className="msg-conv-name">{conv.other_name}</span>
                        <span className="msg-conv-time">
                          {formatTime(conv.last_message_time)}
                        </span>
                      </div>
                      <div className="msg-conv-bottom">
                        <span className="msg-conv-preview">
                          {conv.last_message
                            ? conv.last_message.length > 40
                              ? conv.last_message.slice(0, 40) + "…"
                              : conv.last_message
                            : "No messages yet"}
                        </span>
                        {Number(conv.unread_count) > 0 && (
                          <span className="msg-unread-badge">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL - Chat */}
        <main className="msg-chat-panel">
          {!activeConv ? (
            <div className="msg-chat-empty">
              <div className="msg-chat-empty-icon">💬</div>
              <h3>Your Messages</h3>
              <p>
                Send private messages to people you follow.
                <br />
                Search for someone to get started.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="msg-chat-header">
                <Avatar
                  name={activeConv.other_name}
                  photo={activeConv.other_photo}
                  size={42}
                />
                <div className="msg-chat-header-info">
                  <span className="msg-chat-header-name">
                    {activeConv.other_name}
                  </span>
                  <span className="msg-chat-header-type">
                    {activeConv.other_type}
                  </span>
                </div>
                <button
                  className="msg-view-profile-btn"
                  onClick={() =>
                    navigate(
                      `/${username}/profile/${activeConv.other_type}/${activeConv.other_id}`
                    )
                  }
                >
                  View Profile
                </button>
              </div>

              {/* Messages */}
              <div className="msg-messages-scroll">
                {loadingMsgs ? (
                  <div className="msg-loading">
                    <div className="spinner" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="msg-thread-empty">
                    <Avatar
                      name={activeConv.other_name}
                      photo={activeConv.other_photo}
                      size={64}
                    />
                    <p>
                      This is the beginning of your conversation with{" "}
                      <strong>{activeConv.other_name}</strong>.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isMine =
                        msg.sender_type === currentUser.type &&
                        Number(msg.sender_id) === Number(currentUser.id);
                      const prevMsg = messages[idx - 1];
                      const showTimestamp =
                        !prevMsg ||
                        new Date(msg.created_at) - new Date(prevMsg.created_at) >
                          5 * 60 * 1000;

                      return (
                        <React.Fragment key={msg.message_id}>
                          {showTimestamp && (
                            <div className="msg-timestamp">
                              {new Date(msg.created_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                          <div
                            className={`msg-bubble-row ${
                              isMine ? "mine" : "theirs"
                            }`}
                          >
                            {!isMine && (
                              <Avatar
                                name={activeConv.other_name}
                                photo={activeConv.other_photo}
                                size={28}
                              />
                            )}
                            <div
                              className={`msg-bubble ${
                                isMine ? "msg-bubble-mine" : "msg-bubble-theirs"
                              }`}
                            >
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

              {/* Message Input */}
              <div className="msg-input-bar">
                <textarea
                  ref={inputRef}
                  className="msg-input"
                  placeholder={`Message ${activeConv.other_name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  className={`msg-send-btn ${
                    messageInput.trim() ? "active" : ""
                  }`}
                  onClick={handleSend}
                  disabled={!messageInput.trim() || sending}
                  title="Send (Enter)"
                >
                  {sending ? (
                    <span className="msg-send-spinner" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M2 21L23 12 2 3v7l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
