const db = require('../database');

// Helper: resolve display name for a user
async function getUserDisplayName(type, id) {
  if (type === 'student') {
    const [rows] = await db.query(
      `SELECT COALESCE(full_name, CONCAT(first_name,' ',IFNULL(last_name,''))) AS name,
              profile_photo_url
       FROM student_personal_details WHERE student_id = ?`,
      [id]
    );
    return { name: rows[0]?.name || `Student #${id}`, photo: rows[0]?.profile_photo_url || null };
  }
  if (type === 'alumni') {
    const [rows] = await db.query(
      `SELECT COALESCE(spd.full_name, CONCAT(spd.first_name,' ',IFNULL(spd.last_name,''))) AS name,
              spd.profile_photo_url
       FROM alumni a
       JOIN student_personal_details spd ON spd.student_id = a.student_id
       WHERE a.alumni_id = ?`,
      [id]
    );
    return { name: rows[0]?.name || `Alumni #${id}`, photo: rows[0]?.profile_photo_url || null };
  }
  return { name: `User #${id}`, photo: null };
}

// Normalize conversation pair so user1 always has smaller composite key
function normalizePair(t1, id1, t2, id2) {
  const key1 = `${t1}:${id1}`;
  const key2 = `${t2}:${id2}`;
  if (key1 <= key2) {
    return { u1t: t1, u1id: Number(id1), u2t: t2, u2id: Number(id2) };
  }
  return { u1t: t2, u1id: Number(id2), u2t: t1, u2id: Number(id1) };
}

// GET /api/messages/conversations/:userType/:userId
exports.getConversations = async (req, res) => {
  try {
    const { userType } = req.params;
    const uid = parseInt(req.params.userId);

    if (!userType || isNaN(uid)) {
      return res.status(400).json({ message: 'Invalid userType or userId.' });
    }

    // Note: use uid directly in the WHERE clause via parameterized ?
    // The subqueries also need the uid as a clean integer
    const [rows] = await db.query(
      `SELECT 
         c.conversation_id,
         c.user1_type, c.user1_id, c.user2_type, c.user2_id,
         c.last_message_at, c.created_at,
         (SELECT COUNT(*) FROM messages m 
          WHERE m.conversation_id = c.conversation_id
            AND m.is_read = FALSE 
            AND NOT (m.sender_type = ? AND m.sender_id = ?)) AS unread_count,
         (SELECT m2.content FROM messages m2 
          WHERE m2.conversation_id = c.conversation_id
          ORDER BY m2.created_at DESC LIMIT 1) AS last_message,
         (SELECT m3.created_at FROM messages m3 
          WHERE m3.conversation_id = c.conversation_id
          ORDER BY m3.created_at DESC LIMIT 1) AS last_message_time
       FROM message_conversations c
       WHERE (c.user1_type = ? AND c.user1_id = ?)
          OR (c.user2_type = ? AND c.user2_id = ?)
       ORDER BY c.last_message_at DESC`,
      [userType, uid, userType, uid, userType, uid]
    );

    // Enrich with the other party's name
    const enriched = await Promise.all(
      rows.map(async (conv) => {
        const isUser1 = conv.user1_type === userType && Number(conv.user1_id) === uid;
        const otherType = isUser1 ? conv.user2_type : conv.user1_type;
        const otherId   = isUser1 ? Number(conv.user2_id) : Number(conv.user1_id);
        const { name, photo } = await getUserDisplayName(otherType, otherId);
        return {
          ...conv,
          other_type:  otherType,
          other_id:    otherId,
          other_name:  name,
          other_photo: photo,
        };
      })
    );

    res.json({ conversations: enriched });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// POST /api/messages/conversations
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { user1_type, user2_type } = req.body;
    const user1_id = parseInt(req.body.user1_id);
    const user2_id = parseInt(req.body.user2_id);

    if (!user1_type || !user2_type || isNaN(user1_id) || isNaN(user2_id)) {
      return res.status(400).json({ message: 'All user fields are required and must be valid.' });
    }
    if (user1_type === user2_type && user1_id === user2_id) {
      return res.status(400).json({ message: 'Cannot message yourself.' });
    }

    const { u1t, u1id, u2t, u2id } = normalizePair(user1_type, user1_id, user2_type, user2_id);

    const [existing] = await db.query(
      `SELECT * FROM message_conversations
       WHERE user1_type = ? AND user1_id = ? AND user2_type = ? AND user2_id = ?`,
      [u1t, u1id, u2t, u2id]
    );

    if (existing.length > 0) {
      return res.json({ conversation: existing[0], created: false });
    }

    const [result] = await db.query(
      `INSERT INTO message_conversations (user1_type, user1_id, user2_type, user2_id) VALUES (?, ?, ?, ?)`,
      [u1t, u1id, u2t, u2id]
    );
    const [newConv] = await db.query(
      `SELECT * FROM message_conversations WHERE conversation_id = ?`,
      [result.insertId]
    );
    res.status(201).json({ conversation: newConv[0], created: true });
  } catch (err) {
    console.error('getOrCreateConversation error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// GET /api/messages/conversations/:conversationId/messages?page=1
exports.getMessages = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }

    // Embed LIMIT/OFFSET directly — MySQL2 mishandles numeric ? placeholders
    // as column names in some configurations ("Unknown column 'NaN'")
    const limit  = 100;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;

    const [messages] = await db.query(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC
       LIMIT ${limit} OFFSET ${offset}`,
      [conversationId]
    );

    res.json({ messages });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// POST /api/messages/conversations/:conversationId/send
exports.sendMessage = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }

    const { sender_type, content } = req.body;
    const sender_id = parseInt(req.body.sender_id);

    if (!sender_type || isNaN(sender_id) || !content?.trim()) {
      return res.status(400).json({ message: 'sender_type, sender_id, and content are required.' });
    }

    // Verify conversation exists
    const [convRows] = await db.query(
      `SELECT conversation_id FROM message_conversations WHERE conversation_id = ?`,
      [conversationId]
    );
    if (convRows.length === 0) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, sender_type, sender_id, content) VALUES (?, ?, ?, ?)`,
      [conversationId, sender_type, sender_id, content.trim()]
    );

    await db.query(
      `UPDATE message_conversations SET last_message_at = NOW() WHERE conversation_id = ?`,
      [conversationId]
    );

    const [newMsg] = await db.query(
      `SELECT * FROM messages WHERE message_id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: newMsg[0] });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// PATCH /api/messages/conversations/:conversationId/read
exports.markConversationRead = async (req, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }

    const { reader_type } = req.body;
    const reader_id = parseInt(req.body.reader_id);

    if (!reader_type || isNaN(reader_id)) {
      return res.status(400).json({ message: 'reader_type and reader_id are required.' });
    }

    await db.query(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = ?
         AND NOT (sender_type = ? AND sender_id = ?)
         AND is_read = FALSE`,
      [conversationId, reader_type, reader_id]
    );

    res.json({ message: 'Marked as read.' });
  } catch (err) {
    console.error('markConversationRead error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};
