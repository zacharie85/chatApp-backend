// chatRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// Create a new chat room
router.post('/create-room', authMiddleware, chatController.createRoom);

// get all rooms
router.get('/get-all-rooms', authMiddleware, chatController.getAllRooms);

router.post('/add-members/:chatId', authMiddleware, chatController.addMembersToRoom);

// Send a message in a chat room
router.post('/send-message', authMiddleware, chatController.sendMessage);

// Get messages for a chat room
router.get('/get-messages/:chatId', authMiddleware, chatController.getMessages);

module.exports = router;
