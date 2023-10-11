// controllers/chatController.js
const Message = require('../models/message');
const ChatRoom = require('../models/chatRoom');
const User = require('../models/user');

exports.getAllRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find();
    res.status(200).json(chatRooms);
  } catch (error) {
    console.error('Error getting chat rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addMembersToRoom = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { members } = req.body;

    const chatRoom = await ChatRoom.findById(chatId);
    if (!chatRoom) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Check if all members exist in the database
    const invalidMembers = [];
    for (const member of members) {
      const user = await User.findById({ _id:member });
      if (!user) {
        invalidMembers.push(member);
      }
    }

    if (invalidMembers.length > 0) {
      return res.status(400).json({ error: 'Invalid members: ' + invalidMembers.join(', ') });
    }

    // Add the valid members to the chat room
    chatRoom.members = [...new Set([...chatRoom.members, ...members])]; // Avoid duplicates

    await chatRoom.save();
    res.status(200).json({ message: 'Members added to the chat room successfully' });
  } catch (error) {
    console.error('Error adding members to chat room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { name, members } = req.body;

    // Check if all members exist in the database
    const invalidMembers = [];
    for (const member of members) {
      const user = await User.findOne({ _id:member });
      if (!user) {
        invalidMembers.push(member);
      }
    }

    if (invalidMembers.length > 0) {
      return res.status(400).json({ error: 'Invalid members: ' + invalidMembers.join(', ') });
    }

    const newChatRoom = new ChatRoom({
      name,
      members,
    });

    await newChatRoom.save();
    res.status(201).json({ message: 'Chat room created successfully' });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }

};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const sender = req.userId;

    const newMessage = new Message({
      sender,
      chatId,
      text,
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully' });

    const chatRoom = await ChatRoom.findById(chatId);
    if (chatRoom) {
      const members = chatRoom.members;
      members.forEach((member) => {
        req.io.to(member).emit('message', newMessage);
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).sort({ createdAt: 'asc' }).exec();
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
