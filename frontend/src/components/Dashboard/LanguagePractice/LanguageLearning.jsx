import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Globe, Plus, Users, Search, GraduationCap } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function LanguageLearning() {
  const [roomsList, setRoomsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ roomName: '', topic: '', language: '' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [socialUser, setSocialUser] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchSocialUser();
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
      alert(error.response?.data?.message || 'Failed to create room. Room name might already be in use.');
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
      {/* Header card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="text-orange-500 animate-pulse" size={28} />
            <span>Live Rooms</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Join or start a live room to discuss, practice, or learn together with other members.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-655 text-white font-bold text-sm shadow shadow-orange-500/20 transition-all flex-shrink-0"
        >
          <Plus size={18} />
          <span>Create Room</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
          <span>Loading live rooms...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {roomsList.length === 0 ? (
             <div className="col-span-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl text-center py-16 px-4 text-gray-500 dark:text-gray-400">
                <Mic size={44} className="mx-auto mb-4 text-orange-400 opacity-60 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">No active rooms</h3>
                <p className="text-sm mb-5">Be the first to start a live room session today!</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-655 text-white font-bold text-sm shadow transition"
                >
                  Create a Room
                </button>
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
                  <span className="bg-orange-100/60 dark:bg-orange-950/60 text-orange-655 dark:text-orange-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-wider">
                    {room.language}
                  </span>
                  {socialUser && socialUser.id?.toString() === room.creatorId?.toString() && (
                    <button 
                      onClick={(e) => handleDeleteRoom(e, room.id)}
                      className="text-[9px] sm:text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all z-20 cursor-pointer"
                    >
                      End
                    </button>
                  )}
                </div>

                {/* Middle: Centered Mic icon + Topic */}
                <div className="flex flex-col items-center justify-center text-center my-auto px-1 z-10">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Mic size={18} className="sm:size-[24px] animate-pulse" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm md:text-base leading-snug line-clamp-2 px-0.5">
                    {room.topic}
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 text-[9px] sm:text-xs font-bold mt-1 uppercase tracking-wider">
                    Room: {room.roomName}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-550 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Live Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Room Name</label>
                <input 
                  type="text" 
                  value={newRoom.roomName}
                  onChange={(e) => setNewRoom({...newRoom, roomName: e.target.value})}
                  placeholder="e.g. english-speaking-club" 
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Language</label>
                <select 
                  value={newRoom.language}
                  onChange={(e) => setNewRoom({...newRoom, language: e.target.value})}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-750 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-650 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Language</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                  <option value="Hindi">Hindi</option>
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
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
              </div>
              
              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-650 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-655 text-white font-bold text-sm shadow transition"
                >
                  Create & Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
