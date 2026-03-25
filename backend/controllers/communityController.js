const db = require('../database');

// Helper to get user display info
async function getUserInfo(userType, userId) {
    let query, params;
    if (userType === 'student') {
        query = `SELECT COALESCE(full_name, CONCAT(first_name,' ',IFNULL(last_name,''))) AS name, profile_photo_url FROM student_personal_details WHERE student_id = ?`;
    } else if (userType === 'alumni') {
        query = `SELECT COALESCE(spd.full_name, CONCAT(spd.first_name,' ',IFNULL(spd.last_name,''))) AS name, spd.profile_photo_url FROM alumni a JOIN student_personal_details spd ON spd.student_id = a.student_id WHERE a.alumni_id = ?`;
    } else {
        query = `SELECT COALESCE(full_name, CONCAT(first_name,' ',IFNULL(last_name,''))) AS name, profile_photo_url FROM admin_personal_details WHERE admin_id = ?`;
    }
    const [rows] = await db.query(query, [userId]);
    return rows[0] || { name: 'Unknown User', profile_photo_url: null };
}

// POST /api/communities - Create a community
exports.createCommunity = async (req, res) => {
    const { name, description, owner_type, owner_id } = req.body;
    console.log('Creating community:', { name, owner_type, owner_id });
    
    if (!name || !owner_type || !owner_id) {
        return res.status(400).json({ success: false, message: 'Name, owner_type, and owner_id are required' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO communities (name, description, owner_type, owner_id) VALUES (?, ?, ?, ?)',
            [String(name), String(description || ''), String(owner_type), Number(owner_id)]
        );
        const communityId = result.insertId;
        console.log('Community created with ID:', communityId);

        // Auto-add owner as accepted member
        await db.query(
            'INSERT INTO community_members (community_id, user_type, user_id, status) VALUES (?, ?, ?, ?)',
            [communityId, String(owner_type), Number(owner_id), 'accepted']
        );

        res.status(201).json({ success: true, community_id: communityId });
    } catch (err) {
        console.error('createCommunity error:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Failed to create community', error: err.message });
    }
};

// GET /api/communities - List all communities with join status for requester
exports.getCommunities = async (req, res) => {
    let { viewer_type, viewer_id } = req.query;
    viewer_id = viewer_id ? Number(viewer_id) : 0;
    viewer_type = viewer_type || '';
    
    try {
        const [communities] = await db.query(`
            SELECT c.*, 
                   (SELECT status FROM community_members WHERE community_id = c.community_id AND user_type = ? AND user_id = ?) as membership_status,
                   (SELECT COUNT(*) FROM community_members WHERE community_id = c.community_id AND status = 'accepted') as member_count
            FROM communities c
            ORDER BY c.created_at DESC
        `, [viewer_type, viewer_id]);

        const enriched = await Promise.all(communities.map(async (c) => {
            const owner = await getUserInfo(c.owner_type, c.owner_id);
            return { ...c, owner_name: owner.name };
        }));

        res.json({ success: true, communities: enriched });
    } catch (err) {
        console.error('getCommunities error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch communities' });
    }
};

// POST /api/communities/:communityId/join - Request to join
exports.joinCommunity = async (req, res) => {
    const { communityId } = req.params;
    const { user_type, user_id } = req.body;
    try {
        await db.query(
            'INSERT INTO community_members (community_id, user_type, user_id, status) VALUES (?, ?, ?, ?)',
            [Number(communityId), String(user_type), Number(user_id), 'pending']
        );

        const [comm] = await db.query('SELECT owner_type, owner_id, name FROM communities WHERE community_id = ?', [communityId]);
        if (comm.length > 0) {
            const requester = await getUserInfo(user_type, user_id);
            await db.query(
                'INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)',
                [comm[0].owner_type, comm[0].owner_id, `${requester.name} requested to join community "${comm[0].name}"`]
            );
        }

        res.json({ success: true, message: 'Join request sent' });
    } catch (err) {
        console.error('joinCommunity error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to request join' });
    }
};

// GET /api/communities/requests - Get all pending requests for communities owned by user
exports.getJoinRequests = async (req, res) => {
    const { user_type, user_id } = req.query;
    try {
        const [requests] = await db.query(`
            SELECT cm.*, c.name as community_name
            FROM community_members cm
            JOIN communities c ON cm.community_id = c.community_id
            WHERE c.owner_type = ? AND c.owner_id = ? AND cm.status = 'pending'
        `, [user_type, Number(user_id)]);

        const enriched = await Promise.all(requests.map(async (r) => {
            const user = await getUserInfo(r.user_type, r.user_id);
            return { ...r, requester_name: user.name, requester_avatar: user.profile_photo_url };
        }));

        res.json({ success: true, requests: enriched });
    } catch (err) {
        console.error('getJoinRequests error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch join requests' });
    }
};

// POST /api/communities/:communityId/requests/handle - Accept or reject a request
exports.handleJoinRequest = async (req, res) => {
    const { communityId } = req.params;
    const { user_type, user_id, action } = req.body;
    const status = action === 'accept' ? 'accepted' : 'rejected';
    try {
        await db.query(
            'UPDATE community_members SET status = ? WHERE community_id = ? AND user_type = ? AND user_id = ?',
            [status, Number(communityId), String(user_type), Number(user_id)]
        );

        const [comm] = await db.query('SELECT name FROM communities WHERE community_id = ?', [communityId]);
        await db.query(
            'INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)',
            [user_type, Number(user_id), `Your request to join "${comm[0].name}" was ${status}`]
        );

        res.json({ success: true, message: `Request ${status}ed` });
    } catch (err) {
        console.error('handleJoinRequest error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to handle request' });
    }
};

// GET /api/communities/:communityId/messages - Get chat messages
exports.getMessages = async (req, res) => {
    const { communityId } = req.params;
    const { viewer_type, viewer_id } = req.query;
    try {
        const [m] = await db.query(
            'SELECT status FROM community_members WHERE community_id = ? AND user_type = ? AND user_id = ?',
            [Number(communityId), String(viewer_type), Number(viewer_id)]
        );
        if (m.length === 0 || m[0].status !== 'accepted') {
            return res.status(403).json({ success: false, message: 'You must be a member to see messages' });
        }

        const [messages] = await db.query(
            'SELECT * FROM community_messages WHERE community_id = ? ORDER BY created_at ASC',
            [Number(communityId)]
        );

        const enriched = await Promise.all(messages.map(async (msg) => {
            const sender = await getUserInfo(msg.sender_type, msg.sender_id);
            return { ...msg, sender_name: sender.name, sender_avatar: sender.profile_photo_url };
        }));

        res.json({ success: true, messages: enriched });
    } catch (err) {
        console.error('getMessages error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

// POST /api/communities/:communityId/messages - Send a chat message
exports.sendMessage = async (req, res) => {
    const { communityId } = req.params;
    const { sender_type, sender_id, content } = req.body;
    try {
        const [m] = await db.query(
            'SELECT status FROM community_members WHERE community_id = ? AND user_type = ? AND user_id = ?',
            [Number(communityId), String(sender_type), Number(sender_id)]
        );
        if (m.length === 0 || m[0].status !== 'accepted') {
            return res.status(403).json({ success: false, message: 'You must be a member to send messages' });
        }

        await db.query(
            'INSERT INTO community_messages (community_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)',
            [Number(communityId), String(sender_type), Number(sender_id), String(content)]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('sendMessage error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};
