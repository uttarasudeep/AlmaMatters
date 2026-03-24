const express = require('express');
const router = express.Router();
const mc = require('../controllers/messageController');

// ── More-specific routes FIRST (before wildcard param routes) ──

// Get messages within a conversation
// Must be before /conversations/:userType/:userId to avoid param collision
router.get('/conversations/:conversationId/messages', mc.getMessages);

// Send a message in a conversation
router.post('/conversations/:conversationId/send', mc.sendMessage);

// Mark conversation as read for the current user
router.patch('/conversations/:conversationId/read', mc.markConversationRead);

// ── Less-specific (wildcard) routes AFTER ──

// List all conversations for a user
router.get('/conversations/:userType/:userId', mc.getConversations);

// Get or create a conversation between two users
router.post('/conversations', mc.getOrCreateConversation);

module.exports = router;
