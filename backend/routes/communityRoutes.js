const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

router.post('/', communityController.createCommunity);
router.get('/', communityController.getCommunities);
router.get('/requests', communityController.getJoinRequests);
router.post('/:communityId/join', communityController.joinCommunity);
router.post('/:communityId/requests/handle', communityController.handleJoinRequest);
router.get('/:communityId/messages', communityController.getMessages);
router.post('/:communityId/messages', communityController.sendMessage);

module.exports = router;
