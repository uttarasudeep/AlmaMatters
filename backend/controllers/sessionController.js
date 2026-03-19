const db = require('../database');

exports.requestSession = async (req, res) => {
    try {
        const { requester_type, requester_id, title, description, scheduled_at } = req.body;
        const [result] = await db.query(
            `INSERT INTO sessions (requester_type, requester_id, title, description, scheduled_at, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [requester_type, requester_id, title, description, scheduled_at]
        );
        res.status(201).json({ message: "Session requested successfully", session_id: result.insertId });
    } catch (err) {
        console.error("requestSession error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};

exports.getPendingSessions = async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT s.*, 
                COALESCE(st.full_name, al.linkedin_url) as requester_name 
            FROM sessions s
            LEFT JOIN student_personal_details st ON s.requester_type = 'student' AND s.requester_id = st.student_id
            LEFT JOIN alumni al ON s.requester_type = 'alumni' AND s.requester_id = al.alumni_id
            WHERE s.status = 'pending'
            ORDER BY s.created_at DESC
        `);
        res.status(200).json({ sessions: results });
    } catch (err) {
        console.error("getPendingSessions error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};

exports.getApprovedSessions = async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT s.*, 
                COALESCE(st.full_name, al.linkedin_url) as requester_name 
            FROM sessions s
            LEFT JOIN student_personal_details st ON s.requester_type = 'student' AND s.requester_id = st.student_id
            LEFT JOIN alumni al ON s.requester_type = 'alumni' AND s.requester_id = al.alumni_id
            WHERE s.status = 'approved' AND s.scheduled_at >= NOW()
            ORDER BY s.scheduled_at ASC
        `);
        res.status(200).json({ sessions: results });
    } catch (err) {
        console.error("getApprovedSessions error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};

exports.updateSessionStatus = async (req, res) => {
    try {
        const { session_id } = req.params;
        const { status } = req.body;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        const [result] = await db.query(
            `UPDATE sessions SET status = ? WHERE session_id = ?`,
            [status, session_id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "Session not found" });
        res.status(200).json({ message: `Session ${status}` });
    } catch (err) {
        console.error("updateSessionStatus error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};