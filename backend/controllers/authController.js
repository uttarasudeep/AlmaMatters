const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID");
const otpStore = {}; // In-memory OTP store (for demo)

// Google Login
exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;
        // Here you would look up/create user in DB
        const jwtToken = jwt.sign({ email, name }, "supersecretkey", { expiresIn: '1h' });
        res.json({ message: "Google login successful", token: jwtToken, user: { email, name, picture } });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ message: "Invalid Google token" });
    }
};

// Send OTP
exports.sendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60000 };
    console.log(`[DEV MODE] OTP for ${email} is ${otp}`);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your AlmaMatters Login OTP',
                text: `Your OTP is ${otp}. It is valid for 5 minutes.`
            });
            return res.json({ message: "OTP sent to email" });
        } catch (error) {
            console.error("Nodemailer error:", error);
            return res.status(500).json({ message: "Error sending OTP email" });
        }
    } else {
        return res.json({ message: "OTP printed to server console (dev mode)" });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: "No OTP requested for this email" });
    if (Date.now() > record.expires) {
        delete otpStore[email];
        return res.status(400).json({ message: "OTP expired" });
    }
    if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    delete otpStore[email];
    const jwtToken = jwt.sign({ email }, "supersecretkey", { expiresIn: '1h' });
    // Optionally fetch user details from DB and return them
    res.json({
        message: "OTP correct, login successful",
        token: jwtToken,
        user: { email }
    });
};

// Unified login (students & alumni)
exports.loginUnified = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required." });

    try {
        // Check students
        const [studentRows] = await db.query(
            `SELECT sla.student_id as id, sla.password_hash, sla.account_status,
                    spd.first_name, spd.full_name, spd.profile_photo_url as avatar, 'student' as type,
                    sad.expected_graduation_date
             FROM student_login_accounts sla
             LEFT JOIN student_personal_details spd ON spd.student_id = sla.student_id
             LEFT JOIN student_academic_details sad ON sad.student_id = sla.student_id
             WHERE sla.username = ?`,
            [username]
        );

        if (studentRows.length > 0) {
            const user = studentRows[0];
            if (user.account_status !== "ACTIVE") return res.status(403).json({ message: "Account inactive." });
            if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ message: "Invalid credentials." });
            
            let requiresTransition = false;
            if (user.expected_graduation_date) {
                // If the graduation date is in the past, they must transition to alumni
                if (new Date(user.expected_graduation_date) < new Date()) {
                    requiresTransition = true;
                }
            }

            return res.json({
                message: "Login successful",
                id: user.id,
                name: user.full_name || user.first_name || username,
                avatar: user.avatar,
                type: "student",
                username: username,
                requires_alumni_transition: requiresTransition
            });
        }

        // Check alumni
        const [alumniRows] = await db.query(
            `SELECT ala.alumni_id as id, ala.password_hash, ala.account_status,
                    st.full_name as name, 'alumni' as type
             FROM alumni_login_accounts ala
             LEFT JOIN alumni a ON a.alumni_id = ala.alumni_id
             LEFT JOIN student_personal_details st ON st.student_id = a.student_id
             WHERE ala.username = ?`,
            [username]
        );

        if (alumniRows.length > 0) {
            const user = alumniRows[0];
            if (user.account_status !== "ACTIVE") return res.status(403).json({ message: "Account inactive." });
            if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ message: "Invalid credentials." });
            return res.json({
                message: "Login successful",
                id: user.id,
                name: user.name || username,
                avatar: null,
                type: "alumni",
                username: username
            });
        }

        return res.status(401).json({ message: "Invalid username or password." });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Database error.", error: err.message, code: err.code });
    }
};

// Admin login
exports.loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required." });

    try {
        const [rows] = await db.query(
            `SELECT ala.admin_id as id, ala.password_hash, ala.account_status,
                    apd.first_name, apd.full_name, apd.profile_photo_url as avatar
             FROM admin_login_accounts ala
             LEFT JOIN admin_personal_details apd ON apd.admin_id = ala.admin_id
             WHERE ala.username = ?`,
            [username]
        );

        if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials." });

        const user = rows[0];
        if (user.account_status !== "ACTIVE") return res.status(403).json({ message: "Account inactive." });
        if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ message: "Invalid credentials." });

        res.json({
            message: "Login successful",
            id: user.id,
            name: user.full_name || user.first_name || username,
            avatar: user.avatar,
            type: "admin",
            username: username
        });
    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({ message: "Database error." });
    }
};

// NEW: Get user by username (for profile page)
exports.getUserByUsername = async (req, res) => {
    const { username } = req.params;
    if (!username) return res.status(400).json({ message: "Username required" });

    try {
        // Check students
        const [studentRows] = await db.query(
            `SELECT sla.student_id as id, 
                    COALESCE(spd.full_name, CONCAT(spd.first_name, ' ', spd.last_name)) as name,
                    spd.profile_photo_url as avatar,
                    'student' as type
             FROM student_login_accounts sla
             LEFT JOIN student_personal_details spd ON sla.student_id = spd.student_id
             WHERE sla.username = ?`,
            [username]
        );
        if (studentRows.length > 0) return res.json({ user: studentRows[0] });

        // Check alumni
        const [alumniRows] = await db.query(
            `SELECT ala.alumni_id as id,
                    COALESCE(spd.full_name, CONCAT(spd.first_name, ' ', spd.last_name)) as name,
                    spd.profile_photo_url as avatar,
                    'alumni' as type
             FROM alumni_login_accounts ala
             JOIN alumni a ON ala.alumni_id = a.alumni_id
             LEFT JOIN student_personal_details spd ON a.student_id = spd.student_id
             WHERE ala.username = ?`,
            [username]
        );
        if (alumniRows.length > 0) return res.json({ user: alumniRows[0] });

        // Check admins
        const [adminRows] = await db.query(
            `SELECT ala.admin_id as id,
                    COALESCE(apd.full_name, CONCAT(apd.first_name, ' ', apd.last_name)) as name,
                    apd.profile_photo_url as avatar,
                    'admin' as type
             FROM admin_login_accounts ala
             LEFT JOIN admin_personal_details apd ON ala.admin_id = apd.admin_id
             WHERE ala.username = ?`,
            [username]
        );
        if (adminRows.length > 0) return res.json({ user: adminRows[0] });

        return res.status(404).json({ message: "User not found" });
    } catch (err) {
        console.error("getUserByUsername error:", err);
        res.status(500).json({ message: "Server error" });
    }
};