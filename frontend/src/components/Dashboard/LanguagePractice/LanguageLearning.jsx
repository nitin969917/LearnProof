import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Mic, Globe, Plus, Users, Search, GraduationCap, Video, PhoneOff, Trash2, X } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { getSocialSocket } from '../../../utils/socialSocket.js';

export default function LanguageLearning() {
  const outletContext = useOutletContext();
  const setHeaderAction = outletContext?.setHeaderAction;
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomName: '', topic: '', language: '', mediaType: 'audio', isFriendsOnly: false });
  const [activeTab, setActiveTab] = useState(localStorage.getItem('languageRoomsTab') || 'audio'); // 'audio' or 'video'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socialUser, setSocialUser] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchSocialUser();
  }, []);

  useEffect(() => {
    if (setHeaderAction) {
      setHeaderAction(() => () => {
        setNewRoom({ roomName: '', topic: '', language: '', mediaType: activeTab, isFriendsOnly: false });
        setShowModal(true);
      });
      return () => setHeaderAction(null);
    }
  }, [setHeaderAction, activeTab]);

  useEffect(() => {
    // Listen to real-time room creation/deletion events from other users via socket
    let socket = null;
    if (socialUser?.id) {
      try {
        socket = getSocialSocket(socialUser.id);
        if (socket) {
          socket.on('ROOMS_UPDATED', fetchRooms);
        }
      } catch (err) {
        console.error('Failed to bind ROOMS_UPDATED socket listener:', err);
      }
    }

    // Poll active rooms list every 30 seconds to keep it dynamic and fresh without overloading
    const pollInterval = setInterval(fetchRooms, 30000);
    return () => {
      clearInterval(pollInterval);
      if (socket) {
        socket.off('ROOMS_UPDATED', fetchRooms);
      }
    };
  }, [socialUser]);

  const fetchSocialUser = async () => {
    try {
      const response = await socialApi.get('/users/me');
      setSocialUser(response.data);
    } catch (err) {
      console.error('Failed to get social user in language view', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await socialApi.get('/language-rooms');
      // Guard: always set an array, even if API returns an error object
      setRoomsList(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRoomsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.roomName || !newRoom.language) return;
    setCreating(true);

    try {
      // Format room name to be url safe
      const formattedRoomName = newRoom.roomName.replace(/\s+/g, '-').toLowerCase();
      
      const response = await socialApi.post('/language-rooms', {
        roomName: formattedRoomName,
        topic: newRoom.topic || 'General Discussion',
        language: newRoom.language,
        mediaType: newRoom.mediaType || 'audio',
        isFriendsOnly: !!newRoom.isFriendsOnly
      });
      
      setShowModal(false);
      navigate(`/dashboard/live-rooms/${response.data.roomName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.response?.data?.message || 'Failed to create room. Room name might already be in use.');
      setCreating(false);
    }
  };

  const handleDeleteRoom = (e, id) => {
    e.stopPropagation();
    setRoomToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await socialApi.delete(`/language-rooms/${roomToDelete}`);
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    } finally {
      setShowConfirmModal(false);
      setRoomToDelete(null);
    }
  };

  const audioRoomsCount = (Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === 'audio').length;
  const videoRoomsCount = (Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === 'video').length;
  const totalRoomsCount = audioRoomsCount + videoRoomsCount;

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28">

      {/* ── Compact Mobile Header ──────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-650 shrink-0">
          <Globe size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Live Rooms</h1>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            {totalRoomsCount > 0 ? `${totalRoomsCount} active rooms` : "Practice languages in real-time"}
          </p>
        </div>
        <button
          onClick={() => {
            setNewRoom({ roomName: '', topic: '', language: '', mediaType: activeTab, isFriendsOnly: false });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/15 active:scale-95 cursor-pointer font-bold text-xs shrink-0"
        >
          <Plus size={14} />
          <span>Create</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => {
            setActiveTab('audio');
            localStorage.setItem('languageRoomsTab', 'audio');
          }}
          className={`flex-1 pb-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'audio'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Mic size={13} />
          <span>Audio ({audioRoomsCount})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('video');
            localStorage.setItem('languageRoomsTab', 'video');
          }}
          className={`flex-1 pb-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'video'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
          }`}
        >
          <Video size={13} />
          <span>Video ({videoRoomsCount})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
          <span className="text-sm font-semibold">Loading live rooms...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {(Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === activeTab).length === 0 ? (
             <div className="col-span-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl text-center py-16 px-6 text-gray-500 dark:text-gray-400 shadow-sm relative overflow-hidden">
                {/* Decorative glow blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-5 shadow-sm border border-orange-100/50 dark:border-orange-500/10">
                        {activeTab === 'video' ? <Video size={32} className="animate-pulse" /> : <Mic size={32} className="animate-pulse" />}
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No active {activeTab} rooms</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-405 mb-6 leading-relaxed">Be the first to start a live {activeTab} room session today to discuss, practice, or learn together!</p>
                    <button 
                      onClick={() => {
                        setNewRoom({ roomName: '', topic: '', language: '', mediaType: activeTab, isFriendsOnly: false });
                        setShowModal(true);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Create a Room
                    </button>
                </div>
             </div>
          ) : (
            (Array.isArray(roomsList) ? roomsList : []).filter(r => (r.mediaType || 'audio') === activeTab).map(room => (
              <div 
                key={room.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-3 sm:p-5 flex flex-col justify-between aspect-square relative group hover:-translate-y-1 duration-300 transition-all cursor-pointer"
                onClick={() => navigate(`/dashboard/live-rooms/${room.roomName}`)}
              >
                {/* Decorative background blur blob */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-300 pointer-events-none"></div>

                {/* Top bar: Language badge and End room button */}
                <div className="flex justify-between items-center gap-1.5 z-10 w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="bg-orange-100/60 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider truncate">
                      {room.language}
                    </span>
                    {room.isFriendsOnly && (
                      <span className="bg-orange-500/10 text-orange-500 p-1 rounded-full shrink-0" title="Friends Only Room">
                        <Users size={10} className="sm:size-[12px] shrink-0" />
                      </span>
                    )}
                  </div>
                  {socialUser && socialUser.id?.toString() === room.creatorId?.toString() && (
                    <button 
                      onClick={(e) => handleDeleteRoom(e, room.id)}
                      className="text-[9px] sm:text-xs font-bold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/40 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all z-20 cursor-pointer"
                    >
                      End
                    </button>
                  )}
                </div>

                {/* Middle: Centered Icon + Room Title & Topic */}
                <div className="flex flex-col items-center justify-center text-center my-auto px-1 z-10">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-tr ${
                    room.mediaType === 'video'
                      ? 'from-blue-500 to-indigo-500 shadow-blue-500/20'
                      : 'from-orange-500 to-amber-500 shadow-orange-500/20'
                  } rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {room.mediaType === 'video' ? (
                      <Video size={18} className="sm:size-[24px] animate-pulse" />
                    ) : (
                      <Mic size={18} className="sm:size-[24px] animate-pulse" />
                    )}
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white text-xs sm:text-sm md:text-base leading-snug line-clamp-1 px-0.5 uppercase tracking-wide">
                    {room.roomName.replace(/-\d+$/, '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </h3>
                  <p className="text-gray-450 dark:text-gray-500 text-[10px] sm:text-xs font-bold mt-1.5 leading-tight line-clamp-2 px-1">
                    {room.topic}
                  </p>
                </div>
                
                {/* Bottom: Creator and Join button */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/60 pt-3 sm:pt-4 z-10">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img 
                      src={room.creator.profilePicture || '/default-avatar.png'} 
                      alt={room.creator.name}
                      className="w-5 h-5 sm:w-8 sm:h-8 rounded-full object-cover bg-gray-150 dark:bg-gray-755 flex-shrink-0 border border-white dark:border-gray-800 shadow-sm" 
                    />
                    <span className="text-[10px] sm:text-xs font-black text-gray-655 dark:text-gray-400 truncate max-w-[45px] sm:max-w-[80px]">
                      {room.creator.name.split(' ')[0]}
                    </span>
                  </div>
                  <button className={`px-2.5 py-1 sm:px-4 sm:py-2 bg-gradient-to-r ${
                    room.mediaType === 'video'
                      ? 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/10 group-hover:shadow-blue-500/20'
                      : 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/10 group-hover:shadow-orange-500/20'
                  } text-white text-[9px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-md shadow-orange-500/10 group-hover:shadow-orange-500/20`}>
                    Join
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Create Live Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Room Name</label>
                <input 
                  type="text" 
                  value={newRoom.roomName}
                  onChange={(e) => setNewRoom({...newRoom, roomName: e.target.value})}
                  placeholder="e.g. english-speaking-club" 
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Language</label>
                <select 
                  value={newRoom.language}
                  onChange={(e) => setNewRoom({...newRoom, language: e.target.value})}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select Language</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Room Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, mediaType: 'audio' })}
                    className={`flex-1 py-2.5 border rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newRoom.mediaType === 'audio'
                        ? 'border-orange-500 bg-orange-500/5 text-orange-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Mic size={14} />
                    <span>Audio Room</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, mediaType: 'video' })}
                    className={`flex-1 py-2.5 border rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newRoom.mediaType === 'video'
                        ? 'border-orange-500 bg-orange-500/5 text-orange-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Video size={14} />
                    <span>Video Room</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Visibility</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, isFriendsOnly: false })}
                    className={`flex-1 py-2.5 border rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      !newRoom.isFriendsOnly
                        ? 'border-orange-500 bg-orange-500/5 text-orange-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Globe size={14} />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, isFriendsOnly: true })}
                    className={`flex-1 py-2.5 border rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newRoom.isFriendsOnly
                        ? 'border-orange-500 bg-orange-500/5 text-orange-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                  >
                    <Users size={14} />
                    <span>Friends Only</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Topic (Optional)</label>
                <input 
                  type="text" 
                  value={newRoom.topic}
                  onChange={(e) => setNewRoom({...newRoom, topic: e.target.value})}
                  placeholder="e.g. Practice daily conversations" 
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
              </div>
              
              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  disabled={creating}
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-2.5 border border-gray-205 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-350 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow transition rounded-xl cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create & Join</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for ending room */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl max-w-xs w-full p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            {/* Close button at top-right */}
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setRoomToDelete(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors p-1"
            >
              <X size={18} />
            </button>

            {/* Centered Icon */}
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <PhoneOff size={26} className="text-red-500" />
            </div>

            {/* Centered Title */}
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">End Practice Session?</h3>

            {/* Centered Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              Are you sure you want to end this practice session for everyone? This action cannot be undone.
            </p>

            {/* Buttons in One Row */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setRoomToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-red-500/20 transition cursor-pointer active:scale-95"
              >
                End Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
