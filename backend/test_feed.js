const db = require('./database');

async function test() {
  try {
    const viewerType = 'student';
    const viewerIdNum = 1;
    const limit = 20;
    const offset = 0;
    const query = [
      'SELECT p.post_id, p.poster_type, p.poster_id FROM posts p',
      'WHERE (p.poster_type = ? AND p.poster_id = ?)',
      'OR EXISTS (',
      '  SELECT 1 FROM user_followers uf',
      '  WHERE uf.follower_type = ? AND uf.follower_id = ?',
      '    AND uf.following_type = p.poster_type',
      '    AND uf.following_id = p.poster_id',
      "    AND uf.status = 'accepted'",
      ')',
      'ORDER BY p.created_at DESC',
      'LIMIT ? OFFSET ?'
    ].join(' ');
    const params = [viewerType, viewerIdNum, viewerType, viewerIdNum, limit, offset];
    console.log('Params:', JSON.stringify(params));
    const [rows] = await db.execute(query, params);
    console.log('SUCCESS - rows:', rows.length);
  } catch (e) {
    console.log('FULL ERROR MESSAGE:', e.message);
    console.log('ERROR CODE:', e.code);
    console.log('SQL WAS:', e.sql);
  }
  process.exit(0);
}

test();
