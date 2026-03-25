const db = require('./database');
async function test() {
  try {
    const userType = 'student';
    const userId = '1';
    const limit = 20;
    const offset = 0;

    const query = `
      SELECT DISTINCT p.post_id, p.poster_type, p.poster_id, p.content, p.media_url,
             p.like_count, p.comment_count, p.share_count, p.created_at
      FROM posts p
      LEFT JOIN post_likes pl ON p.post_id = pl.post_id
      LEFT JOIN post_comments pc ON p.post_id = pc.post_id
      WHERE (pl.liker_type = ? AND pl.liker_id = ?) 
         OR (pc.commenter_type = ? AND pc.commenter_id = ?)
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    console.log("Testing with params:", [userType, userId, userType, userId, limit, offset]);
    const [posts] = await db.execute(query, [userType, userId, userType, userId, limit, offset]);
    console.log("Success! Found:", posts.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
test();
