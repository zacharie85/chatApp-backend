// test/add-members.test.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server'); // Replace with the actual path to your server file
const mongoose = require('mongoose');
const ChatRoom = require('../models/chatRoom'); // Import the ChatRoom model
const User = require('../models/user'); // Import the User model

const { expect } = chai;
chai.use(chaiHttp);

describe('Add Members to Chat Room API Tests', () => {
  let chatRoomId; // Store the chat room ID created during the test
  const validMembers = ['user1', 'user2']; // Existing users

  // Before running the tests, connect to the test database and create a chat room and users
  before(async () => {
    await mongoose.connect('mongodb://localhost/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a chat room
    const chatRoom = new ChatRoom({ name: 'Test Room', members: validMembers });
    await chatRoom.save();
    chatRoomId = chatRoom._id;

    // Create user documents for the valid members
    for (const member of validMembers) {
      const user = new User({ username: member, password: 'password' });
      await user.save();
    }
  });

  // Test adding members to an existing chat room
  it('should add members to an existing chat room', (done) => {
    const newMembers = ['user3', 'user4']; // Existing users to be added

    chai
      .request(server)
      .post(`/api/chat/add-members/${chatRoomId}`)
      .send({ members: newMembers })
      .end(async (err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('message').to.equal('Members added to the chat room successfully');

        // Check if the chat room was updated with the new members
        const updatedChatRoom = await ChatRoom.findById(chatRoomId);
        expect(updatedChatRoom).to.exist;
        expect(updatedChatRoom.members).to.include.members([...validMembers, ...newMembers]);

        done();
      });
  });

  // Add more tests as needed

  // After running the tests, close the database connection and remove test data
  after(async () => {
    await mongoose.connection.close();

    // Clean up: Remove the created chat room and users
    await ChatRoom.findByIdAndDelete(chatRoomId);
    for (const member of validMembers) {
      await User.findOneAndDelete({ username: member });
    }
  });
});
