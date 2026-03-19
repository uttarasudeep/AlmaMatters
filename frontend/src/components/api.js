import axios from "axios";


const API = axios.create({

  baseURL: "http://localhost:3000/api",

  headers: {

    "Content-Type": "application/json",

  },

});



/*
=====================================
MULTI STEP STUDENT SIGNUP
=====================================
*/

export const registerStep = (step, data, studentId) => {
  return API.post("/students/register-step", { step, data, studentId }).then(res => res.data);
};

export const registerAlumniStep = (step, data, alumniId) => {
  return API.post("/alumni/register-step", { step, data, alumniId }).then(res => res.data);
};

export const registerAdminStep = (step, data, adminId) => {
  return API.post("/admin/register-step", { step, data, adminId }).then(res => res.data);
};

/**
 * Atomic student registration — sends all 7 steps at once.
 * Nothing is written to DB unless all steps succeed.
 */
export const registerFull = (allStepData) =>
  API.post("/students/register-full", allStepData).then(res => res.data);



/*
=====================================
STUDENT LOGIN APIs
=====================================
*/

/** Unified Login with username + password */
export const loginUnified = (username, password) =>
  API.post("/auth/login", { username, password }).then(res => res.data);

/** Admin Login */
export const loginAdmin = (username, password) =>
  API.post("/auth/admin-login", { username, password }).then(res => res.data);

/** Verify email belongs to a registered student (step 1 of OTP flow) */
export const verifyStudentEmail = (email) =>
  API.post("/students/login-by-email", { email }).then(res => res.data);

/** Legacy register/login helpers */
export const registerStudent = (data) =>
  API.post("/students/register", data);







export const getStudentProfile = (id) =>

  API.get(`/students/${id}`);



export const updateStudent = (id, data) =>

  API.put(`/students/${id}`, data);



export const loginGoogle = (token) =>
  API.post("/auth/google-login", { token });

export const sendOtp = (email) =>
  API.post("/auth/send-otp", { email });

export const verifyOtp = (email, otp) =>
  API.post("/auth/verify-otp", { email, otp });



/*
=====================================
POSTS & FEED APIs
=====================================
*/

/** Fetch paginated feed */
export const getFeed = (page = 1, limit = 20) =>
  API.get(`/posts/feed?page=${page}&limit=${limit}`).then(res => res.data);

/** Create a new post */
export const createPost = (data) =>
  API.post("/posts", data).then(res => res.data);

/** Delete a post by ID */
export const deletePost = (postId) =>
  API.delete(`/posts/${postId}`).then(res => res.data);

/** Like a post */
export const likePost = (postId, liker_type, liker_id) =>
  API.post(`/posts/${postId}/like`, { liker_type, liker_id }).then(res => res.data);

/** Unlike a post */
export const unlikePost = (postId, liker_type, liker_id) =>
  API.delete(`/posts/${postId}/like`, { data: { liker_type, liker_id } }).then(res => res.data);

/** Get comments for a post (nested) */
export const getComments = (postId) =>
  API.get(`/posts/${postId}/comments`).then(res => res.data);

/** Add a comment to a post */
export const addComment = (postId, data) =>
  API.post(`/posts/${postId}/comments`, data).then(res => res.data);

/** Delete a comment */
export const deleteComment = (postId, commentId) =>
  API.delete(`/posts/${postId}/comments/${commentId}`).then(res => res.data);

/** Share a post */
export const sharePost = (postId, sharer_type, sharer_id) =>
  API.post(`/posts/${postId}/share`, { sharer_type, sharer_id }).then(res => res.data);

/*
=====================================
SESSIONS APIs
=====================================
*/

export const requestSession = (data) =>
  API.post("/sessions/request", data).then(res => res.data);

export const getPendingSessions = () =>
  API.get("/sessions/pending").then(res => res.data);

export const getApprovedSessions = () =>
  API.get("/sessions").then(res => res.data);

export const updateSessionStatus = (sessionId, status) =>
  API.put(`/sessions/${sessionId}/status`, { status }).then(res => res.data);
// Check if roll number already exists
export const checkRollNumberExists = (rollNumber) =>
  API.get(`/students/check-roll/${rollNumber}`).then(res => res.data.exists);

// Fetch user profile by username
export const getUserByUsername = (username) =>
  API.get(`/users/${username}`).then(res => res.data);

export default API;
