// sockets/chatSocket.js
const User = require('../models/user');
const Message = require('../models/message');
const onlineUsers = {};
module.exports = (io, db) => {
    const chatSocket = io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // Update the user's online status to false in the database
            const user = onlineUsers[socket.id];
            if (user) {
                // Remove the disconnected user from the onlineUsers object
                delete onlineUsers[socket.id];
                // Emit the updated online users list to all connected clients
                io.emit('online-users', Object.values(onlineUsers));
            }

            User.findByIdAndUpdate(socket.userId, { online: false }, { new: true })
                .catch((err) => {
                    console.error('Error updating online status:', err);
                });
        });

        socket.on('join-room', (chatId, userId) => {
            console.log('----- ',socket.id,' joining room ',chatId);
            socket.join(chatId);
            // Update the user's online status to true in the database
            // Add the user to the onlineUsers object with their socket.id as the key
            onlineUsers[socket.id] = { userId, chatId };
            // Emit the updated online users list to all connected clients
            // Add event listener to broadcast messages to the chat room

            io.emit('online-users', Object.values(onlineUsers));

            User.findByIdAndUpdate(userId, { online: true }, { new: true })
                .then((doc) => {
                    socket.userId = userId;
                })
                .catch((err) => {
                    console.error('Error updating online status:', err);
                });

        });

        // Add a listener for user login
        socket.on('user-login', (userId) => {
            // Set the user as online when they log in
            onlineUsers[socket.id] = { userId };
            // Emit the updated online users list to all connected clients
            io.emit('online-users', Object.values(onlineUsers));
        });

        // Add a listener for user logout
        socket.on('user-logout', () => {
            // Remove the user from onlineUsers when they log out
            delete onlineUsers[socket.id];
            // Emit the updated online users list to all connected clients
            io.emit('online-users', Object.values(onlineUsers));
        });
    });

    return chatSocket;
};
