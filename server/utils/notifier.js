const { prisma } = require('../config');

let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

async function sendNotification(userId, type, title, message, link = null) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        type,
        title,
        message,
        link
      }
    });
    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit('new_notification', notification);
    }
    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

module.exports = {
  setIo,
  sendNotification
};
