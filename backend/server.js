const express = require('express');
const cors = require('cors');

const app = express();


// IMPORT ROUTES

const studentRoutes = require('./routes/studentRoutes');
const alumniRoutes = require('./routes/alumniRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postRoutes  = require('./routes/postRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const authRoutes = require('./routes/authRoutes');

const userRoutes = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const uploadRoutes = require('./routes/uploadRoutes');


// MIDDLEWARE

app.use(cors());

app.use(express.json());

// Serve static files from the uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ROUTES

app.use("/api/students", studentRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/network", followRoutes);
app.use("/api/jobs", require('./routes/jobRoutes'));
app.use("/api/upload", uploadRoutes);
app.use("/api/messages", require('./routes/messageRoutes'));
app.use("/api/communities", require('./routes/communityRoutes'));



// TEST ROUTE

app.get("/", (req,res)=>{

res.send("AlmaMatters API Running");

});



// PORT

const PORT = process.env.PORT || 3000;


app.listen(PORT, () =>

console.log(`Server running on port ${PORT}`)

);