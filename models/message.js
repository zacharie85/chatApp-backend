// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom', // Reference to the ChatRoom model
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Add more message fields as needed
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
