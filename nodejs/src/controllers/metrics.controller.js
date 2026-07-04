const prisma = require('../lib/prisma');

/**
 * Logs an entry into the database whenever a unique device opens the app.
 * Expects { deviceId: string } in body.
 */
const logAppLaunch = async (req, res) => {
    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId is required' });
    }

    try {
        const logEntry = await prisma.appLaunchLog.create({
            data: {
                deviceId,
                timestamp: new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: 'App launch logged successfully',
            data: logEntry
        });
    } catch (error) {
        console.error('Error logging app launch:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = {
    logAppLaunch
};
