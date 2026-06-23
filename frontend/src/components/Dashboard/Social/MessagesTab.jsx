import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
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
        setContacts(Array.isArray(response.data?.friends) ? response.data.friends : []);
      } catch (err) {
        console.error('Failed to fetch contacts', err);
        setContacts([]);
      }
    };
    fetchContacts();
  }, []);

  // Sync if opened via "Message" shortcut from Feed/Friends
  useEffect(() => {
    if (selectedContact) {
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
        setMessages(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => {
    if (!currentUserId) return;
    socketRef.current = getSocialSocket(currentUserId);

    const handleMsg = (message) => {
      if (message.senderId?.toString() === selectedUserRef.current?.id?.toString()) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleMsgSent = (savedMessage) => {
      setMessages((prev) => {
        const updated = [...prev];
        const lastOptimisticIdx = updated.map(m => m.id).lastIndexOf(undefined);
        if (lastOptimisticIdx !== -1) {
          updated[lastOptimisticIdx] = savedMessage;
        }
        return updated;
      });
    };

    const handleMsgError = ({ error }) => {
      console.error('Message send error:', error);
      setMessages((prev) => prev.filter((m, i) => !(i === prev.length - 1 && !m.id)));
    };

    socketRef.current.on('receiveMessage', handleMsg);
    socketRef.current.on('messageSent', handleMsgSent);
    socketRef.current.on('messageError', handleMsgError);

    return () => {
      socketRef.current?.off('receiveMessage', handleMsg);
      socketRef.current?.off('messageSent', handleMsgSent);
      socketRef.current?.off('messageError', handleMsgError);
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

  const isSelectedUserOnline = selectedUser
    ? onlineUserIds.some(id => id.toString() === selectedUser.id.toString())
    : false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col md:flex-row" style={{ height: 'calc(100svh - 200px)', minHeight: '500px' }}>

      {/* ── Contact List ── show on mobile only when no chat is selected */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 flex-shrink-0`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
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
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={contact.profilePicture || '/default-avatar.png'} alt={contact.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                  {isContactOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm truncate ${isSelected ? 'font-bold text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200 font-semibold'}`}>{contact.name}</h4>
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
              <p className="text-xs">No chat contacts yet.<br />Add friends to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Chat Area ── show on mobile only when a chat is selected */}
      <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full min-h-0 bg-white dark:bg-gray-800`}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
              {/* Back button – mobile only */}
              <button
                onClick={() => setSelectedUser(null)}
                className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft size={20} />
              </button>
              <img src={selectedUser.profilePicture || '/default-avatar.png'} alt={selectedUser.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{selectedUser.name}</h3>
                <p className={`text-[10px] font-bold ${isSelectedUserOnline ? 'text-green-500' : 'text-gray-400'}`}>
                  {isSelectedUserOnline ? 'Active now' : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-gray-50/30 dark:bg-gray-900/10">
              {messages.map((msg, index) => {
                const isMine = msg.senderId === currentUserId;
                return (
                  <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-3 md:px-4 py-2 text-sm shadow-sm ${
                      isMine
                        ? 'bg-orange-500 text-white font-medium rounded-tr-none'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none font-medium'
                    }`}>
                      <p className="break-words">{msg.content}</p>
                      <span className="text-[9px] block text-right mt-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                  <MessageSquare size={32} className="mb-2 opacity-30" />
                  <p className="text-xs">No messages yet. Say hello!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm transition"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold p-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center shadow shadow-orange-500/20 flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-6">
            <MessageSquare size={40} className="mb-3 opacity-30 text-orange-400" />
            <h3 className="font-bold text-sm mb-1">Select a Conversation</h3>
            <p className="text-xs text-center">Pick a connection from the list to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
