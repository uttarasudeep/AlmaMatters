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
    const { step1, step2, step3, step4, step6, step7, areas_of_interest } = req.body;

    const opt = (val) => (val === "" ? null : val);

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
              blood_group, nationality, religion, aadhaar_number,
              passport_number, profile_photo_url)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [studentId, step2?.first_name, step2?.last_name, step2?.full_name,
             opt(step2?.date_of_birth), step2?.gender, step2?.blood_group,
             step2?.nationality, step2?.religion,
             step2?.aadhaar_number, step2?.passport_number,
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

        // STEP 5: guardian removed


        // STEP 6: academic
        await connection.query(
            `INSERT INTO student_academic_details
             (student_id, batch_year, admission_date,
              expected_graduation_date, current_year,
              current_semester, section, academic_status)
             VALUES (?,?,?,?,?,?,?,?)`,
            [studentId, opt(step6?.batch_year), opt(step6?.admission_date),
             opt(step6?.expected_graduation_date), opt(step6?.current_year),
             opt(step6?.current_semester), step6?.section,
             step6?.academic_status]
        );

        // Verify global username uniqueness before insert
        const [existing] = await connection.query(
            `SELECT username FROM student_login_accounts WHERE username = ?
             UNION
             SELECT username FROM alumni_login_accounts WHERE username = ?
             UNION
             SELECT username FROM admin_login_accounts WHERE username = ?`,
            [step7.username, step7.username, step7.username]
        );
        if (existing.length > 0) {
            throw new Error("That username is already taken. Please choose another.");
        }

        // STEP 7: login
        await connection.query(
            `INSERT INTO student_login_accounts
             (student_id, username, password_hash, account_status)
             VALUES (?,?,?,?)`,
            [studentId, step7.username, passwordHash, "ACTIVE"]
        );

        // EXTRA: areas of interest
        if (areas_of_interest && Array.isArray(areas_of_interest) && areas_of_interest.length > 0) {
            for (const area of areas_of_interest) {
                if (area.trim()) {
                    await connection.query(
                        `INSERT INTO student_areas_of_interest (student_id, area_of_interest) VALUES (?,?)`,
                        [studentId, area.trim()]
                    );
                }
            }
        }

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

// GET /api/students/profile/:id
exports.getStudentProfile = async (req, res) => {
    const studentId = req.params.id;
    try {
        const [studentRows] = await db.query("SELECT * FROM students WHERE student_id = ?", [studentId]);
        if (!studentRows.length) return res.status(404).json({ message: "Student not found" });

        const [personalRows] = await db.query("SELECT * FROM student_personal_details WHERE student_id = ?", [studentId]);
        const [contactRows] = await db.query("SELECT * FROM student_contact_details WHERE student_id = ?", [studentId]);
        const [addressRows] = await db.query("SELECT * FROM student_address_details WHERE student_id = ?", [studentId]);
        const [academicRows] = await db.query("SELECT * FROM student_academic_details WHERE student_id = ?", [studentId]);
        const [interestRows] = await db.query("SELECT * FROM student_areas_of_interest WHERE student_id = ?", [studentId]);

        const data = {
            step1: { roll_number: studentRows[0].roll_number },
            step2: personalRows[0] || {},
            step3: contactRows[0] || {},
            step4: addressRows[0] || {},
            step6: academicRows[0] || {},
            areas_of_interest: interestRows.map(row => row.area_of_interest)
        };

        if (data.step2.date_of_birth) {
            data.step2.date_of_birth = new Date(data.step2.date_of_birth).toISOString().split('T')[0];
        }
        if (data.step6.admission_date) {
            data.step6.admission_date = new Date(data.step6.admission_date).toISOString().split('T')[0];
        }
        if (data.step6.expected_graduation_date) {
            data.step6.expected_graduation_date = new Date(data.step6.expected_graduation_date).toISOString().split('T')[0];
        }

        res.json(data);
    } catch (err) {
        console.error("getStudentProfile error:", err);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
};

// PUT /api/students/profile/:id
exports.updateStudentProfile = async (req, res) => {
    const studentId = req.params.id;
    const { step2, step3, step4, step6, areas_of_interest } = req.body;

    const opt = (val) => (val === "" ? null : val);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            `UPDATE student_personal_details 
             SET first_name=?, last_name=?, full_name=?, date_of_birth=?, gender=?, 
                 blood_group=?, nationality=?, religion=?, aadhaar_number=?, 
                 passport_number=?, profile_photo_url=? 
             WHERE student_id=?`,
            [step2?.first_name, step2?.last_name, step2?.full_name, opt(step2?.date_of_birth), step2?.gender,
             step2?.blood_group, step2?.nationality, step2?.religion, step2?.aadhaar_number,
             step2?.passport_number, step2?.profile_photo_url, studentId]
        );

        await connection.query(
            `UPDATE student_contact_details 
             SET email=?, phone_number=?, alternate_phone_number=? 
             WHERE student_id=?`,
            [step3?.email, step3?.phone_number, step3?.alternate_phone_number, studentId]
        );

        await connection.query(
            `UPDATE student_address_details 
             SET address_line1=?, address_line2=?, city=?, state=?, pincode=?, country=? 
             WHERE student_id=?`,
            [step4?.address_line1, step4?.address_line2, step4?.city, step4?.state, step4?.pincode, step4?.country, studentId]
        );

        await connection.query(
            `UPDATE student_academic_details 
             SET batch_year=?, admission_date=?, expected_graduation_date=?, current_year=?, 
                 current_semester=?, section=?, academic_status=? 
             WHERE student_id=?`,
            [opt(step6?.batch_year), opt(step6?.admission_date), opt(step6?.expected_graduation_date), opt(step6?.current_year),
             opt(step6?.current_semester), step6?.section, step6?.academic_status, studentId]
        );

        await connection.query(`DELETE FROM student_areas_of_interest WHERE student_id=?`, [studentId]);
        if (areas_of_interest && Array.isArray(areas_of_interest) && areas_of_interest.length > 0) {
            for (const area of areas_of_interest) {
                if (area.trim()) {
                    await connection.query(
                        `INSERT INTO student_areas_of_interest (student_id, area_of_interest) VALUES (?,?)`,
                        [studentId, area.trim()]
                    );
                }
            }
        }

        await connection.commit();
        connection.release();
        res.json({ message: "Profile updated successfully!" });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error("updateStudentProfile error:", err);
        res.status(500).json({ message: "Failed to update profile" });
    }
};