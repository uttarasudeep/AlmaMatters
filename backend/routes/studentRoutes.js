const express = require("express");
const router  = express.Router();
const studentController = require("../controllers/studentController"); // ← this was missing

// Atomic full registration (all 7 steps in one transaction)
router.post("/register-full", studentController.registerFull);

// Login endpoints
router.post("/login",          studentController.loginStudent);
router.post("/login-by-email", studentController.loginByEmail);

// NEW: Check if roll number exists
router.get('/check-roll/:rollNumber', studentController.checkRollNumber);

module.exports = router;