import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getApprovedSessions, requestSession, applySession,
  getSessionApplicants, getNotifications,
  getMySessionRequests, markNotificationRead,
} from "./api";
import "./Sessions.css";
import logo from "../assets/almamatterslogowithname.jpeg";

/* ══════════════════════════════════════════
   ICONS
══════════════════════════════════════════ */
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="13" height="13">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function DateBadge({ dateStr }) {
  if (!dateStr) return (
    <div className="date-badge">
      <span className="date-badge__month">TBD</span>
      <span className="date-badge__day">--</span>
    </div>
  );
  const d = new Date(dateStr);
  return (
    <div className="date-badge">
      <span className="date-badge__month">{MONTHS[d.getMonth()]}</span>
      <span className="date-badge__day">{String(d.getDate()).padStart(2,"0")}</span>
      <span className="date-badge__year">{d.getFullYear()}</span>
    </div>
  );
}

const STATUS_CLASS = {
  approved: "tag--approved",
  pending:  "tag--pending",
  rejected: "tag--rejected",
};

/* ══════════════════════════════════════════
   REQUEST SESSION MODAL
══════════════════════════════════════════ */
function RequestSessionModal({ currentUser, onClose, onCreated }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) { setError("Title and description are required."); return; }
    if (!scheduledAt) { setError("Proposed date & time is required."); return; }
    setLoading(true);
    try {
      await requestSession({ requester_type: currentUser.type, requester_id: currentUser.id, title, description, scheduled_at: scheduledAt });
      onCreated(); onClose();
    } catch { setError("Failed to submit request. Try again."); }
    finally  { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Request a Session</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-field">
          <label className="modal-label">Session Title</label>
          <input type="text" className="modal-input"
            placeholder="e.g. Breaking into Product Management"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="modal-field">
          <label className="modal-label">What will the session cover?</label>
          <textarea className="modal-textarea" rows={4}
            placeholder="Describe the topic, goals, and who it's for…"
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="modal-field">
          <label className="modal-label">Proposed Date & Time</label>
          <input type="datetime-local" className="modal-input"
            value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
        </div>
        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="modal-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function Sessions() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [currentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("currentUser") || "null"); } catch { return null; }
  });

  const [activeTab,   setActiveTab]   = useState("upcoming");
  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [successMsg,  setSuccessMsg]  = useState("");

  const [notifications,  setNotifications]  = useState([]);
  const [showNotifMenu,  setShowNotifMenu]  = useState(false);
  const notifRef = useRef(null);

  const [applicants,         setApplicants]         = useState({});
  const [loadingApplicants,  setLoadingApplicants]  = useState({});
  const [expandedApplicants, setExpandedApplicants] = useState({});
  const [applyStatus,        setApplyStatus]        = useState({});

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    loadData();
  }, [currentUser, navigate, activeTab]); // eslint-disable-line

  useEffect(() => {
    const handler = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "upcoming") {
        const data = await getApprovedSessions();
        setSessions(data.sessions || []);
      } else {
        const data = await getMySessionRequests(currentUser.type, currentUser.id);
        const all  = data.sessions || [];
        setSessions(
          activeTab === "completed"
            ? all.filter(s => s.status === "approved" && new Date(s.scheduled_at) < new Date())
            : all.filter(s => !(s.status === "approved" && new Date(s.scheduled_at) < new Date()))
        );
      }
      getNotifications(currentUser.type, currentUser.id)
        .then(d => setNotifications(d.notifications || []))
        .catch(console.error);
    } catch (e) { console.error("Failed to fetch sessions", e); }
    finally     { setLoading(false); }
  };

  const flash = msg => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 5000); };

  const handleApply = async sessionId => {
    setApplyStatus(p => ({ ...p, [sessionId]: "loading" }));
    try {
      await applySession(sessionId, { applicant_type: currentUser.type, applicant_id: currentUser.id });
      setApplyStatus(p => ({ ...p, [sessionId]: "applied" }));
      flash("Applied successfully! The organizer has been notified.");
    } catch (e) {
      setApplyStatus(p => ({ ...p, [sessionId]: "failed" }));
      flash(e.response?.data?.message || "Could not apply. You may have already applied.");
    }
  };

  const toggleApplicants = async sessionId => {
    if (expandedApplicants[sessionId]) {
      setExpandedApplicants(p => ({ ...p, [sessionId]: false })); return;
    }
    setLoadingApplicants(p => ({ ...p, [sessionId]: true }));
    try {
      const data = await getSessionApplicants(sessionId, currentUser.type, currentUser.id);
      setApplicants(p => ({ ...p, [sessionId]: data.applicants || [] }));
      setExpandedApplicants(p => ({ ...p, [sessionId]: true }));
    } catch { console.error("Failed to load applicants"); }
    finally { setLoadingApplicants(p => ({ ...p, [sessionId]: false })); }
  };

  const handleNotifClick = async notif => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.notification_id);
        setNotifications(p => p.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: 1 } : n));
      } catch { /* silent */ }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const TABS = [
    { key: "upcoming",    label: "Upcoming" },
    { key: "my_requests", label: "My Requests" },
    { key: "completed",   label: "Completed" },
  ];
  const EMPTY = {
    upcoming:    "No upcoming sessions yet. Request one and connect with alumni!",
    my_requests: "You haven't requested any sessions yet.",
    completed:   "No completed sessions yet.",
  };

  const stagger = i => ({ animationDelay: `${i * 0.05}s` });

  return (
    <div className="sessions-root">

      {/* ══ TOPBAR ══ */}
      <header className="topbar">
        <div className="topbar__left">
          <button className="topbar__icon-btn" onClick={() => navigate(`/${username}/home`)} title="Home">
            <HomeIcon />
          </button>
        </div>

        <div className="topbar__center">
          <img src={logo} alt="AlmaMatters" className="topbar__logo-img" />
          <h1 className="topbar__title">Sessions</h1>
        </div>

        <div className="topbar__right" ref={notifRef}>
          <button className="topbar__icon-btn" onClick={() => setShowNotifMenu(v => !v)} title="Notifications">
            <BellIcon />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifMenu && (
            <div className="notif-dropdown">
              <div className="notif-dropdown__header">Notifications</div>
              {notifications.length === 0 ? (
                <div className="notif-dropdown__empty">You're all caught up 👌</div>
              ) : notifications.map(n => (
                <div key={n.notification_id}
                  className={`notif-item${n.is_read ? "" : " notif-item--unread"}`}
                  onClick={() => handleNotifClick(n)}>
                  <p className="notif-item__msg">{n.message}</p>
                  <span className="notif-item__time">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main className="sessions-page">

        <div className="sessions-heading">
          <h1>Alumni <span>Sessions</span></h1>
        </div>

        {/* Tabs + CTA */}
        <div className="tabs-row">
          {TABS.map(t => (
            <button key={t.key}
              className={`tab${activeTab === t.key ? " tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
          <span className="tabs-row__spacer" />
          <button className="btn-request" onClick={() => setShowModal(true)}>
            <PlusIcon /> Request Session
          </button>
        </div>

        {/* Flash */}
        {successMsg && (
          <div className="flash-banner">
            <CheckIcon /> {successMsg}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading sessions…</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><CalIcon /></div>
            <p className="empty-state__title">
              {activeTab === "upcoming" ? "No upcoming sessions" :
               activeTab === "completed" ? "No completed sessions" : "No requests yet"}
            </p>
            <p className="empty-state__desc">{EMPTY[activeTab]}</p>
            <button className="btn-request" onClick={() => setShowModal(true)} style={{ marginTop: 6 }}>
              <PlusIcon /> Request a Session
            </button>
          </div>
        ) : (
          sessions.map((session, i) => {
            const isOrganizer = currentUser &&
              session.requester_type === currentUser.type &&
              Number(session.requester_id) === Number(currentUser.id);
            const sessionApplicants = applicants[session.session_id] || [];
            const isExpanded        = !!expandedApplicants[session.session_id];
            const applied           = applyStatus[session.session_id];
            const cardStatus        = session.status || "approved";

            return (
              <div key={session.session_id}
                className={`session-card session-card--${cardStatus}`}
                style={stagger(i)}>

                <DateBadge dateStr={session.scheduled_at} />

                <div className="session-card__body">
                  <div className="session-card__top-row">
                    <h3 className="session-card__title">{session.title}</h3>
                    {(activeTab === "my_requests" || activeTab === "completed") && (
                      <span className={`session-tag ${activeTab === "completed" ? "tag--completed" : STATUS_CLASS[session.status] || ""}`}>
                        {activeTab === "completed" ? "COMPLETED" : session.status?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p className="session-card__desc">{session.description}</p>

                  <div className="session-card__meta">
                    {session.scheduled_at && (
                      <span className="session-card__meta-item">
                        <ClockIcon />
                        {new Date(session.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    )}
                    {activeTab === "upcoming" && session.requester_name && (
                      <span className="session-card__meta-item">
                        <UserIcon /> {session.requester_name}
                      </span>
                    )}
                    {(activeTab === "my_requests" || activeTab === "completed") && session.status === "approved" && (
                      <span className="session-card__meta-item">
                        <UserIcon /> {session.applicant_count || 0} applicant{session.applicant_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="session-card__actions">
                    {activeTab === "upcoming" && !isOrganizer && (
                      <button
                        className={`btn-apply${applied === "applied" ? " btn-apply--done" : ""}`}
                        onClick={() => handleApply(session.session_id)}
                        disabled={applied === "loading" || applied === "applied"}>
                        {applied === "loading" ? "Applying…" : applied === "applied" ? "✓ Applied" : "Apply Now"}
                      </button>
                    )}
                    {isOrganizer && session.status === "approved" && (
                      <button className="btn-secondary-sm" onClick={() => toggleApplicants(session.session_id)}>
                        {loadingApplicants[session.session_id] ? "Loading…" : isExpanded ? "Hide Applicants ▲" : "View Applicants ▼"}
                      </button>
                    )}
                  </div>

                  {isOrganizer && isExpanded && (
                    <div className="applicants-list">
                      {sessionApplicants.length === 0 ? (
                        <p className="applicants-list__empty">No applicants yet.</p>
                      ) : (
                        <>
                          <p className="applicants-list__title">Applicants ({sessionApplicants.length})</p>
                          {sessionApplicants.map(app => (
                            <div key={`${app.applicant_type}-${app.applicant_id}`} className="applicant-row">
                              <div className="applicant-avatar">{(app.applicant_name || "U")[0].toUpperCase()}</div>
                              <div>
                                <p className="applicant-name">{app.applicant_name || `User ${app.applicant_id}`}</p>
                                <p className="applicant-type">{app.applicant_type}</p>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* ══ BOTTOM NAV ══ */}
      <nav className="bottom-nav">
        <button className="bottom-nav__home" onClick={() => navigate(`/${username}/home`)}>
          <HomeIcon />
          <span>Home</span>
        </button>
      </nav>

      {showModal && (
        <RequestSessionModal currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            flash("Session request submitted! Pending admin approval.");
            if (activeTab === "my_requests") loadData(); else setActiveTab("my_requests");
          }} />
      )}
    </div>
  );
}
