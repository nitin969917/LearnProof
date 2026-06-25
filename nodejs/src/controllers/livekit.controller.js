const livekitService = require('../services/livekit.service');
const datingPrisma = require('../utils/datingPrisma');
const translate = require('google-translate-api-x');

// In-memory stage request queue: roomName -> Map(identity -> { identity, name, requestedAt })
const stageRequestStore = new Map();

const getStageRequestMap = (roomName) => {
  if (!stageRequestStore.has(roomName)) {
    stageRequestStore.set(roomName, new Map());
  }
  return stageRequestStore.get(roomName);
};

const clearStageRequest = (roomName, identity) => {
  getStageRequestMap(roomName).delete(String(identity));
};

const clearAllStageRequests = (roomName) => {
  stageRequestStore.delete(roomName);
};

/**
 * GET /api/livekit/token?room=roomName
 * Returns a LiveKit JWT token for the authenticated user
 */
const getToken = async (req, res) => {
  try {
    const { room, requestPublish } = req.query;
    if (!room) return res.status(400).json({ error: 'room name is required' });

    const userId = req.user.id;
    const userName = req.user.name || req.user.email?.split('@')[0] || `User_${userId}`;

    // 1. Fetch room config from SQLite
    const dbRoom = await datingPrisma.languageRoom.findUnique({
      where: { roomName: room }
    });

    if (dbRoom && dbRoom.isFriendsOnly && dbRoom.creatorId !== userId) {
      const friendship = await datingPrisma.friendship.findFirst({
        where: {
          status: 'accepted',
          OR: [
            { senderId: dbRoom.creatorId, receiverId: userId },
            { senderId: userId, receiverId: dbRoom.creatorId }
          ]
        }
      });

      if (!friendship) {
        return res.status(403).json({ error: 'Access denied: this is a friends-only room' });
      }
    }

    const isAdmin = dbRoom ? (dbRoom.creatorId === userId) : false;

    // 2. Ensure room exists in LiveKit server (support up to 500 audience members for "unlimited" feel)
    await livekitService.createRoom(room, 500);

    // 3. Generate the JWT token (hosts and requestPublish speaker state join as speakers)
    const canPublish = isAdmin || requestPublish === 'true';
    const token = await livekitService.generateToken(room, userId, userName, isAdmin, canPublish);

    return res.json({
      token,
      serverUrl: livekitService.LIVEKIT_WS,
      room,
      identity: String(userId),
    });
  } catch (err) {
    console.error('LiveKit token error:', err);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
};

/**
 * GET /api/livekit/rooms
 * Returns list of active LiveKit rooms
 */
const getRooms = async (req, res) => {
  try {
    const rooms = await livekitService.listRooms();
    return res.json({ rooms });
  } catch (err) {
    console.error('LiveKit list rooms error:', err);
    return res.status(500).json({ error: 'Failed to list rooms' });
  }
};

/**
 * DELETE /api/livekit/rooms/:roomName
 * Deletes a LiveKit room
 */
const deleteRoom = async (req, res) => {
  try {
    const { roomName } = req.params;
    await livekitService.deleteRoom(roomName);
    clearAllStageRequests(roomName);
    return res.json({ success: true });
  } catch (err) {
    console.error('LiveKit delete room error:', err);
    return res.status(500).json({ error: 'Failed to delete room' });
  }
};

/**
 * GET /api/livekit/rooms/:roomName/participants
 * Returns participants in a room
 */
const getParticipants = async (req, res) => {
  try {
    const { roomName } = req.params;
    const participants = await livekitService.listParticipants(roomName);
    return res.json({ participants });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get participants' });
  }
};

/**
 * DELETE /api/livekit/rooms/:roomName/participants/:identity
 * Kick/remove a participant from a room (Creator only)
 */
const kickParticipant = async (req, res) => {
  try {
    const { roomName, identity } = req.params;
    const userId = req.user.id;

    // Retrieve room from SQLite database to check creator permission
    const dbRoom = await datingPrisma.languageRoom.findUnique({
      where: { roomName }
    });

    if (!dbRoom) {
      return res.status(404).json({ error: 'Room configuration not found in database' });
    }

    if (dbRoom.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the room creator can kick participants' });
    }

    await livekitService.kickParticipant(roomName, identity);
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to kick participant:', err);
    return res.status(500).json({ error: 'Failed to kick participant from room' });
  }
};

/**
 * POST /api/livekit/rooms/:roomName/participants/:identity/promote
 * Promote a listener to speaker (Creator only) - Enforces max 6 speakers limit
 */
const promoteParticipant = async (req, res) => {
  try {
    const { roomName, identity } = req.params;
    const userId = req.user.id;

    // Check creator permission from SQLite database
    const dbRoom = await datingPrisma.languageRoom.findUnique({
      where: { roomName }
    });

    if (!dbRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (dbRoom.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the room host can promote participants' });
    }

    // Fetch active participants to count existing speakers (max 6)
    const activeParticipants = await livekitService.listParticipants(roomName);
    const activeSpeakersCount = activeParticipants.filter(
      p => p.permission?.canPublish || p.permissions?.canPublish
    ).length;

    if (activeSpeakersCount >= 6) {
      return res.status(400).json({ 
        error: 'Stage is full. Maximum of 6 speakers allowed on stage. Please demote an active speaker first.' 
      });
    }

    // Set canPublish = true in LiveKit server
    await livekitService.updateParticipantPermissions(roomName, identity, {
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    clearStageRequest(roomName, identity);

    return res.json({ success: true, message: 'Participant promoted to speaker' });
  } catch (err) {
    console.error('Failed to promote participant:', err);
    return res.status(500).json({ error: 'Failed to promote participant' });
  }
};

/**
 * POST /api/livekit/rooms/:roomName/participants/:identity/demote
 * Demote a speaker back to audience (Creator only)
 */
const demoteParticipant = async (req, res) => {
  try {
    const { roomName, identity } = req.params;
    const userId = req.user.id;

    // Check creator permission from SQLite database
    const dbRoom = await datingPrisma.languageRoom.findUnique({
      where: { roomName }
    });

    if (!dbRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Allow demotion if the caller is the host OR if the caller is demoting themselves
    const isSelfDemote = String(userId) === identity;
    const isHost = dbRoom.creatorId === userId;

    if (!isHost && !isSelfDemote) {
      return res.status(403).json({ error: 'Only the room host or the participant themselves can demote stage speakers' });
    }

    // Set canPublish = false in LiveKit server
    await livekitService.updateParticipantPermissions(roomName, identity, {
      canPublish: false,
      canSubscribe: true,
      canPublishData: true
    });

    return res.json({ success: true, message: 'Participant demoted to listener' });
  } catch (err) {
    console.error('Failed to demote participant:', err);
    return res.status(500).json({ error: 'Failed to demote participant' });
  }
};

/**
 * POST /api/livekit/rooms/:roomName/stage-requests
 * Listener submits a request to join the stage
 */
const submitStageRequest = async (req, res) => {
  try {
    const { roomName } = req.params;
    const userId = String(req.user.id);
    const userName = req.user.name || 'User';

    const dbRoom = await datingPrisma.languageRoom.findUnique({ where: { roomName } });
    if (!dbRoom) return res.status(404).json({ error: 'Room not found' });
    if (String(dbRoom.creatorId) === userId) {
      return res.status(400).json({ error: 'Host cannot request the stage' });
    }

    getStageRequestMap(roomName).set(userId, {
      identity: userId,
      name: userName,
      requestedAt: Date.now(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to submit stage request:', err);
    return res.status(500).json({ error: 'Failed to submit stage request' });
  }
};

/**
 * GET /api/livekit/rooms/:roomName/stage-requests
 * Host fetches pending stage requests
 */
const getStageRequests = async (req, res) => {
  try {
    const { roomName } = req.params;
    const userId = req.user.id;

    const dbRoom = await datingPrisma.languageRoom.findUnique({ where: { roomName } });
    if (!dbRoom) return res.status(404).json({ error: 'Room not found' });
    if (dbRoom.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the room host can view stage requests' });
    }

    const requests = Array.from(getStageRequestMap(roomName).values());
    return res.json({ requests });
  } catch (err) {
    console.error('Failed to fetch stage requests:', err);
    return res.status(500).json({ error: 'Failed to fetch stage requests' });
  }
};

/**
 * DELETE /api/livekit/rooms/:roomName/stage-requests/:identity
 * Host dismisses a stage request (or after promote)
 */
const dismissStageRequest = async (req, res) => {
  try {
    const { roomName, identity } = req.params;
    const userId = req.user.id;

    const dbRoom = await datingPrisma.languageRoom.findUnique({ where: { roomName } });
    if (!dbRoom) return res.status(404).json({ error: 'Room not found' });

    const isHost = dbRoom.creatorId === userId;
    const isSelf = String(identity) === String(userId);
    if (!isHost && !isSelf) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    clearStageRequest(roomName, identity);
    return res.json({ success: true });
  } catch (err) {
    console.error('Failed to dismiss stage request:', err);
    return res.status(500).json({ error: 'Failed to dismiss stage request' });
  }
};

/**
 * POST /api/livekit/translate
 * Translates transcriptions in real time using google-translate-api-x
 */
const translateText = async (req, res) => {
  try {
    const { text, from, to } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text parameter is required' });
    }

    const result = await translate(text, { 
      from: from || 'auto', 
      to: to || 'en' 
    });

    return res.json({ 
      translatedText: result.text 
    });
  } catch (err) {
    console.error('LiveKit translate endpoint error:', err);
    return res.status(500).json({ error: 'Translation failed' });
  }
};

module.exports = { 
  getToken, 
  getRooms, 
  deleteRoom, 
  getParticipants, 
  kickParticipant, 
  promoteParticipant, 
  demoteParticipant, 
  translateText,
  submitStageRequest,
  getStageRequests,
  dismissStageRequest,
};
