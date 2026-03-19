const db = require("../database");
const bcrypt = require("bcryptjs");

// Friendly MySQL error messages
function friendlyError(err) {
    if (err.code === "ER_DUP_ENTRY") {
        const field = (err.sqlMessage || "").match(/for key '(.+?)'/)?.[1] || "";
        if (field.includes("roll_number")) return "That roll number is already registered.";
        if (field.includes("username"))    return "That username is already taken. Please choose another.";
        if (field.includes("email"))       return "That email address is already in use.";
        if (field.includes("aadhaar"))     return "That Aadhaar number is already registered.";
        if (field.includes("pan"))         return "That PAN number is already registered.";
        return "A duplicate entry was detected. Please check your inputs.";
    }
    return err.message || "An unexpected error occurred. Please try again.";
}

// POST /api/students/register-full
exports.registerFull = async (req, res) => {
    const { step1, step2, step3, step4, step5, step6, step7 } = req.body;

    if (!step1?.roll_number) return res.status(400).json({ message: "Roll number is required." });
    if (!step7?.username)    return res.status(400).json({ message: "Username is required." });
    if (!step7?.password)    return res.status(400).json({ message: "Password is required." });

    const passwordHash = bcrypt.hashSync(step7.password, 10);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // STEP 1: students table
        const [studentResult] = await connection.query(
            "INSERT INTO students (roll_number) VALUES (?)",
            [step1.roll_number]
        );
        const studentId = studentResult.insertId;

        // STEP 2: personal details
        await connection.query(
            `INSERT INTO student_personal_details
             (student_id, first_name, last_name, full_name, date_of_birth, gender,
              blood_group, nationality, religion, caste_category, aadhaar_number,
              pan_number, passport_number, profile_photo_url)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [studentId, step2?.first_name, step2?.last_name, step2?.full_name,
             step2?.date_of_birth, step2?.gender, step2?.blood_group,
             step2?.nationality, step2?.religion, step2?.caste_category,
             step2?.aadhaar_number, step2?.pan_number, step2?.passport_number,
             step2?.profile_photo_url]
        );

        // STEP 3: contact details
        await connection.query(
            `INSERT INTO student_contact_details
             (student_id, email, phone_number, alternate_phone_number)
             VALUES (?,?,?,?)`,
            [studentId, step3?.email, step3?.phone_number, step3?.alternate_phone_number]
        );

        // STEP 4: address
        await connection.query(
            `INSERT INTO student_address_details
             (student_id, address_line1, address_line2, city, state, pincode, country)
             VALUES (?,?,?,?,?,?,?)`,
            [studentId, step4?.address_line1, step4?.address_line2,
             step4?.city, step4?.state, step4?.pincode, step4?.country]
        );

        // STEP 5: guardian
        await connection.query(
            `INSERT INTO student_guardian_details
             (student_id, father_name, father_phone, father_occupation,
              mother_name, mother_phone, mother_occupation,
              guardian_name, guardian_phone, guardian_relation)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [studentId, step5?.father_name, step5?.father_phone,
             step5?.father_occupation, step5?.mother_name,
             step5?.mother_phone, step5?.mother_occupation,
             step5?.guardian_name, step5?.guardian_phone,
             step5?.guardian_relation]
        );

        // STEP 6: academic
        await connection.query(
            `INSERT INTO student_academic_details
             (student_id, batch_year, admission_date,
              expected_graduation_date, current_year,
              current_semester, section, academic_status)
             VALUES (?,?,?,?,?,?,?,?)`,
            [studentId, step6?.batch_year, step6?.admission_date,
             step6?.expected_graduation_date, step6?.current_year,
             step6?.current_semester, step6?.section,
             step6?.academic_status]
        );

        // STEP 7: login
        await connection.query(
            `INSERT INTO student_login_accounts
             (student_id, username, password_hash, account_status)
             VALUES (?,?,?,?)`,
            [studentId, step7.username, passwordHash, "ACTIVE"]
        );

        await connection.commit();
        connection.release();

        res.json({ message: "Registration successful!", student_id: studentId });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error("Registration transaction error:", err);
        res.status(500).json({ message: friendlyError(err) });
    }
};

// POST /api/students/login
exports.loginStudent = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: "Username and password are required." });

    try {
        const [rows] = await db.query(
            `SELECT sla.student_id, sla.password_hash, sla.account_status,
                    spd.first_name, spd.full_name, spd.profile_photo_url
             FROM student_login_accounts sla
             LEFT JOIN student_personal_details spd ON spd.student_id = sla.student_id
             WHERE sla.username = ?`,
            [username]
        );

        if (!rows.length) return res.status(401).json({ message: "Invalid username or password." });

        const user = rows[0];
        if (user.account_status !== "ACTIVE")
            return res.status(403).json({ message: "Your account is inactive. Contact admin." });

        const match = bcrypt.compareSync(password, user.password_hash);
        if (!match) return res.status(401).json({ message: "Invalid username or password." });

        res.json({
            message: "Login successful",
            student_id: user.student_id,
            name: user.full_name || user.first_name || username,
            avatar: user.profile_photo_url,
            type: "student",
            username: username
        });
    } catch (err) {
        console.error("loginStudent error:", err);
        res.status(500).json({ message: "Database error." });
    }
};

// POST /api/students/login-by-email
exports.loginByEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    try {
        const [rows] = await db.query(
            `SELECT sla.student_id, sla.account_status,
                    spd.first_name, spd.full_name, spd.profile_photo_url
             FROM student_contact_details scd
             JOIN student_login_accounts sla ON sla.student_id = scd.student_id
             LEFT JOIN student_personal_details spd ON spd.student_id = scd.student_id
             WHERE scd.email = ?`,
            [email]
        );

        if (!rows.length)
            return res.status(404).json({ message: "No account found with this email." });

        const user = rows[0];
        if (user.account_status !== "ACTIVE")
            return res.status(403).json({ message: "Your account is inactive. Contact admin." });

        res.json({
            message: "Email verified",
            student_id: user.student_id,
            name: user.full_name || user.first_name || "Student",
            avatar: user.profile_photo_url,
            type: "student"
        });
    } catch (err) {
        console.error("loginByEmail error:", err);
        res.status(500).json({ message: "Database error." });
    }
};

// Keep old registerStep for backward compatibility (if needed)
exports.registerStep = (req, res) => {
    res.status(410).json({ message: "Step-by-step registration is deprecated. Use register-full." });
};

// NEW: Check if roll number exists
exports.checkRollNumber = async (req, res) => {
    const { rollNumber } = req.params;
    try {
        const [rows] = await db.query("SELECT student_id FROM students WHERE roll_number = ?", [rollNumber]);
        res.json({ exists: rows.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
};