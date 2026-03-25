import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getCommunities, 
    createCommunity, 
    joinCommunity, 
    getCommunityMessages, 
    sendCommunityMessage 
} from './api';
import './Communities.css';
import { Avatar, timeAgo } from './HomePage';

export default function Communities() {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'my'
    const [selectedComm, setSelectedComm] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const currentUser = (() => {
        try { return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); } catch { return null; }
    })();

    const loadCommunities = async () => {
        setLoading(true);
        try {
            const data = await getCommunities(currentUser?.type, currentUser?.id);
            setCommunities(data.communities || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (commId) => {
        try {
            const data = await getCommunityMessages(commId, currentUser?.type, currentUser?.id);
            setMessages(data.messages || []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadCommunities();
    }, []);

    useEffect(() => {
        if (selectedComm) {
            loadMessages(selectedComm.community_id);
            // Polling for new messages
            const interval = setInterval(() => loadMessages(selectedComm.community_id), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedComm]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        try {
            await createCommunity({
                ...form,
                owner_type: currentUser.type,
                owner_id: currentUser.id
            });
            setShowCreateModal(false);
            setForm({ name: '', description: '' });
            loadCommunities();
        } catch (e) {
            console.error(e);
        }
    };

    const handleJoinRequest = async (commId) => {
        try {
            await joinCommunity(commId, {
                user_type: currentUser.type,
                user_id: currentUser.id
            });
            loadCommunities();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedComm) return;
        try {
            await sendCommunityMessage(selectedComm.community_id, {
                sender_type: currentUser.type,
                sender_id: currentUser.id,
                content: newMessage
            });
            setNewMessage('');
            loadMessages(selectedComm.community_id);
        } catch (e) {
            console.error(e);
        }
    };

    const myComms = communities.filter(c => c.membership_status === 'accepted');
    const discoverComms = communities.filter(c => c.membership_status !== 'accepted');

    return (
        <div className="communities-container">
            {/* Sidebar */}
            <div className="communities-sidebar">
                <div className="sidebar-header">
                    <h2>Communities</h2>
                    <button className="create-comm-btn" onClick={() => setShowCreateModal(true)}>
                        + Create Community
                    </button>
                </div>
                <div className="sidebar-tabs">
                    <div className={`sidebar-tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
                        My Channels
                    </div>
                    <div className={`sidebar-tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
                        Discover
                    </div>
                </div>
                <div className="comm-list">
                    {activeTab === 'my' ? (
                        myComms.length === 0 ? <p style={{padding: '20px', color: '#65676b'}}>No channels yet.</p> :
                        myComms.map(c => (
                            <div 
                                key={c.community_id} 
                                className={`comm-item ${selectedComm?.community_id === c.community_id ? 'active' : ''}`}
                                onClick={() => setSelectedComm(c)}
                            >
                                <div className="comm-icon">#</div>
                                <div className="comm-info">
                                    <h4>{c.name}</h4>
                                    <p>{c.member_count} members</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{padding: '20px', color: '#65676b'}}>Browse channels in Discover tab</p>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="communities-main">
                {activeTab === 'discover' ? (
                    <div className="discover-grid">
                        {discoverComms.map(c => (
                            <div key={c.community_id} className="discover-card">
                                <div className="discover-icon">#{c.name[0].toUpperCase()}</div>
                                <h4>{c.name}</h4>
                                <p>{c.description || 'No description available.'}</p>
                                <div style={{fontSize: '0.8rem', color: '#65676b', marginBottom: '10px'}}>
                                    Owner: {c.owner_name} • {c.member_count} members
                                </div>
                                {c.membership_status === 'pending' ? (
                                    <button className="join-req-btn pending" disabled>Pending Review</button>
                                ) : (
                                    <button className="join-req-btn" onClick={() => handleJoinRequest(c.community_id)}>
                                        Request to Join
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : selectedComm ? (
                    <>
                        <div className="chat-header">
                            <div>
                                <h3>{selectedComm.name}</h3>
                                <div style={{fontSize: '0.85rem', color: '#65676b'}}>{selectedComm.member_count} members</div>
                            </div>
                            <button className="icon-btn" title="Info">ℹ️</button>
                        </div>
                        <div className="chat-messages">
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_type === currentUser.type && String(msg.sender_id) === String(currentUser.id);
                                return (
                                    <div key={msg.message_id} className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}>
                                        {!isMe && <span className="message-sender">{msg.sender_name}</span>}
                                        <div className="message-content">{msg.content}</div>
                                        <span className="message-time">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="chat-input-area">
                            <input 
                                className="chat-input" 
                                placeholder="Message the community..." 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button className="chat-send-btn" onClick={handleSendMessage}>➤</button>
                        </div>
                    </>
                ) : (
                    <div className="no-comm-selected">
                        <div style={{fontSize: '4rem', marginBottom: '20px'}}>💬</div>
                        <h3>Your Community Hub</h3>
                        <p>Select a channel to start chatting or discover new ones.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>New Community</h2>
                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label>Name</label>
                                <input 
                                    placeholder="e.g. AI Enthusists" 
                                    value={form.name} 
                                    onChange={e => setForm({...form, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    placeholder="What's this community about?" 
                                    value={form.description} 
                                    onChange={e => setForm({...form, description: e.target.value})} 
                                    rows={3} 
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="create-comm-btn" style={{marginTop: 0}}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
