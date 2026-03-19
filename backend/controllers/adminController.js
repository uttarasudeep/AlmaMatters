const db = require("../database");
const bcrypt = require("bcryptjs");

// Helper for friendly error messages
function friendlyError(err) {
    if (err.code === "ER_DUP_ENTRY") {
        if (err.sqlMessage.includes("employee_id")) return "Employee ID already exists.";
        if (err.sqlMessage.includes("username")) return "Username already taken.";
        return "Duplicate entry. Please check your data.";
    }
    return err.message || "Database error occurred.";
}

exports.registerStep = async (req, res) => {
    const { step, data, adminId } = req.body;

    try {
        /* STEP 1 — ADMINS TABLE */
        if (step === 1) {
            const [result] = await db.query(
                "INSERT INTO admins (employee_id) VALUES (?)",
                [data.employee_id]
            );
            return res.json({ message: "Admin basic info saved", admin_id: result.insertId });
        }

        /* STEP 2 — PERSONAL DETAILS */
        else if (step === 2) {
            await db.query(
                `INSERT INTO admin_personal_details
                 (admin_id, first_name, last_name, full_name, date_of_birth, gender, profile_photo_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [adminId, data.first_name, data.last_name, data.full_name,
                 data.date_of_birth, data.gender, data.profile_photo_url]
            );
            return res.json({ message: "Personal details saved" });
        }

        /* STEP 3 — CONTACT DETAILS */
        else if (step === 3) {
            await db.query(
                `INSERT INTO admin_contact_details
                 (admin_id, email, phone_number, alternate_phone_number)
                 VALUES (?, ?, ?, ?)`,
                [adminId, data.email, data.phone_number, data.alternate_phone_number]
            );
            return res.json({ message: "Contact details saved" });
        }

        /* STEP 4 — ADDRESS DETAILS */
        else if (step === 4) {
            await db.query(
                `INSERT INTO admin_address_details
                 (admin_id, address_line1, address_line2, city, state, pincode, country)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [adminId, data.address_line1, data.address_line2, data.city,
                 data.state, data.pincode, data.country]
            );
            return res.json({ message: "Address saved" });
        }

        /* STEP 5 — LOGIN DETAILS */
        else if (step === 5) {
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(data.password, salt);

            await db.query(
                `INSERT INTO admin_login_accounts
                 (admin_id, username, password_hash, account_status)
                 VALUES (?, ?, ?, ?)`,
                [adminId, data.username, hashedPassword, "ACTIVE"]
            );
            return res.json({ message: "Signup completed successfully" });
        }
        else {
            return res.status(400).json({ message: "Invalid step" });
        }
    } catch (err) {
        console.error("Admin registration error:", err);
        res.status(500).json({ message: friendlyError(err) });
    }
};