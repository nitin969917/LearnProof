import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Globe, Plus, Users, Search, GraduationCap } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function LanguageLearning() {
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomName: '', topic: '', language: '' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socialUser, setSocialUser] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchSocialUser();

    // Poll active rooms list every 5 seconds to keep it dynamic and fresh
    const pollInterval = setInterval(fetchRooms, 5000);
    return () => clearInterval(pollInterval);
  }, []);

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
      setRoomsList(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
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
      
      await socialApi.post('/language-rooms', {
        roomName: formattedRoomName,
        topic: newRoom.topic || 'General Discussion',
        language: newRoom.language
      });
      
      setShowModal(false);
      navigate(`/dashboard/live-rooms/${formattedRoomName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.response?.data?.message || 'Failed to create room. Room name might already be in use.');
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("End this practice session?")) return;
    try {
      await socialApi.delete(`/language-rooms/${id}`);
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto px-2 md:px-6">
      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Text block: centered on mobile, left-aligned on desktop */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
              <Globe className="text-white" size={32} />
            </div>
            Live Rooms
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm sm:text-lg max-w-xl">
            Join or start a live room to discuss, practice, or learn together with other members.
          </p>
        </div>

        {/* + button: absolute top-right on mobile, normal flow (right side) on desktop */}
        <button 
          onClick={() => setShowModal(true)} 
          className="absolute top-0 right-0 sm:static p-2.5 sm:p-3 text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md shadow-orange-500/15 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
          title="Create Room"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
          <span className="text-sm font-semibold">Loading live rooms...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {roomsList.length === 0 ? (
             <div className="col-span-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl text-center py-16 px-6 text-gray-500 dark:text-gray-400 shadow-sm relative overflow-hidden">
                {/* Decorative glow blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 max-w-sm mx-auto">
                    <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-5 shadow-sm border border-orange-100/50 dark:border-orange-500/10">
                        <Mic size={32} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">No active rooms</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-405 mb-6 leading-relaxed">Be the first to start a live room session today to discuss, practice, or learn together!</p>
                    <button 
                      onClick={() => setShowModal(true)}
                      className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Create a Room
                    </button>
                </div>
             </div>
          ) : (
            roomsList.map(room => (
              <div 
                key={room.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-700 p-3 sm:p-5 md:p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between aspect-square relative group hover:-translate-y-1 duration-300"
                onClick={() => navigate(`/dashboard/live-rooms/${room.roomName}`)}
              >
                {/* Decorative background blur blob */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-300 pointer-events-none"></div>

                {/* Top bar: Language badge and End room button */}
                <div className="flex justify-between items-center z-10">
                  <span className="bg-orange-100/60 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider">
                    {room.language}
                  </span>
                  {socialUser && socialUser.id?.toString() === room.creatorId?.toString() && (
                    <button 
                      onClick={(e) => handleDeleteRoom(e, room.id)}
                      className="text-[9px] sm:text-xs font-bold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/40 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all z-20 cursor-pointer"
                    >
                      End
                    </button>
                  )}
                </div>

                {/* Middle: Centered Mic icon + Room Title (large) & Topic (small) */}
                <div className="flex flex-col items-center justify-center text-center my-auto px-1 z-10">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Mic size={18} className="sm:size-[24px] animate-pulse" />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white text-sm sm:text-base md:text-lg leading-snug line-clamp-1 px-0.5 uppercase tracking-wide">
                    {room.roomName}
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
                      className="w-5 h-5 sm:w-8 sm:h-8 rounded-full object-cover bg-gray-150 dark:bg-gray-750 flex-shrink-0 border border-white dark:border-gray-800 shadow-sm" 
                    />
                    <span className="text-[10px] sm:text-xs font-black text-gray-650 dark:text-gray-400 truncate max-w-[45px] sm:max-w-[80px]">
                      {room.creator.name.split(' ')[0]}
                    </span>
                  </div>
                  <button className="px-2.5 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[9px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-md shadow-orange-500/10 group-hover:shadow-orange-500/20">
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
    </div>
  );
}
