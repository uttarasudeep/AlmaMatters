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
export const getFeed = (page = 1, limit = 20, viewerType = '', viewerId = '') =>
  API.get(`/posts/feed?page=${page}&limit=${limit}&viewer_type=${encodeURIComponent(viewerType)}&viewer_id=${encodeURIComponent(viewerId)}`).then(res => res.data);

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

export const getAllSessions = () =>
  API.get("/sessions/all").then(res => res.data);

export const getApprovedSessions = () =>
  API.get("/sessions").then(res => res.data);

export const getMySessionRequests = (requesterType, requesterId) =>
  API.get(`/sessions/my?requester_type=${encodeURIComponent(requesterType)}&requester_id=${encodeURIComponent(requesterId)}`).then(res => res.data);

export const updateSessionStatus = (sessionId, status, adminId) =>
  API.put(`/sessions/${sessionId}/status`, { status, admin_id: adminId }).then(res => res.data);

export const applySession = (sessionId, data) =>
  API.post(`/sessions/${sessionId}/apply`, data).then(res => res.data);

export const getSessionApplicants = (sessionId, requesterType, requesterId) =>
  API.get(`/sessions/${sessionId}/applicants?requester_type=${encodeURIComponent(requesterType)}&requester_id=${encodeURIComponent(requesterId)}`).then(res => res.data);

export const getNotifications = (userType, userId) =>
  API.get(`/sessions/notifications/${userType}/${userId}`).then(res => res.data);

export const markNotificationRead = (notificationId) =>
  API.patch(`/sessions/notifications/${notificationId}/read`).then(res => res.data);

export const markAllNotificationsRead = (userType, userId) =>
  API.patch('/sessions/notifications/read-all', { user_type: userType, user_id: userId }).then(res => res.data);

// Check if roll number already exists
export const checkRollNumberExists = (rollNumber) =>
  API.get(`/students/check-roll/${rollNumber}`).then(res => res.data.exists);

// Fetch user profile by username
export const getUserByUsername = (username) =>
  API.get(`/users/${username}`).then(res => res.data);

/*
=====================================
NETWORK & FOLLOW APIs
=====================================
*/
export const searchUsers = (q) =>
  API.get(`/network/search?q=${encodeURIComponent(q)}`).then(res => res.data);

export const followUser = (data) =>
  API.post("/network/follow", data).then(res => res.data);

export const acceptFollow = (data) =>
  API.put("/network/follow/accept", data).then(res => res.data);

export const rejectFollow = (data) =>
  API.put("/network/follow/reject", data).then(res => res.data);

export const unfollowUser = (followerType, followerId, followingType, followingId) =>
  API.delete(`/network/follow?follower_type=${encodeURIComponent(followerType)}&follower_id=${encodeURIComponent(followerId)}&following_type=${encodeURIComponent(followingType)}&following_id=${encodeURIComponent(followingId)}`).then(res => res.data);

export const getFollowStatus = (followerType, followerId, followingType, followingId) =>
  API.get(`/network/follow/status?follower_type=${encodeURIComponent(followerType)}&follower_id=${encodeURIComponent(followerId)}&following_type=${encodeURIComponent(followingType)}&following_id=${encodeURIComponent(followingId)}`).then(res => res.data);

export const getUserProfileInfo = (userType, userId) =>
  API.get(`/network/${userType}/${userId}/profile`).then(res => res.data);

export const getFollowers = (userType, userId) =>
  API.get(`/network/${userType}/${userId}/followers`).then(res => res.data);

export const getFollowing = (userType, userId) =>
  API.get(`/network/${userType}/${userId}/following`).then(res => res.data);

export const getPendingRequests = (userType, userId) =>
  API.get(`/network/${userType}/${userId}/requests`).then(res => res.data);

export const getUserPosts = (userType, userId, page = 1, limit = 20) =>
  API.get(`/posts/user/${userType}/${userId}?page=${page}&limit=${limit}`).then(res => res.data);

export const getUserActivity = (userType, userId, page = 1, limit = 20) =>
  API.get(`/posts/user/${userType}/${userId}/activity?page=${page}&limit=${limit}`).then(res => res.data);

export const getUserAttendedSessions = (userType, userId) =>
  API.get(`/sessions/user/${userType}/${userId}/attended`).then(res => res.data);

/*
=====================================
JOBS APIs
=====================================
*/

export const getActiveJobs = () =>
  API.get('/jobs/active').then(res => res.data);

export const getAlumniJobs = (alumniId) =>
  API.get(`/jobs/alumni/${alumniId}`).then(res => res.data);

export const createJob = (data) =>
  API.post('/jobs', data).then(res => res.data);

export const applyForJob = (jobId, data) =>
  API.post(`/jobs/${jobId}/apply`, data).then(res => res.data);

export const getJobApplications = (jobId) =>
  API.get(`/jobs/${jobId}/applications`).then(res => res.data);

export const updateApplicationStatus = (applicationId, status) =>
  API.put(`/jobs/applications/${applicationId}/status`, { status }).then(res => res.data);


/*
=====================================
MESSAGING APIs
=====================================
*/

export const getConversations = (userType, userId) =>
  API.get(`/messages/conversations/${userType}/${userId}`).then(res => res.data);

export const getOrCreateConversation = (u1Type, u1Id, u2Type, u2Id) =>
  API.post('/messages/conversations', {
    user1_type: u1Type, user1_id: u1Id, user2_type: u2Type, user2_id: u2Id
  }).then(res => res.data);

export const getMessages = (conversationId, page = 1) =>
  API.get(`/messages/conversations/${conversationId}/messages?page=${page}`).then(res => res.data);

export const sendMessage = (conversationId, senderType, senderId, content) =>
  API.post(`/messages/conversations/${conversationId}/send`, {
    sender_type: senderType, sender_id: senderId, content
  }).then(res => res.data);

export const markConversationRead = (conversationId, readerType, readerId) =>
  API.patch(`/messages/conversations/${conversationId}/read`, {
    reader_type: readerType, reader_id: readerId
  }).then(res => res.data);

/*
=====================================
COMMUNITIES APIs
=====================================
*/
export const createCommunity = (data) =>
  API.post("/communities", data).then(res => res.data);

export const getCommunities = (viewerType, viewerId) =>
  API.get(`/communities?viewer_type=${encodeURIComponent(viewerType)}&viewer_id=${encodeURIComponent(viewerId)}`).then(res => res.data);

export const joinCommunity = (communityId, data) =>
  API.post(`/communities/${communityId}/join`, data).then(res => res.data);

export const getCommunityJoinRequests = (userType, userId) =>
  API.get(`/communities/requests?user_type=${encodeURIComponent(userType)}&user_id=${encodeURIComponent(userId)}`).then(res => res.data);

export const handleCommunityJoinRequest = (communityId, data) =>
  API.post(`/communities/${communityId}/requests/handle`, data).then(res => res.data);

export const getCommunityMessages = (communityId, viewerType, viewerId) =>
  API.get(`/communities/${communityId}/messages?viewer_type=${encodeURIComponent(viewerType)}&viewer_id=${encodeURIComponent(viewerId)}`).then(res => res.data);

export const sendCommunityMessage = (communityId, data) =>
  API.post(`/communities/${communityId}/messages`, data).then(res => res.data);

export default API;

