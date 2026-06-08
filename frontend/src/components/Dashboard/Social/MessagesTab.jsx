import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageSquare } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { getSocialSocket } from '../../../utils/socialSocket.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';

export default function MessagesTab({ currentUserId, selectedContact, onClearSelectedContact }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const onlineUserIds = useSocialStatusStore(state => state.onlineUserIds);
  const { unreadByContact, setActiveChatUser, clearUnreadForContact } = useSocialMessageStore();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await socialApi.get('/social/friendships');
        setContacts(response.data.friends || []);
      } catch (err) {
        console.error('Failed to fetch contacts', err);
      }
    };
    fetchContacts();
  }, []);

  // Sync if opened via "Message" shortcut from Feed/Friends
  useEffect(() => {
    if (selectedContact) {
      // Find the contact in the list if it exists, otherwise add temporarily or use directly
      const found = contacts.find(c => c.id === selectedContact.id) || selectedContact;
      setSelectedUser(found);
      onClearSelectedContact();
    }
  }, [selectedContact, contacts]);

  useEffect(() => {
    if (!selectedUser) {
      setActiveChatUser(null);
      return;
    }
    
    setActiveChatUser(selectedUser.id);
    clearUnreadForContact(selectedUser.id);
    
    const fetchMessages = async () => {
      try {
        const response = await socialApi.get(`/messages/${selectedUser.id}`);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!currentUserId) return;

    socketRef.current = getSocialSocket(currentUserId);

    const handleMsg = (message) => {
      if (message.senderId === selectedUserRef.current?.id || message.receiverId === selectedUserRef.current?.id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socketRef.current.on('receiveMessage', handleMsg);

    return () => {
      socketRef.current?.off('receiveMessage', handleMsg);
      setActiveChatUser(null);
    };
  }, [currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;

    const newMessage = {
      senderId: currentUserId,
      receiverId: selectedUser.id,
      content: input,
      createdAt: new Date().toISOString(),
    };

    socketRef.current?.emit('sendMessage', {
      receiverId: selectedUser.id.toString(),
      message: newMessage,
    });

    setMessages((prev) => [...prev, newMessage]);
    setInput('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex h-[600px]">
      {/* Contact List */}
      <div className="w-80 border-r border-gray-100 dark:border-gray-700 flex flex-col h-full bg-gray-50/50 dark:bg-gray-800/40">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
           {contacts.map(contact => {
             const isContactOnline = onlineUserIds.some(id => id.toString() === contact.id.toString());
             const unreadCount = unreadByContact[contact.id] || 0;
             const isSelected = selectedUser?.id === contact.id;
             
             return (
               <div 
                 key={contact.id}
                 onClick={() => setSelectedUser(contact)}
                 className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                   isSelected 
                     ? 'bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30' 
                     : 'hover:bg-gray-150 dark:hover:bg-gray-700'
                 }`}
               >
                 <div className="relative flex-shrink-0">
                   <img src={contact.profilePicture || '/default-avatar.png'} alt={contact.name} className="w-10 h-10 rounded-full object-cover bg-gray-150" />
                   {isContactOnline && (
                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-850 rounded-full"></div>
                   )}
                 </div>
                 
                 <div className="min-w-0 flex-1">
                   <h4 className={`text-sm truncate ${isSelected ? 'font-bold text-orange-600 dark:text-orange-400' : 'text-gray-850 dark:text-gray-200 font-semibold'}`}>{contact.name}</h4>
                   <p className={`text-[10px] font-medium ${isContactOnline ? 'text-green-500' : 'text-gray-400'}`}>
                     {isContactOnline ? 'Online' : 'Offline'}
                   </p>
                 </div>
                 
                 {unreadCount > 0 && (
                   <span className="bg-orange-500 text-white font-bold text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center shadow shadow-orange-500/20">
                     {unreadCount}
                   </span>
                 )}
               </div>
             );
           })}
           {contacts.length === 0 && (
             <div className="text-center py-12 text-gray-400">
               <p className="text-xs">No chat contacts.</p>
             </div>
           )}
        </div>
      </div>

      {/* Active Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedUser.profilePicture || '/default-avatar.png'} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-gray-950 dark:text-white text-sm">{selectedUser.name}</h3>
                  <p className={`text-[10px] font-bold ${onlineUserIds.some(id => id.toString() === selectedUser.id.toString()) ? 'text-green-500' : 'text-gray-400'}`}>
                    {onlineUserIds.some(id => id.toString() === selectedUser.id.toString()) ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20 dark:bg-gray-900/10">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div 
                    key={index}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isMine 
                        ? 'bg-orange-500 text-white font-medium rounded-tr-none' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-850 dark:text-gray-100 rounded-tl-none font-medium'
                    }`}>
                      <p>{msg.content}</p>
                      <span className={`text-[9px] block text-right mt-1 opacity-70`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-750 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm transition"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold p-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center shadow shadow-orange-500/20"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
             <MessageSquare size={36} className="mb-2 opacity-50 text-orange-400 animate-pulse" />
             <h3 className="font-bold text-sm">Select a Conversation</h3>
             <p className="text-xs">Pick a connection from the left sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
