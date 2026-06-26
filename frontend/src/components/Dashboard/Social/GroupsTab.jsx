import { useState, useEffect, useRef } from 'react';
import { Users, Lock, Unlock, Plus, Copy, Check, MessageSquare, ArrowLeft, Send, LogOut, Search } from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { getSocialSocket } from '../../../utils/socialSocket.js';
import { useModal } from '../../../context/ModalContext';
import { useSocialGroupsStore } from '../../../store/useSocialGroupsStore.js';

export default function GroupsTab({ currentUserId }) {
  const { confirm } = useModal();
  const groups = useSocialGroupsStore(state => state.groups);
  const loadingGroups = useSocialGroupsStore(state => state.loadingGroups);
  const hasLoadedGroups = useSocialGroupsStore(state => state.hasLoadedGroups);
  const fetchGroups = useSocialGroupsStore(state => state.fetchGroups);
  const setGroupJoined = useSocialGroupsStore(state => state.setGroupJoined);
  // Keep local loading as alias for initial load only
  const loading = loadingGroups && !hasLoadedGroups;
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPrivate: false, entryKey: '' });
  const [joinKey, setJoinKey] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(null); // stores group object to join
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchGroups();
    socketRef.current = getSocialSocket(currentUserId);

    return () => {
      // Clean up room listener
      if (socketRef.current) {
        socketRef.current.off('receiveGroupMessage');
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('receiveGroupMessage', (msg) => {
        if (activeGroupId && msg.groupId === activeGroupId) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      });
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveGroupMessage');
      }
    };
  }, [activeGroupId]);

  useEffect(() => {
    if (activeGroupId) {
      fetchMessages(activeGroupId);
      if (socketRef.current) {
        socketRef.current.emit('joinGroup', activeGroupId);
      }
      const currentGroup = groups.find((g) => g.id === activeGroupId);
      if (currentGroup) {
        setActiveGroup(currentGroup);
      }
    } else {
      setActiveGroup(null);
      setMessages([]);
    }
  }, [activeGroupId, groups]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupsLocal = async () => {
    try {
      await fetchGroups(true); // force refresh from backend
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
  };

  const fetchMessages = async (groupId) => {
    try {
      const response = await socialApi.get(`/groups/${groupId}/messages`);
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch group messages', err);
      setMessages([]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name) return;

    try {
      const response = await socialApi.post('/groups', {
        name: newGroup.name,
        description: newGroup.description,
        isPrivate: newGroup.isPrivate,
        entryKey: newGroup.isPrivate ? newGroup.entryKey : null,
      });

      const created = response.data;
      setActiveGroupId(created.id);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', isPrivate: false, entryKey: '' });
      fetchGroups(true); // force refresh store
    } catch (err) {
      console.error('Error creating group', err);
      alert(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (group, keyToUse = '') => {
    try {
      await socialApi.post('/groups/join', {
        groupId: group.id,
        entryKey: keyToUse,
      });

      setShowJoinModal(null);
      setJoinKey('');
      setGroupJoined(group.id, true); // optimistic update in store
      setActiveGroupId(group.id);
      fetchGroups(true); // sync from server
    } catch (err) {
      console.error('Error joining group', err);
      alert(err.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    const confirmed = await confirm({
      title: "Leave Group?",
      message: "Are you sure you want to leave this discussion group?",
      confirmText: "Leave",
      type: "danger"
    });
    if (!confirmed) return;
    try {
      await socialApi.post('/groups/leave', { groupId });
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
      setGroupJoined(groupId, false); // optimistic update in store
      fetchGroups(true); // sync from server
    } catch (err) {
      console.error('Error leaving group', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeGroupId) return;

    try {
      const response = await socialApi.post(`/groups/${activeGroupId}/messages`, {
        content: messageText,
      });

      const savedMessage = response.data;
      // Send via socket to broadcast to other members
      if (socketRef.current) {
        socketRef.current.emit('sendGroupMessage', savedMessage);
      }

      setMessages((prev) => [...prev, savedMessage]);
      setMessageText('');
    } catch (err) {
      console.error('Error sending group message', err);
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 6; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewGroup((prev) => ({ ...prev, entryKey: key }));
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm" style={{ height: 'calc(100svh - 200px)', minHeight: '500px' }}>
      {/* Groups List Pane */}
      <div className={`${activeGroupId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 flex-shrink-0`}>
        {/* Search & Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-orange-500" />
              <span>Groups</span>
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-1.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 transition flex items-center justify-center shadow-sm"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Group Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent mr-2"></div>
              <span>Loading...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              No groups found.
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isSelected = group.id === activeGroupId;
              return (
                <div
                  key={group.id}
                  onClick={() => {
                    if (group.isJoined) {
                      setActiveGroupId(group.id);
                    } else if (group.isPrivate) {
                      setShowJoinModal(group);
                    } else {
                      handleJoinGroup(group);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/30 shadow-sm'
                      : 'border-transparent hover:bg-gray-100/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-sm truncate font-semibold ${
                        isSelected ? 'font-bold text-orange-600 dark:text-orange-400' : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {group.name}
                      </span>
                      {group.isPrivate ? (
                        <Lock size={12} className="text-red-400 flex-shrink-0" />
                      ) : (
                        <Unlock size={12} className="text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">{group.description}</p>
                    )}
                    <span className="text-[9px] bg-gray-200/60 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-bold">
                      {group.memberCount} members
                    </span>
                  </div>

                  {!group.isJoined && (
                    <button className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded-lg transition shadow-sm flex-shrink-0">
                      Join
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Discussion Chat Panel */}
      <div className={`${!activeGroupId ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-h-0 bg-white dark:bg-gray-800`}>
        {activeGroup ? (
          <>
            {/* Group Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setActiveGroupId(null)}
                  className="md:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 transition"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{activeGroup.name}</h3>
                    {activeGroup.isPrivate ? (
                      <span className="flex items-center gap-0.5 text-[9px] text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md font-bold">
                        <Lock size={12} /> Private
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[9px] text-green-500 bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded-md font-bold">
                        <Unlock size={12} className="text-green-500" /> Public
                      </span>
                    )}
                  </div>
                  {activeGroup.description && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{activeGroup.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeGroup.entryKey && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-750 px-2.5 py-1 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 font-sans">Entry Key:</span>
                    <code className="text-xs font-mono font-bold text-orange-500">{activeGroup.entryKey}</code>
                    <button
                      onClick={() => copyToClipboard(activeGroup.entryKey)}
                      className="text-gray-400 hover:text-orange-500 transition flex items-center"
                    >
                      {copiedKey ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => handleLeaveGroup(activeGroup.id)}
                  title="Leave Group"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/10">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-orange-100/50 dark:border-orange-900/20">
                    <MessageSquare size={24} />
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">Welcome to {activeGroup.name}!</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">This is the start of the discussion history for this group. Say hello to get started!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${isOwn ? 'justify-end' : ''}`}>
                      {!isOwn && (
                        <img
                          src={msg.sender?.profilePicture || '/default-avatar.png'}
                          alt={msg.sender?.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-gray-100 mt-0.5"
                        />
                      )}
                      <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                        {!isOwn && (
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 ml-1">
                            {msg.sender?.name}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isOwn
                              ? 'bg-orange-500 text-white rounded-tr-none font-medium'
                              : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700/50 font-medium'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 px-1 font-semibold">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-800">
              <input
                type="text"
                placeholder="Type your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm transition"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow shadow-orange-500/20 transition disabled:opacity-50 flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-500 p-8 text-center bg-gray-50/20 dark:bg-gray-900/40">
            <MessageSquare size={36} className="text-orange-400 opacity-60 mb-2 animate-pulse" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Select a Conversation</h3>
            <p className="text-xs max-w-xs mt-1">Pick a discussion group from the left sidebar to start chatting.</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Discussion Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JavaScript Wizards"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Chat and discuss modern JavaScript frameworks"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Privacy Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!newGroup.isPrivate}
                      onChange={() => setNewGroup({ ...newGroup, isPrivate: false })}
                      className="accent-orange-500"
                    />
                    <Unlock size={14} className="text-green-500" /> Public
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      name="privacy"
                      checked={newGroup.isPrivate}
                      onChange={() => setNewGroup({ ...newGroup, isPrivate: true })}
                      className="accent-orange-500"
                    />
                    <Lock size={14} className="text-red-500" /> Private
                  </label>
                </div>
              </div>

              {newGroup.isPrivate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Entry Key</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. SECURE123"
                      value={newGroup.entryKey}
                      onChange={(e) => setNewGroup({ ...newGroup, entryKey: e.target.value })}
                      className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={generateRandomKey}
                      className="px-4 py-2.5 bg-gray-100 dark:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
                    >
                      Generate Key
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-650 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow transition"
                >
                  Create & Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Private Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Lock size={18} className="text-red-500" />
              <span>Private Group Join</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              The group <strong className="text-gray-700 dark:text-gray-200">"{showJoinModal.name}"</strong> is private. Please enter the correct Entry Key to join.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinGroup(showJoinModal, joinKey);
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  required
                  placeholder="Enter Entry Key"
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-250 dark:border-gray-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm text-center font-mono font-bold tracking-wider"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(null);
                    setJoinKey('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-650 rounded-xl text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow transition"
                >
                  Verify Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
