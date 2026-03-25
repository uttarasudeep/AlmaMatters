const db = require('../backend/database');

async function test() {
    try {
        const viewer_type = 'student';
        const viewer_id = 1;
        console.log('Testing getCommunities query...');
        const [communities] = await db.query(`
            SELECT c.*, 
                   (SELECT status FROM community_members WHERE community_id = c.community_id AND user_type = ? AND user_id = ?) as membership_status,
                   (SELECT COUNT(*) FROM community_members WHERE community_id = c.community_id AND status = 'accepted') as member_count
            FROM communities c
            ORDER BY c.created_at DESC
        `, [viewer_type, viewer_id]);
        console.log('Result:', communities);
        process.exit(0);
    } catch (err) {
        console.error('Query Failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

test();
