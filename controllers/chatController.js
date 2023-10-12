// controllers/chatController.js
const Message = require('../models/message');
const ChatRoom = require('../models/chatRoom');
const User = require('../models/user');

exports.getCurrentUser = async (req, res) => {
  try {
    // Get the current user's ID from the request
    const userId = req.userId;

    // Query the database to retrieve the username and _id of the current user
    const currentUser = await User.findById(userId, 'username _id');

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(currentUser);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.listAllUsers = async (req, res) => {
  try {
    // Fetch all users in the database
    const users = await User.find({}, 'username _id');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const userId = req.userId;

    // Fetch all chat rooms for the user
    const chatRooms = await ChatRoom.find({ members: userId }).populate('members', 'username');

    // Create an array to hold the chat rooms with lastMessage and messageTime
    const roomsWithLastMessage = [];

    for (const room of chatRooms) {
      // Find the last message in the chat room
      const lastMessage = await Message.findOne({ chatId: room._id }).sort({ createdAt: -1 }).exec();

      roomsWithLastMessage.push({
        chatRoom: room,
        lastMessage: lastMessage ? lastMessage.text : null,
        messageTime: lastMessage ? lastMessage.createdAt : null,
      });
    }

    res.status(200).json(roomsWithLastMessage);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
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
      const user = await User.findById({ _id: member });
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
      const user = await User.findOne({ _id: member });
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
    const { chatId, text, receiverId } = req.body; // Add receiverId to the request body
    const sender = req.userId;

    // Check if the chat room with the given chatId exists
    let chatRoom = await ChatRoom.findById(chatId);

    if (!chatRoom) {
      // Get the receiver's name based on their user ID
      const receiver = await User.findById(receiverId);

      if (!receiver) {
        return res.status(400).json({ error: 'Receiver not found' });
      }

      // Create a new chat room with the receiver's name
      chatRoom = new ChatRoom({
        name: receiver.username, // Set the chat room name to the receiver's username
        members: [sender, receiverId], // Add sender and receiver as initial members
      });

      await chatRoom.save();
    }

    // Create a new message
    const newMessage = new Message({
      sender,
      chatId: chatRoom._id, // Use the chat room's _id
      text,
    });

    await newMessage.save();
    
    // Emit the message to all members of the chat room
    req.io.to(chatId).emit('send-message', newMessage);

    res.status(201).json({ message: 'Message sent successfully' });
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
