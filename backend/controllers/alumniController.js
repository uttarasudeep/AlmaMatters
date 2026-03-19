const db = require("../database");
const bcrypt = require("bcryptjs");

// Helper for friendly error messages
function friendlyError(err) {
    if (err.code === "ER_DUP_ENTRY") {
        if (err.sqlMessage.includes("student_id")) return "This student is already registered as alumni.";
        if (err.sqlMessage.includes("username")) return "Username already taken.";
        return "Duplicate entry. Please check your data.";
    }
    return err.message || "Database error occurred.";
}

exports.registerStep = async (req, res) => {
    const { step, data, alumniId } = req.body;

    try {
        /* STEP 1 — ALUMNI TABLE (using roll_number) */
        if (step === 1) {
            // Validate required fields
            if (!data.roll_number?.trim()) {
                return res.status(400).json({ message: "Roll number is required." });
            }
            if (!data.graduation_year) {
                return res.status(400).json({ message: "Graduation year is required." });
            }

            // Look up the student_id from the students table using roll_number
            const [studentRows] = await db.query(
                "SELECT student_id FROM students WHERE roll_number = ?",
                [data.roll_number.trim()]
            );

            if (studentRows.length === 0) {
                return res.status(404).json({ message: "No student found with that roll number." });
            }

            const studentId = studentRows[0].student_id;

            // Insert into alumni table
            const [result] = await db.query(
                "INSERT INTO alumni (student_id, graduation_year) VALUES (?, ?)",
                [studentId, data.graduation_year]
            );

            return res.json({
                message: "Alumni basic info saved",
                alumni_id: result.insertId
            });
        }

        /* STEP 2 — PERSONAL DETAILS */
        else if (step === 2) {
            await db.query(
                `INSERT INTO alumni_personal_details (alumni_id, linkedin_url, current_city)
                 VALUES (?, ?, ?)`,
                [alumniId, data.linkedin_url, data.current_city]
            );
            return res.json({ message: "Personal details saved" });
        }

        /* STEP 3 — PROFESSIONAL DETAILS */
        else if (step === 3) {
            await db.query(
                `INSERT INTO alumni_professional_details
                 (alumni_id, company_name, job_title, industry, years_of_experience)
                 VALUES (?, ?, ?, ?, ?)`,
                [alumniId, data.company_name, data.job_title, data.industry, data.years_of_experience]
            );
            return res.json({ message: "Professional details saved" });
        }

        /* STEP 4 — HIGHER STUDIES DETAILS */
        else if (step === 4) {
            await db.query(
                `INSERT INTO alumni_higher_studies_details
                 (alumni_id, university_name, degree, field_of_study, country, start_year, end_year)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [alumniId, data.university_name, data.degree, data.field_of_study,
                 data.country, data.start_year, data.end_year]
            );
            return res.json({ message: "Higher studies details saved" });
        }

        /* STEP 5 — ACADEMIC DETAILS */
        else if (step === 5) {
            await db.query(
                `INSERT INTO alumni_academic_details
                 (alumni_id, department, program, course, batch_year, graduation_year, cgpa, class_obtained)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [alumniId, data.department, data.program, data.course,
                 data.batch_year, data.graduation_year, data.cgpa, data.class_obtained]
            );
            return res.json({ message: "Academic details saved" });
        }

        /* STEP 6 — ADDRESS DETAILS */
        else if (step === 6) {
            await db.query(
                `INSERT INTO alumni_address_details
                 (alumni_id, address_line1, address_line2, city, state, pincode, country)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [alumniId, data.address_line1, data.address_line2, data.city,
                 data.state, data.pincode, data.country]
            );
            return res.json({ message: "Address saved" });
        }

        /* STEP 7 — LOGIN ACCOUNTS */
        else if (step === 7) {
            // Hash the password before storing
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(data.password, salt);

            await db.query(
                `INSERT INTO alumni_login_accounts
                 (alumni_id, username, password_hash, account_status)
                 VALUES (?, ?, ?, ?)`,
                [alumniId, data.username, hashedPassword, "ACTIVE"]
            );
            return res.json({ message: "Signup completed successfully" });
        }
        else {
            return res.status(400).json({ message: "Invalid step" });
        }
    } catch (err) {
        console.error("Alumni registration error:", err);
        res.status(500).json({ message: friendlyError(err) });
    }
};