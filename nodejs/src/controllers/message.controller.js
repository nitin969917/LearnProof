const prisma = require('../lib/prisma');
const cacheService = require('../services/cache.service');

/**
 * Admin sends a message (Direct or Broadcast)
 */
const sendMessage = async (req, res) => {
    const { receiverUid, isBroadcast, subject, message } = req.body;
    const admin = req.user;

    if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }

    try {
        let receiverId = null;

        if (!isBroadcast) {
            if (!receiverUid) {
                return res.status(400).json({ error: 'Receiver UID is required for direct messages' });
            }
            const receiver = await prisma.userProfile.findUnique({ where: { uid: receiverUid } });
            if (!receiver) {
                return res.status(404).json({ error: 'Receiver not found' });
            }
            receiverId = receiver.id;
        }

        const newMessage = await prisma.inboxMessage.create({
            data: {
                senderId: admin.id,
                receiverId,
                isBroadcast: !!isBroadcast,
                subject,
                message,
            }
        });

        // Invalidate caches
        if (!isBroadcast) {
            await cacheService.del(`user:inbox:${receiverId}`);
        } else {
            // Pattern delete for all user inboxes or handle logically
            await cacheService.delByPattern('user:inbox:*');
        }

        return res.status(201).json({ message: 'Message sent successfully', data: newMessage });
    } catch (error) {
        console.error('Send message error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * User fetches their inbox (Direct + Broadcast)
 */
const getMessages = async (req, res) => {
    const user = req.user;

    try {
        const cacheKey = `user:inbox:${user.id}`;
        let cached = await cacheService.get(cacheKey);
        if (cached) return res.status(200).json(cached);

        const messages = await prisma.inboxMessage.findMany({
            where: {
                OR: [
                    { receiverId: user.id },
                    { isBroadcast: true }
                ]
            },
            include: {
                sender: {
                    select: { name: true, profile_pic: true }
                },
                receiver: {
                    select: { name: true, email: true }
                },
                readStatuses: {
                    where: { userId: user.id }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Process messages to include 'read' status for broadcasts
        const formattedMessages = messages.map(msg => ({
            ...msg,
            isRead: msg.isBroadcast ? msg.readStatuses.length > 0 : msg.isRead
        }));

        await cacheService.set(cacheKey, formattedMessages, 300); // 5 minutes cache

        return res.status(200).json(formattedMessages);
    } catch (error) {
        console.error('Get messages error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Admin fetches all messages sent by them
 */
const getAdminSentMessages = async (req, res) => {
    const user = req.user;

    try {
        const messages = await prisma.inboxMessage.findMany({
            where: {
                senderId: user.id
            },
            include: {
                receiver: {
                    select: { name: true, email: true, profile_pic: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return res.status(200).json(messages);
    } catch (error) {
        console.error('Get sent messages error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Mark a message as read
 */
const markRead = async (req, res) => {
    const { messageId } = req.body;
    const user = req.user;

    try {
        const message = await prisma.inboxMessage.findUnique({
            where: { id: parseInt(messageId) }
        });

        if (!message) return res.status(404).json({ error: 'Message not found' });

        if (message.isBroadcast) {
            await prisma.messageReadStatus.upsert({
                where: {
                    userId_messageId: {
                        userId: user.id,
                        messageId: message.id
                    }
                },
                update: { read_at: new Date() },
                create: {
                    userId: user.id,
                    messageId: message.id
                }
            });
        } else {
            if (message.receiverId !== user.id) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            await prisma.inboxMessage.update({
                where: { id: message.id },
                data: { isRead: true }
            });
        }

        await cacheService.del(`user:inbox:${user.id}`);

        return res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Admin deletes a message
 */
const deleteMessage = async (req, res) => {
    const { messageId } = req.body;

    try {
        await prisma.inboxMessage.delete({
            where: { id: parseInt(messageId) }
        });
        
        await cacheService.delByPattern('user:inbox:*');

        return res.status(200).json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Delete message error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Fetch all users (For admin to select a receiver)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.userProfile.findMany({
      select: { uid: true, name: true, email: true, profile_pic: true }
    });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
    sendMessage,
    getMessages,
    getAdminSentMessages,
    markRead,
    deleteMessage,
    getAllUsers
};
