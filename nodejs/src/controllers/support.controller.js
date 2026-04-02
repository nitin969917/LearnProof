const prisma = require('../lib/prisma');

/**
 * Create a new support ticket
 */
const createTicket = async (req, res) => {
    try {
        const { subject, message, priority } = req.body;
        const userId = req.user.id;

        if (!subject || !message) {
            return res.status(400).json({ error: 'Subject and message are required' });
        }

        const ticket = await prisma.supportTicket.create({
            data: {
                userId,
                subject,
                message,
                priority: priority || 'NORMAL',
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profile_pic: true
                    }
                }
            }
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create support ticket' });
    }
};

/**
 * Get all tickets for the logged in user
 */
const getUserTickets = async (req, res) => {
    try {
        const userId = req.user.id;

        const tickets = await prisma.supportTicket.findMany({
            where: { userId },
            include: {
                responses: {
                    include: {
                        admin: {
                            select: {
                                name: true,
                                profile_pic: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                }
            },
            orderBy: {
                updated_at: 'desc'
            }
        });

        res.json(tickets);
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
};

/**
 * Get a single ticket (User or Admin)
 */
const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = (process.env.ADMIN_EMAIL && req.user.email === process.env.ADMIN_EMAIL) || 
                        (process.env.ADMIN_EMAIL && req.user.email.endsWith('@learnproofai.com')) ||
                        !process.env.ADMIN_EMAIL; // Allow dev bypass if no admin email set

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profile_pic: true
                    }
                },
                responses: {
                    include: {
                        admin: {
                            select: {
                                name: true,
                                profile_pic: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Check if user owns the ticket or is admin
        if (!isAdmin && ticket.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ error: 'Failed to fetch support ticket' });
    }
};

/**
 * ADMIN: Get all tickets
 */
const getAllTickets = async (req, res) => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profile_pic: true
                    }
                },
                responses: {
                    include: {
                        admin: {
                            select: {
                                name: true,
                                profile_pic: true
                            }
                        }
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                }
            },
            orderBy: [
                { status: 'asc' }, // Will put OPEN/IN_PROGRESS before RESOLVED/CLOSED
                { updated_at: 'desc' }
            ]
        });

        res.json(tickets);
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
};

/**
 * ADMIN or USER: Add a response to a ticket
 */
const respondToTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, status } = req.body;
        const userId = req.user.id;
        const isAdmin = (process.env.ADMIN_EMAIL && req.user.email === process.env.ADMIN_EMAIL) || 
                        (process.env.ADMIN_EMAIL && req.user.email.endsWith('@learnproofai.com')) ||
                        !process.env.ADMIN_EMAIL; // Allow dev bypass if no admin email set

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: parseInt(id) }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Only admin or the user who created the ticket can respond
        console.log('Respond Permission Check:', { 
            isAdmin, 
            ticketOwnerId: ticket.userId, 
            responderId: userId,
            match: ticket.userId === userId 
        });

        if (!isAdmin && ticket.userId !== userId) {
            return res.status(403).json({ error: 'Access denied: Permission check failed' });
        }

        // Create response
        const responseData = {
            ticketId: parseInt(id),
            message,
        };

        if (isAdmin) {
            responseData.adminId = userId;
        }

        const [response, updatedTicket] = await prisma.$transaction([
            prisma.supportResponse.create({
                data: responseData,
                include: {
                    admin: {
                        select: {
                            name: true,
                            profile_pic: true
                        }
                    }
                }
            }),
            prisma.supportTicket.update({
                where: { id: parseInt(id) },
                data: {
                    status: status || (isAdmin ? 'IN_PROGRESS' : 'OPEN'),
                }
            })
        ]);

        res.json({ response, ticket: updatedTicket });
    } catch (error) {
        console.error('Error responding to ticket:', error);
        res.status(500).json({ error: 'Failed to respond to support ticket' });
    }
};

/**
 * ADMIN: Update ticket status/priority
 */
const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id: parseInt(id) },
            data: {
                status,
                priority,
            }
        });

        res.json(ticket);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Failed to update support ticket' });
    }
};

module.exports = {
    createTicket,
    getUserTickets,
    getTicketById,
    getAllTickets,
    respondToTicket,
    updateTicket,
};
