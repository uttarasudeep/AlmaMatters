const db = require('../database');

// Helper: resolve a poster's display name from the DB
async function getPosterName(posterType, posterId) {
  let query, params;
  if (posterType === 'student') {
    query = `SELECT COALESCE(full_name, CONCAT(first_name,' ',IFNULL(last_name,''))) AS name,
                    profile_photo_url
             FROM student_personal_details WHERE student_id = ?`;
    params = [posterId];
  } else if (posterType === 'alumni') {
    query = `SELECT COALESCE(spd.full_name, CONCAT(spd.first_name,' ',IFNULL(spd.last_name,''))) AS name,
                    spd.profile_photo_url
             FROM alumni a
             JOIN student_personal_details spd ON spd.student_id = a.student_id
             WHERE a.alumni_id = ?`;
    params = [posterId];
  } else {
    query = `SELECT COALESCE(full_name, CONCAT(first_name,' ',IFNULL(last_name,''))) AS name,
                    profile_photo_url
             FROM admin_personal_details WHERE admin_id = ?`;
    params = [posterId];
  }
  const [rows] = await db.execute(query, params);
  return rows[0] || { name: 'Unknown User', profile_photo_url: null };
}

// GET /api/posts/feed
exports.getFeed = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page  || 1), 1);
    const limit = Math.min(parseInt(req.query.limit || 20), 50);
    const offset = (page - 1) * limit;

    const [posts] = await db.execute(
      `SELECT post_id, poster_type, poster_id, content, media_url,
              like_count, comment_count, share_count, created_at
       FROM posts
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const enriched = await Promise.all(
      posts.map(async (post) => {
        const poster = await getPosterName(post.poster_type, post.poster_id);
        return { ...post, poster_name: poster.name, poster_avatar: poster.profile_photo_url };
      })
    );

    res.json({ success: true, posts: enriched, page, limit });
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch feed' });
  }
};

// POST /api/posts
exports.createPost = async (req, res) => {
  try {
    const { poster_type, poster_id, content, media_url } = req.body;
    if (!poster_type || !poster_id || !content) {
      return res.status(400).json({ success: false, message: 'poster_type, poster_id, and content are required' });
    }
    const [result] = await db.execute(
      'INSERT INTO posts (poster_type, poster_id, content, media_url) VALUES (?, ?, ?, ?)',
      [poster_type, poster_id, content, media_url || null]
    );
    res.status(201).json({ success: true, post_id: result.insertId });
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// DELETE /api/posts/:postId
exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    await db.execute('DELETE FROM posts WHERE post_id = ?', [postId]);
    res.json({ success: true });
  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

// POST /api/posts/:postId/like
exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { liker_type, liker_id } = req.body;
    if (!liker_type || !liker_id) {
      return res.status(400).json({ success: false, message: 'liker_type and liker_id required' });
    }
    await db.execute(
      'INSERT IGNORE INTO post_likes (post_id, liker_type, liker_id) VALUES (?, ?, ?)',
      [postId, liker_type, liker_id]
    );
    const [[{ like_count }]] = await db.execute('SELECT like_count FROM posts WHERE post_id = ?', [postId]);
    res.json({ success: true, like_count });
  } catch (err) {
    console.error('likePost error:', err);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
};

// DELETE /api/posts/:postId/like
exports.unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { liker_type, liker_id } = req.body;
    await db.execute(
      'DELETE FROM post_likes WHERE post_id = ? AND liker_type = ? AND liker_id = ?',
      [postId, liker_type, liker_id]
    );
    const [[{ like_count }]] = await db.execute('SELECT like_count FROM posts WHERE post_id = ?', [postId]);
    res.json({ success: true, like_count });
  } catch (err) {
    console.error('unlikePost error:', err);
    res.status(500).json({ success: false, message: 'Failed to unlike post' });
  }
};

// GET /api/posts/:postId/comments
exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const [comments] = await db.execute(
      `SELECT comment_id, parent_comment_id, commenter_type, commenter_id, content, created_at
       FROM post_comments
       WHERE post_id = ?
       ORDER BY created_at ASC`,
      [postId]
    );

    const enriched = await Promise.all(
      comments.map(async (c) => {
        const commenter = await getPosterName(c.commenter_type, c.commenter_id);
        return { ...c, commenter_name: commenter.name, commenter_avatar: commenter.profile_photo_url };
      })
    );

    // Nest replies
    const topLevel = [];
    const map = {};
    enriched.forEach((c) => { map[c.comment_id] = { ...c, replies: [] }; });
    enriched.forEach((c) => {
      if (c.parent_comment_id) {
        if (map[c.parent_comment_id]) map[c.parent_comment_id].replies.push(map[c.comment_id]);
      } else {
        topLevel.push(map[c.comment_id]);
      }
    });

    res.json({ success: true, comments: topLevel });
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

// POST /api/posts/:postId/comments
exports.addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { commenter_type, commenter_id, content, parent_comment_id } = req.body;
    if (!commenter_type || !commenter_id || !content) {
      return res.status(400).json({ success: false, message: 'commenter_type, commenter_id, and content required' });
    }
    const [result] = await db.execute(
      `INSERT INTO post_comments (post_id, parent_comment_id, commenter_type, commenter_id, content)
       VALUES (?, ?, ?, ?, ?)`,
      [postId, parent_comment_id || null, commenter_type, commenter_id, content]
    );
    res.status(201).json({ success: true, comment_id: result.insertId });
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

// DELETE /api/posts/:postId/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    await db.execute('DELETE FROM post_comments WHERE comment_id = ?', [commentId]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};

// POST /api/posts/:postId/share
exports.sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { sharer_type, sharer_id } = req.body;
    if (!sharer_type || !sharer_id) {
      return res.status(400).json({ success: false, message: 'sharer_type and sharer_id required' });
    }
    await db.execute(
      'INSERT INTO post_shares (post_id, sharer_type, sharer_id) VALUES (?, ?, ?)',
      [postId, sharer_type, sharer_id]
    );
    const [[{ share_count }]] = await db.execute('SELECT share_count FROM posts WHERE post_id = ?', [postId]);
    res.json({ success: true, share_count });
  } catch (err) {
    console.error('sharePost error:', err);
    res.status(500).json({ success: false, message: 'Failed to share post' });
  }
};