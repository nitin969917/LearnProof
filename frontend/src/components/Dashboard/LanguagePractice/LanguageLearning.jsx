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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomsList.length === 0 ? (
             <div className="col-span-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-2xl text-center py-16 px-4 text-gray-500 dark:text-gray-400">
                <Mic size={44} className="mx-auto mb-4 text-orange-400 opacity-60 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">No active rooms</h3>
                <p className="text-sm mb-5">Be the first to start a live room session today!</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow transition"
                >
                  Create a Room
                </button>
             </div>
          ) : (
            roomsList.map(room => (
              <div 
                key={room.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                onClick={() => navigate(`/dashboard/live-rooms/${room.roomName}`)}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {room.language}
                    </span>
                    {socialUser && socialUser.id?.toString() === room.creatorId?.toString() && (
                      <button 
                        onClick={(e) => handleDeleteRoom(e, room.id)}
                        className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-1 rounded-lg transition"
                      >
                        End Room
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 truncate">{room.topic}</h3>
                  <p className="text-gray-400 text-xs font-semibold mb-4">
                    Room: {room.roomName}
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-750 pt-4 mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img 
                      src={room.creator.profilePicture || '/default-avatar.png'} 
                      alt={room.creator.name}
                      className="w-7 h-7 rounded-full object-cover bg-gray-100 flex-shrink-0" 
                    />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{room.creator.name}</span>
                  </div>
                  <button className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow shadow-orange-500/10">
                    Join Session
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
