const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

const LIVEKIT_HOST = process.env.LIVEKIT_HOST || 'https://livekit.learnproofai.com';
const LIVEKIT_WS   = process.env.LIVEKIT_WS   || 'wss://livekit.learnproofai.com';
const API_KEY      = process.env.LIVEKIT_API_KEY    || 'learnproof_key';
const API_SECRET   = process.env.LIVEKIT_API_SECRET || 'learnproof_livekit_secret_2024_xyz789';

const roomService = new RoomServiceClient(LIVEKIT_HOST, API_KEY, API_SECRET);

/**
 * Generate a LiveKit JWT token for a user to join a room
 */
function generateToken(roomName, userId, userName, isAdmin = false, canPublish = true) {
  const token = new AccessToken(API_KEY, API_SECRET, {
    identity: String(userId),
    name: userName || `User_${userId}`,
    ttl: '3h',
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: canPublish,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isAdmin,
  });

  return token.toJwt();
}

/**
 * Create a LiveKit room with config
 */
async function createRoom(roomName, maxParticipants = 10) {
  try {
    await roomService.createRoom({
      name: roomName,
      maxParticipants,
      emptyTimeout: 300, // auto-delete after 5 mins empty
    });
    return true;
  } catch (err) {
    // Room might already exist — that's fine
    if (err.message && err.message.includes('already exists')) return true;
    throw err;
  }
}

/**
 * List all active rooms
 */
async function listRooms() {
  const rooms = await roomService.listRooms();
  return rooms;
}

/**
 * Delete a room by name
 */
async function deleteRoom(roomName) {
  try {
    await roomService.deleteRoom(roomName);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * List participants in a room
 */
async function listParticipants(roomName) {
  try {
    const participants = await roomService.listParticipants(roomName);
    return participants;
  } catch (err) {
    return [];
  }
}

/**
 * Remove/Kick a participant from a room
 */
async function kickParticipant(roomName, identity) {
  try {
    await roomService.removeParticipant(roomName, identity);
    return true;
  } catch (err) {
    console.error(`Failed to kick participant ${identity} from room ${roomName}:`, err);
    throw err;
  }
}

/**
 * Update dynamic permissions for a participant in a room
 */
async function updateParticipantPermissions(roomName, identity, permissions) {
  try {
    await roomService.updateParticipant(roomName, identity, undefined, permissions);
    return true;
  } catch (err) {
    console.error(`Failed to update permissions for participant ${identity} in room ${roomName}:`, err);
    throw err;
  }
}

module.exports = {
  generateToken,
  createRoom,
  listRooms,
  deleteRoom,
  listParticipants,
  kickParticipant,
  updateParticipantPermissions,
  LIVEKIT_WS,
};
