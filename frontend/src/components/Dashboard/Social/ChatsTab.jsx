import { useState, useEffect, useRef } from 'react';
import { 
  Search, Lock, Unlock, Plus, Copy, Check, MessageSquare, 
  ArrowLeft, Send, LogOut, CheckCheck, MoreVertical, PlusCircle, UserPlus, X, Trash2, CornerUpLeft,
  Phone, Video as VideoIcon, Play, SquarePen, Users, MessageSquareMore
} from 'lucide-react';
import socialApi from '../../../api/socialApi.js';
import { getSocialSocket } from '../../../utils/socialSocket.js';
import { useSocialStatusStore } from '../../../store/socialStatusStore.js';
import { useSocialMessageStore } from '../../../store/socialMessageStore.js';
import { useSocialFeedStore } from '../../../store/socialFeedStore.js';
import { useSocialGroupsStore } from '../../../store/useSocialGroupsStore.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '../../../context/ModalContext';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import UserAvatar from '../../Common/UserAvatar.jsx';

const formatConversationTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) {
    return 'Yesterday';
  }
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getMessageDateLabel = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

export default function ChatsTab({ currentUserId, selectedContact, onClearSelectedContact, onToggleHeader, onViewProfile }) {
  const { confirm } = useModal();
  const { user, matrixClient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMatrixActive = !!(user?.matrixCredentials && matrixClient);

  // Zustand stores for online status and unread counters
  const onlineUserIds = useSocialStatusStore((state) => state.onlineUserIds);
  const unreadByContact = useSocialMessageStore((state) => state.unreadByContact);
  const clearUnreadForContact = useSocialMessageStore((state) => state.clearUnreadForContact);
  const setActiveChatUser = useSocialMessageStore((state) => state.setActiveChatUser);

  // Use shared Zustand stores for instant loading
  const storeFriends = useSocialFeedStore(state => state.friends);
  const fetchStoreFriends = useSocialFeedStore(state => state.fetchFriends);
  const hasLoadedFriends = useSocialFeedStore(state => state.hasLoadedFriends);
  const storeGroups = useSocialGroupsStore(state => state.groups);
  const fetchStoreGroups = useSocialGroupsStore(state => state.fetchGroups);
  const hasLoadedGroups = useSocialGroupsStore(state => state.hasLoadedGroups);

  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(!hasLoadedFriends || !hasLoadedGroups);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'direct', 'groups'

  // Selected chat
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Last message previews
  const [lastMessages, setLastMessages] = useState({});

  const [replyingTo, setReplyingTo] = useState(null);
  const [swipeState, setSwipeState] = useState({});
  const SWIPE_THRESHOLD = 60;

  const parseMessageContent = (msg) => {
    if (!msg || !msg.content) return { text: "" };
    try {
      const data = JSON.parse(msg.content);
      if (data && typeof data === 'object' && ('text' in data || 'replyTo' in data || 'reactions' in data || 'type' in data)) {
        return data;
      }
    } catch (e) {}
    return {
      text: msg.content,
      isVoiceNote: msg.isVoiceNote,
      duration: msg.duration,
      reactions: msg.reactions || {}
    };
  };

  const handleToggleReaction = (messageId, emoji) => {
    if (!socketRef.current) return;
    socketRef.current.emit('messageReaction', {
      messageId,
      isGroup: selectedChat.type === 'group',
      emoji
    });
  };

  const [typingUsers, setTypingUsers] = useState({});

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(null);
  const [showNewDirectChatModal, setShowNewDirectChatModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '', isPrivate: false, entryKey: '' });
  const [joinKey, setJoinKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Message Actions & Long-Press Options
  const [activeMenuMessage, setActiveMenuMessage] = useState(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Group Details & Member Management states
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  const [loadingGroupDetails, setLoadingGroupDetails] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [friendsToInvite, setFriendsToInvite] = useState([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [directChatSearch, setDirectChatSearch] = useState('');

  const getLocalIdFromMatrixUserId = (matrixUserId) => {
    if (!matrixUserId) return null;
    const match = matrixUserId.match(/@user_(\d+):/);
    return match ? parseInt(match[1]) : matrixUserId;
  };

  const formatMatrixEvent = (event) => {
    const sender = event.getSender();
    const senderId = getLocalIdFromMatrixUserId(sender);
    const receiverId = senderId === currentUserId ? selectedChat?.id : currentUserId;
    return {
      id: event.getId(),
      senderId,
      receiverId,
      content: event.getContent()?.body || '',
      createdAt: new Date(event.getTs()).toISOString(),
    };
  };

  const getOrCreateMatrixRoom = async (friendId) => {
    if (!isMatrixActive || !matrixClient) return null;

    const homeserverDomain = user.matrixCredentials.userId.split(':')[1];
    const friendMatrixId = `@user_${friendId}:${homeserverDomain}`;

    const rooms = matrixClient.getRooms();
    const existingRoom = rooms.find(r => {
      const members = r.getJoinedMembers();
      return members.length === 2 && members.some(m => m.userId === friendMatrixId);
    });

    if (existingRoom) {
      return existingRoom.roomId;
    }

    try {
      const createRes = await matrixClient.createRoom({
        invite: [friendMatrixId],
        preset: "trusted_private_chat",
        is_direct: true
      });
      return createRes.room_id;
    } catch (e) {
      console.error("Failed to create Matrix direct room:", e);
      return null;
    }
  };

  const fetchGroupDetails = async (groupId) => {
    setLoadingGroupDetails(true);
    try {
      const res = await socialApi.get(`/groups/${groupId}`);
      setGroupDetails(res.data);
      
      const memberUserIds = res.data.members.map(m => m.userId);
      const inviteable = contacts.filter(f => !memberUserIds.includes(f.id));
      setFriendsToInvite(inviteable);
    } catch (err) {
      console.error('Failed to fetch group details:', err);
    } finally {
      setLoadingGroupDetails(false);
    }
  };

  const handleToggleOnlyAdminsPost = async (val) => {
    try {
      const res = await socialApi.put(`/groups/${selectedChat.id}/settings`, {
        onlyAdminsCanPost: val
      });
      setGroupDetails(prev => ({
        ...prev,
        onlyAdminsCanPost: res.data.onlyAdminsCanPost
      }));
      setGroups(prev => prev.map(g => g.id === selectedChat.id ? { ...g, onlyAdminsCanPost: res.data.onlyAdminsCanPost } : g));
      setSelectedChat(prev => ({ ...prev, onlyAdminsCanPost: res.data.onlyAdminsCanPost }));
    } catch (err) {
      console.error('Failed to update group settings:', err);
      toast.error('Failed to update group settings');
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      await socialApi.post(`/groups/${selectedChat.id}/members`, {
        userId: friendId
      });
      await fetchGroupDetails(selectedChat.id);
      toast.success('Member added!');
    } catch (err) {
      console.error('Failed to add member:', err);
      toast.error(err.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    const confirmed = await confirm({
      title: "Remove Member?",
      message: "Are you sure you want to remove this member from the group?",
      confirmText: "Remove",
      type: "danger"
    });
    if (!confirmed) return;
    try {
      await socialApi.delete(`/groups/${selectedChat.id}/members/${memberId}`);
      await fetchGroupDetails(selectedChat.id);
      toast.success('Member removed');
    } catch (err) {
      console.error('Failed to remove member:', err);
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  useEffect(() => {
    if (selectedChat && selectedChat.type === 'group' && showGroupDetails) {
      fetchGroupDetails(selectedChat.id);
    } else {
      setGroupDetails(null);
      setShowGroupDetails(false);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat && selectedChat.type === 'group' && showGroupDetails) {
      fetchGroupDetails(selectedChat.id);
    }
  }, [showGroupDetails]);

  const socketRef = useRef(null);
  if (currentUserId && !socketRef.current) {
    socketRef.current = getSocialSocket(currentUserId);
  }
  const messagesEndRef = useRef(null);
  const selectedChatRef = useRef(null);
  const longPressTimer = useRef(null);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
    if (onToggleHeader) {
      onToggleHeader(!!selectedChat);
    }
  }, [selectedChat, onToggleHeader]);

  useEffect(() => {
    return () => {
      if (onToggleHeader) {
        onToggleHeader(false);
      }
    };
  }, [onToggleHeader]);

  const fetchData = async () => {
    const cachedFriends = useSocialFeedStore.getState().friends;
    const cachedGroups = useSocialGroupsStore.getState().groups;

    if (cachedFriends.length > 0 || cachedGroups.length > 0) {
      const friendsList = cachedFriends;
      const groupsList = cachedGroups;
      setContacts(friendsList);
      setGroups(groupsList);

      const initialLastMsgs = {};
      friendsList.forEach(friend => {
        if (friend.lastMessage) {
          initialLastMsgs[`direct-${friend.id}`] = friend.lastMessage;
        }
      });
      groupsList.forEach(group => {
        if (group.lastMessage) {
          initialLastMsgs[`group-${group.id}`] = group.lastMessage;
        }
      });
      setLastMessages(initialLastMsgs);
      setLoading(false);

      Promise.all([fetchStoreFriends(), fetchStoreGroups()]).then(() => {
        const freshFriends = useSocialFeedStore.getState().friends;
        const freshGroups = useSocialGroupsStore.getState().groups;
        setContacts(freshFriends);
        setGroups(freshGroups);
        const updatedMsgs = {};
        freshFriends.forEach(f => { if (f.lastMessage) updatedMsgs[`direct-${f.id}`] = f.lastMessage; });
        freshGroups.forEach(g => { if (g.lastMessage) updatedMsgs[`group-${g.id}`] = g.lastMessage; });
        setLastMessages(updatedMsgs);
      });
    } else {
      try {
        setLoading(true);
        await Promise.all([fetchStoreFriends(), fetchStoreGroups()]);
        const friendsList = useSocialFeedStore.getState().friends;
        const groupsList = useSocialGroupsStore.getState().groups;
        setContacts(friendsList);
        setGroups(groupsList);
        const initialLastMsgs = {};
        friendsList.forEach(friend => {
          if (friend.lastMessage) initialLastMsgs[`direct-${friend.id}`] = friend.lastMessage;
        });
        groupsList.forEach(group => {
          if (group.lastMessage) initialLastMsgs[`group-${group.id}`] = group.lastMessage;
        });
        setLastMessages(initialLastMsgs);
      } catch (err) {
        console.error('Failed to fetch chat data:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
    socketRef.current = getSocialSocket(currentUserId);

    return () => {
      setActiveChatUser(null);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!isMatrixActive || !matrixClient) return;

    const handleRoomTimeline = (event, room, toStartOfTimeline) => {
      if (toStartOfTimeline) return;
      if (event.getType() !== "m.room.message") return;

      const active = selectedChatRef.current;
      const senderId = getLocalIdFromMatrixUserId(event.getSender());
      const isFromMe = senderId === currentUserId;

      if (!isFromMe) {
        const isFromActiveUser = active && active.type === 'direct' && senderId === active.id;
        if (isFromActiveUser) {
          setMessages((prev) => {
            if (prev.some(m => m.id === event.getId())) return prev;
            return [...prev, formatMatrixEvent(event)];
          });
        }
      } else if (active && active.type === 'direct') {
        setMessages((prev) => {
          if (prev.some(m => m.id === event.getId())) return prev;
          return [...prev, formatMatrixEvent(event)];
        });
      }

      const formatted = formatMatrixEvent(event);
      setLastMessages((prev) => ({
        ...prev,
        [`direct-${senderId === currentUserId ? (active?.id || senderId) : senderId}`]: formatted
      }));
    };

    matrixClient.on("Room.timeline", handleRoomTimeline);

    return () => {
      matrixClient.removeListener("Room.timeline", handleRoomTimeline);
    };
  }, [isMatrixActive, matrixClient, currentUserId]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handleUserTyping = ({ senderId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [senderId]: isTyping
      }));
    };

    const handleMessagesRead = ({ readerId }) => {
      const active = selectedChatRef.current;
      if (active && active.type === 'direct' && active.id?.toString() === readerId?.toString()) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.receiverId?.toString() === readerId?.toString()
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            let parsed = {};
            try {
              parsed = JSON.parse(msg.content);
              if (typeof parsed !== 'object' || parsed === null) parsed = { text: msg.content };
            } catch (e) {
              parsed = { text: msg.content };
            }
            parsed.reactions = reactions;
            return { ...msg, content: JSON.stringify(parsed) };
          }
          return msg;
        })
      );
    };

    socketRef.current.on('userTyping', handleUserTyping);
    socketRef.current.on('messagesRead', handleMessagesRead);
    socketRef.current.on('messageReactionUpdated', handleReactionUpdated);

    const handleDirectMessage = (message) => {
      if (isMatrixActive) return;
      const active = selectedChatRef.current;
      const isSenderActive = active && active.type === 'direct' && message.senderId?.toString() === active.id?.toString();

      if (isSenderActive) {
        setMessages((prev) => [...prev, message]);
        clearUnreadForContact(message.senderId);
        socketRef.current?.emit('readReceipt', { senderId: message.senderId });
      }

      setLastMessages((prev) => ({
        ...prev,
        [`direct-${message.senderId}`]: message
      }));
    };

    const handleMessageSent = (savedMessage) => {
      if (isMatrixActive) return;
      setMessages((prev) => {
        const updated = [...prev];
        const lastOptimisticIdx = updated.map((m) => m.id).lastIndexOf(undefined);
        if (lastOptimisticIdx !== -1) {
          updated[lastOptimisticIdx] = savedMessage;
        }
        return updated;
      });

      setLastMessages((prev) => ({
        ...prev,
        [`direct-${savedMessage.receiverId}`]: savedMessage
      }));
    };

    const handleMessageError = ({ error }) => {
      if (isMatrixActive) return;
      console.error('Socket message error:', error);
      setMessages((prev) => prev.filter((m, i) => !(i === prev.length - 1 && !m.id)));
    };

    const handleGroupMessage = (msg) => {
      const active = selectedChatRef.current;
      if (active && active.type === 'group' && msg.groupId === active.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }

      setLastMessages((prev) => ({
        ...prev,
        [`group-${msg.groupId}`]: msg
      }));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted' }
            : msg
        )
      );
      setLastMessages((prev) => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key]?.id === messageId) {
            updated[key] = { ...updated[key], isDeleted: true, content: 'This message was deleted' };
          }
        }
        return updated;
      });
    };

    const handleGroupMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted' }
            : msg
        )
      );
      setLastMessages((prev) => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key]?.id === messageId) {
            updated[key] = { ...updated[key], isDeleted: true, content: 'This message was deleted' };
          }
        }
        return updated;
      });
    };

    socketRef.current.on('receiveMessage', handleDirectMessage);
    socketRef.current.on('messageSent', handleMessageSent);
    socketRef.current.on('messageError', handleMessageError);
    socketRef.current.on('receiveGroupMessage', handleGroupMessage);
    socketRef.current.on('messageDeleted', handleMessageDeleted);
    socketRef.current.on('groupMessageDeleted', handleGroupMessageDeleted);

    return () => {
      socketRef.current?.off('userTyping', handleUserTyping);
      socketRef.current?.off('messagesRead', handleMessagesRead);
      socketRef.current?.off('messageReactionUpdated', handleReactionUpdated);
      socketRef.current?.off('receiveMessage', handleDirectMessage);
      socketRef.current?.off('messageSent', handleMessageSent);
      socketRef.current?.off('messageError', handleMessageError);
      socketRef.current?.off('receiveGroupMessage', handleGroupMessage);
      socketRef.current?.off('messageDeleted', handleMessageDeleted);
      socketRef.current?.off('groupMessageDeleted', handleGroupMessageDeleted);
    };
  }, [currentUserId, isMatrixActive]);

  useEffect(() => {
    if (selectedContact) {
      navigate(`/dashboard/social/chats/${selectedContact.type || 'direct'}/${selectedContact.id}`);
      onClearSelectedContact();
    }
  }, [selectedContact]);

  const selectChat = (chat) => {
    setSelectedChat(chat);
    navigate(`/dashboard/social/chats/${chat.type}/${chat.id}`);
  };

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const subRoute = pathSegments[2];
    
    if (subRoute === 'chats') {
      const chatType = pathSegments[3];
      const chatIdStr = pathSegments[4];
      
      if (chatType && chatIdStr) {
        const chatId = parseInt(chatIdStr, 10);
        const list = chatType === 'direct' ? contacts : groups;
        const found = list.find(c => c.id?.toString() === chatId.toString());

        if (found) {
          setSelectedChat(prev => {
            if (prev && prev.id === chatId && prev.type === chatType && prev.name) {
              return prev;
            }
            return { ...found, type: chatType };
          });
          localStorage.setItem('social_selected_chat_contact', JSON.stringify({ id: chatId, type: chatType }));
        } else if (!selectedChat || selectedChat.id !== chatId || selectedChat.type !== chatType || !selectedChat.name) {
          if (!selectedChat || selectedChat.id !== chatId || selectedChat.type !== chatType) {
            setSelectedChat({ id: chatId, type: chatType, name: '' });
          }

          if (chatType === 'direct') {
            socialApi.get(`/users/profile/${chatId}`).then(res => {
              if (res.data) {
                const fetchedName = res.data.name || res.data.fullName || res.data.username || 'User';
                setSelectedChat(prev => (prev && prev.id === chatId ? {
                  ...prev,
                  ...res.data,
                  name: fetchedName,
                  profilePicture: res.data.profilePicture
                } : prev));
              }
            }).catch(() => {});
          } else if (chatType === 'group') {
            socialApi.get(`/groups/${chatId}`).then(res => {
              if (res.data) {
                setSelectedChat(prev => (prev && prev.id === chatId ? {
                  ...prev,
                  ...res.data,
                  name: res.data.name || 'Group'
                } : prev));
              }
            }).catch(() => {});
          }
        }
      } else {
        if (selectedChat) {
          setSelectedChat(null);
        }
      }
    }
  }, [location.pathname, contacts, groups]);

  useEffect(() => {
    if (!selectedChat) {
      setActiveChatUser(null);
      setMessages([]);
      return;
    }

    const loadChatHistory = async () => {
      if (isMatrixActive) {
        if (selectedChat.type === 'direct') {
          setActiveChatUser(selectedChat.id);
          clearUnreadForContact(selectedChat.id);
          try {
            const roomId = await getOrCreateMatrixRoom(selectedChat.id);
            if (roomId) {
              selectedChat.matrixRoomId = roomId;
              const room = matrixClient.getRoom(roomId);
              if (room) {
                const events = room.getLiveTimeline().getEvents()
                  .filter(e => e.getType() === "m.room.message");
                setMessages(events.map(formatMatrixEvent));
              } else {
                setMessages([]);
              }
            }
          } catch (e) {
            console.error("Failed to load Matrix chat history:", e);
            setMessages([]);
          }
        }
        return;
      }

      if (selectedChat.type === 'direct') {
        setActiveChatUser(selectedChat.id);
        clearUnreadForContact(selectedChat.id);
        socketRef.current?.emit('readReceipt', { senderId: selectedChat.id });
        try {
          const response = await socialApi.get(`/messages/${selectedChat.id}`);
          setMessages(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error(err);
          setMessages([]);
        }
      } else if (selectedChat.type === 'group') {
        setActiveChatUser(null);
        try {
          if (socketRef.current) {
            socketRef.current.emit('joinGroup', selectedChat.id);
          }
          const response = await socialApi.get(`/groups/${selectedChat.id}/messages`);
          setMessages(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error(err);
          setMessages([]);
        }
      }
    };

    loadChatHistory();
  }, [selectedChat, isMatrixActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedChat) return;
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();

    if (isMatrixActive) {
      if (selectedChat.type === 'direct') {
        const roomId = await getOrCreateMatrixRoom(selectedChat.id);
        if (roomId) {
          try {
            const content = {
              msgtype: "m.text",
              body: textToSend,
            };
            await matrixClient.sendMessage(roomId, content);
            
            const newMessage = {
              senderId: currentUserId,
              receiverId: selectedChat.id,
              content: textToSend,
              createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, newMessage]);
            setLastMessages((prev) => ({
              ...prev,
              [`direct-${selectedChat.id}`]: newMessage
            }));
          } catch (e) {
            console.error("Failed to send Matrix message:", e);
          }
        }
      }
      setInputText('');
      return;
    }

    if (selectedChat.type === 'direct') {
      const contentPayload = replyingTo
        ? JSON.stringify({ text: textToSend, replyTo: { id: replyingTo.id, senderId: replyingTo.senderId, text: parseMessageContent(replyingTo).text } })
        : textToSend;
      const newMessage = {
        senderId: currentUserId,
        receiverId: selectedChat.id,
        content: contentPayload,
        createdAt: new Date().toISOString(),
      };

      socketRef.current?.emit('sendMessage', {
        receiverId: selectedChat.id.toString(),
        message: newMessage,
      });

      setMessages((prev) => [...prev, newMessage]);
      setLastMessages((prev) => ({
        ...prev,
        [`direct-${selectedChat.id}`]: newMessage
      }));
    } else if (selectedChat.type === 'group') {
      try {
        const groupContent = replyingTo
          ? JSON.stringify({ text: textToSend, replyTo: { id: replyingTo.id, senderId: replyingTo.senderId, text: parseMessageContent(replyingTo).text } })
          : textToSend;
        const response = await socialApi.post(`/groups/${selectedChat.id}/messages`, {
          content: groupContent,
        });
        const savedMessage = response.data;
        
        if (socketRef.current) {
          socketRef.current.emit('sendGroupMessage', savedMessage);
        }

        setMessages((prev) => [...prev, savedMessage]);
        setLastMessages((prev) => ({
          ...prev,
          [`group-${selectedChat.id}`]: savedMessage
        }));
      } catch (err) {
        console.error(err);
      }
    }
    if (socketRef.current && selectedChat && selectedChat.type === 'direct') {
      socketRef.current.emit('typing', { targetId: selectedChat.id, isTyping: false });
    }
    setReplyingTo(null);
    setInputText('');
  };

  const handleDeleteMessage = async (msg) => {
    if (!msg.id) return;
    const confirmed = await confirm({
      title: "Delete Message?",
      message: "Are you sure you want to delete this message? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });
    if (!confirmed) return;
    try {
      if (selectedChat.type === 'direct') {
        await socialApi.delete(`/messages/${msg.id}`);
        
        if (socketRef.current) {
          const receiverId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
          socketRef.current.emit('deleteMessage', {
            messageId: msg.id,
            receiverId: receiverId
          });
        }
      } else if (selectedChat.type === 'group') {
        await socialApi.delete(`/groups/${selectedChat.id}/messages/${msg.id}`);
        
        if (socketRef.current) {
          socketRef.current.emit('deleteGroupMessage', {
            messageId: msg.id,
            groupId: selectedChat.id
          });
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        )
      );
      
      setLastMessages((prev) => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key]?.id === msg.id) {
            updated[key] = { ...updated[key], isDeleted: true, content: 'This message was deleted' };
          }
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
      toast.error(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleStartPress = (e, msg) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      setActiveMenuMessage(msg);
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 500);
  };

  const handleEndPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleCancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupData.name.trim()) return;

    try {
      const response = await socialApi.post('/groups', {
        name: newGroupData.name,
        description: newGroupData.description,
        isPrivate: newGroupData.isPrivate,
        entryKey: newGroupData.isPrivate ? newGroupData.entryKey : null,
      });

      const created = response.data;
      setShowCreateGroupModal(false);
      setNewGroupData({ name: '', description: '', isPrivate: false, entryKey: '' });
      await fetchData();
      navigate(`/dashboard/social/chats/group/${created.id}`);
      toast.success('Group created!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (group, keyToUse = '') => {
    try {
      await socialApi.post('/groups/join', {
        groupId: group.id,
        entryKey: keyToUse,
      });

      setShowJoinGroupModal(null);
      setJoinKey('');
      await fetchData();
      navigate(`/dashboard/social/chats/group/${group.id}`);
      toast.success('Joined group!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to join group');
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
      navigate('/dashboard/social/chats');
      await fetchData();
      toast.success('Left group');
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getGroupInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'GP';
  };

  // Filter and search active chats
  const activeConversations = [];
  
  if (activeFilter === 'all' || activeFilter === 'direct') {
    contacts.forEach(contact => {
      activeConversations.push({
        ...contact,
        type: 'direct',
        isOnline: onlineUserIds.some(id => id.toString() === contact.id.toString()),
        unreadCount: unreadByContact[contact.id] || 0,
        lastMessage: lastMessages[`direct-${contact.id}`] || null
      });
    });
  }

  if (activeFilter === 'all' || activeFilter === 'groups') {
    groups.filter(g => g.isJoined).forEach(group => {
      activeConversations.push({
        ...group,
        type: 'group',
        unreadCount: 0,
        lastMessage: lastMessages[`group-${group.id}`] || null
      });
    });
  }

  activeConversations.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const filteredConversations = activeConversations.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    localStorage.removeItem('social_selected_chat_contact');
    if (onClearSelectedContact) {
      onClearSelectedContact();
    }
    navigate('/dashboard/social/chats');
  };

  const chatTouchStartRef = useRef({ x: 0, y: 0, time: 0, target: null });

  const handleChatTouchStart = (e) => {
    const touch = e.touches[0];
    chatTouchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      target: e.target,
    };
  };

  const handleChatTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - chatTouchStartRef.current.x;
    const deltaY = touch.clientY - chatTouchStartRef.current.y;
    const deltaTime = Date.now() - chatTouchStartRef.current.time;

    if (deltaTime > 650) return;

    if (deltaX > 60 && Math.abs(deltaY) < 65 && deltaX > Math.abs(deltaY) * 1.3) {
      const target = chatTouchStartRef.current.target;
      if (target && target.closest('input, textarea, button, audio, video, select, .no-swipe, [contenteditable="true"]')) return;
      handleBack();
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-900 md:rounded-3xl md:border md:border-gray-200/80 dark:md:border-gray-800 md:shadow-lg overflow-hidden flex flex-1 w-full h-full min-h-0"
    >
      {/* ── LEFT SIDEBAR: CONVERSATION LIST ── */}
      <div 
        className={`${
          selectedChat ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3 flex-shrink-0">
          {/* Top Title Row + Compose Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Chats
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowNewDirectChatModal(true)}
                title="New Chat"
                className="w-10 h-10 rounded-2xl bg-[#FF5722] hover:bg-[#F4511E] text-white flex items-center justify-center transition-all cursor-pointer shadow-sm shadow-orange-500/20 active:scale-95 shrink-0"
              >
                <SquarePen size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-1">
            {[
              { id: 'all', name: 'All' },
              { id: 'direct', name: 'Direct' },
              { id: 'groups', name: 'Groups' }
            ].map(filter => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                    isActive 
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF5722] border border-orange-200/80 dark:border-orange-800/60 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {filter.name}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search chat or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/60 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition text-gray-900 dark:text-white placeholder-gray-400 font-medium"
            />
          </div>
        </div>

        {/* Sidebar list items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-xs text-gray-400 gap-2 font-medium">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FF5722] border-t-transparent"></div>
              <span>Syncing chats...</span>
            </div>
          ) : (
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-semibold leading-relaxed">
                No active conversations found.<br />Tap the top-right button to start chatting!
              </div>
            ) : (
              filteredConversations.map(chat => {
                const isSelected = selectedChat && selectedChat.type === chat.type && selectedChat.id === chat.id;
                const initials = chat.type === 'group' ? getGroupInitials(chat.name) : '';
                const lastMsg = chat.lastMessage;
                const formattedTime = lastMsg ? formatConversationTime(lastMsg.createdAt) : '';
                const isOnline = chat.type === 'direct' && onlineUserIds.some(id => id.toString() === chat.id.toString());
                const isTyping = chat.type === 'direct' && typingUsers[chat.id];

                return (
                  <div
                    key={`${chat.type}_${chat.id}`}
                    onClick={() => selectChat(chat)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition select-none ${
                      isSelected 
                        ? 'bg-[#FFF7F2] dark:bg-gray-800/90 border-l-4 border-[#FF5722] shadow-xs' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {chat.type === 'direct' ? (
                        <UserAvatar 
                          src={chat.profilePicture} 
                          name={chat.name} 
                          className="w-12 h-12 rounded-full border border-gray-100 dark:border-gray-700" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-tr from-teal-500 to-emerald-500 shadow-xs text-sm">
                          {initials}
                        </div>
                      )}
                      {chat.type === 'direct' && isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {chat.name}
                        </h4>
                        {formattedTime && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium shrink-0 ml-1">
                            {formattedTime}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-normal">
                          {isTyping ? (
                            <span className="text-emerald-500 font-semibold animate-pulse">typing...</span>
                          ) : lastMsg ? (
                            (lastMsg.senderId === currentUserId ? 'You: ' : '') + (parseMessageContent(lastMsg).text || 'Message')
                          ) : (
                            chat.type === 'group' ? 'Tap to open group' : 'Tap to start chatting'
                          )}
                        </p>
                        
                        {chat.unreadCount > 0 && (
                          <span className="bg-[#FF5722] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center shadow-xs">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: ACTIVE CONVERSATION WINDOW ── */}
      <div 
        onTouchStart={handleChatTouchStart}
        onTouchEnd={handleChatTouchEnd}
        className={`${
          selectedChat 
            ? 'flex fixed inset-0 z-[70] md:static md:z-auto w-full h-[100dvh] md:h-full' 
            : 'hidden md:flex'
        } flex-1 flex-row h-full min-h-0 bg-[#FAF7F2]/40 dark:bg-gray-900 relative`}
      >
        {selectedChat ? (
          <>
            <div className="flex-1 flex flex-col h-full min-h-0 relative">
              {/* Active Conversation Header */}
              <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
                <div 
                  onClick={() => {
                    if (selectedChat.type === 'group') {
                      setShowGroupDetails(true);
                    } else if (selectedChat.type === 'direct' && selectedChat.id) {
                      if (onViewProfile) {
                        onViewProfile(selectedChat.id);
                      }
                    }
                  }}
                  className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
                >
                  {/* Mobile Back Arrow Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBack();
                    }}
                    className="md:hidden p-1.5 -ml-1 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition cursor-pointer shrink-0"
                    aria-label="Back to chats"
                  >
                    <ArrowLeft size={20} className="stroke-[2.25]" />
                  </button>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {selectedChat.type === 'direct' ? (
                      <UserAvatar 
                        src={selectedChat.profilePicture} 
                        name={selectedChat.name || 'User'} 
                        className="w-11 h-11 rounded-full border border-gray-100 dark:border-gray-700 shrink-0" 
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white bg-gradient-to-tr from-teal-500 to-emerald-500 shrink-0 shadow-xs">
                        {getGroupInitials(selectedChat.name || 'Group')}
                      </div>
                    )}
                    {selectedChat.type === 'direct' && onlineUserIds.some(id => id.toString() === selectedChat.id?.toString()) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                    )}
                  </div>

                  {/* Name & Status */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {selectedChat.name || (selectedChat.type === 'direct' ? 'Friend' : 'Group')}
                      </h3>
                      {selectedChat.type === 'group' && (
                        selectedChat.isPrivate ? (
                          <span className="flex items-center gap-0.5 text-[9px] text-red-500 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md font-bold uppercase">
                            <Lock size={8} /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md font-bold uppercase">
                            <Unlock size={8} /> Public
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mt-0.5 truncate">
                      {selectedChat.type === 'direct' ? (
                        typingUsers[selectedChat.id] ? (
                          <span className="text-emerald-500 font-semibold animate-pulse">typing...</span>
                        ) : onlineUserIds.some(id => id.toString() === selectedChat.id?.toString()) ? (
                          <span className="flex items-center gap-1 text-emerald-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">Offline</span>
                        )
                      ) : (
                        <span className="text-gray-400 font-medium truncate">
                          {selectedChat.description || 'Tap for group info'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Right Actions */}
                <div className="flex items-center gap-1">
                  {selectedChat.type === 'group' && (
                    <>
                      {selectedChat.entryKey && (
                        <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-xl">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Key:</span>
                          <code className="text-xs font-mono font-bold text-[#FF5722]">{selectedChat.entryKey}</code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedChat.entryKey)}
                            className="text-gray-400 hover:text-[#FF5722] transition flex items-center cursor-pointer"
                            title="Copy Entry Key"
                          >
                            {copiedKey ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleLeaveGroup(selectedChat.id)}
                        title="Leave Group"
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer"
                      >
                        <LogOut size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    type="button"
                    onClick={() => {
                      if (selectedChat.type === 'group') {
                        setShowGroupDetails(true);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl transition cursor-pointer"
                    title={selectedChat.type === 'group' ? "Group Info" : "Options"}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Message Stream Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]/60 dark:bg-gray-950/60 relative"
              >
                {messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUserId;
                  const senderName = msg.sender?.name || '';
                  const senderPic = msg.sender?.profilePicture || '/default-avatar.png';
                  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  const parsed = parseMessageContent(msg);
                  const reactions = parsed.reactions || {};
                  const reactionEntries = Object.entries(reactions);

                  // Date Separator logic
                  const currentDateLabel = getMessageDateLabel(msg.createdAt);
                  const prevDateLabel = index > 0 ? getMessageDateLabel(messages[index - 1].createdAt) : null;
                  const showDateSeparator = currentDateLabel && currentDateLabel !== prevDateLabel;

                  // Swipe-to-reply state
                  const sw = swipeState[index] || { x: 0, triggered: false };
                  const swipeX = isMine
                    ? Math.min(0, Math.max(-(SWIPE_THRESHOLD + 10), sw.x))
                    : Math.max(0, Math.min(SWIPE_THRESHOLD + 10, sw.x));
                  const showReplyArrow = Math.abs(swipeX) > 15;

                  return (
                    <div key={msg.id || index} className="flex flex-col gap-3">
                      {/* Date Separator Pill */}
                      {showDateSeparator && (
                        <div className="flex justify-center my-2">
                          <div className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3.5 py-1 rounded-full text-[11px] font-bold shadow-xs border border-gray-100 dark:border-gray-700/80 select-none">
                            {currentDateLabel}
                          </div>
                        </div>
                      )}

                      <div
                        className={`group flex items-start max-w-[85%] md:max-w-[72%] ${isMine ? 'ml-auto justify-end' : 'mr-auto justify-start'} relative overflow-hidden`}
                        onTouchStart={(e) => {
                          if (msg.isDeleted) return;
                          setSwipeState(prev => ({ ...prev, [index]: { startX: e.touches[0].clientX, x: 0, triggered: false } }));
                        }}
                        onTouchMove={(e) => {
                          const state = swipeState[index];
                          if (!state || state.triggered) return;
                          const dx = e.touches[0].clientX - state.startX;
                          const clamped = isMine
                            ? Math.max(-(SWIPE_THRESHOLD + 10), Math.min(0, dx))
                            : Math.min(SWIPE_THRESHOLD + 10, Math.max(0, dx));
                          if (Math.abs(clamped) >= SWIPE_THRESHOLD) {
                            setReplyingTo(msg);
                            setSwipeState(prev => ({ ...prev, [index]: { x: 0, triggered: true } }));
                          } else {
                            setSwipeState(prev => ({ ...prev, [index]: { ...prev[index], x: clamped } }));
                          }
                        }}
                        onTouchEnd={() => {
                          setSwipeState(prev => ({ ...prev, [index]: { x: 0, triggered: false } }));
                        }}
                      >
                        {/* Reply swipe indicator */}
                        {showReplyArrow && (
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 pointer-events-none z-10 ${isMine ? 'right-0' : 'left-0'}`}
                            style={{ opacity: Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD) }}
                          >
                            <CornerUpLeft size={12} className={`text-[#FF5722] ${isMine ? 'scale-x-[-1]' : ''}`} />
                          </div>
                        )}

                        {/* Sliding wrapper */}
                        <div
                          className={`flex items-start gap-2 w-full ${isMine ? 'flex-row-reverse' : ''}`}
                          style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s ease' : 'none' }}
                        >
                          {/* Avatar for group messages or incoming */}
                          {!isMine && (
                            <UserAvatar
                              src={selectedChat.type === 'group' ? senderPic : selectedChat.profilePicture}
                              name={selectedChat.type === 'group' ? senderName : selectedChat.name}
                              className="w-8 h-8 rounded-full shrink-0 mt-0.5"
                              textClassName="text-xs font-bold"
                            />
                          )}

                          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            {/* Sender name for group messages */}
                            {selectedChat.type === 'group' && !isMine && (
                              <span
                                onClick={() => onViewProfile && onViewProfile(msg.senderId)}
                                className="text-[10px] font-bold text-[#FF5722] ml-1 mb-0.5 cursor-pointer hover:underline"
                              >
                                {senderName}
                              </span>
                            )}

                            {/* Message bubble */}
                            <div
                              className={`rounded-2xl px-4 py-2.5 shadow-xs text-sm relative select-none cursor-pointer transition-transform duration-100 ${
                                isMine
                                  ? 'bg-[#FFEADB] text-gray-900 dark:bg-orange-950/70 dark:text-orange-50 rounded-tr-xs border border-orange-200/50 dark:border-orange-800/40'
                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-xs border border-gray-100/90 dark:border-gray-700/80'
                              }`}
                              onMouseDown={(e) => !msg.isDeleted && handleStartPress(e, msg)}
                              onMouseUp={handleEndPress}
                              onMouseLeave={handleCancelPress}
                              onTouchStart={(e) => !msg.isDeleted && handleStartPress(e, msg)}
                              onTouchEnd={handleEndPress}
                              onTouchMove={handleCancelPress}
                              onContextMenu={(e) => {
                                if (!msg.isDeleted) { e.preventDefault(); setActiveMenuMessage(msg); }
                              }}
                              title={!msg.isDeleted ? 'Long press for options' : undefined}
                            >
                              {/* Reply quote strip */}
                              {!msg.isDeleted && parsed.replyTo && (
                                <div className={`mb-2 pl-2.5 pr-2 py-1 rounded-lg border-l-3 ${
                                  isMine ? 'border-[#FF5722] bg-white/60 dark:bg-black/20' : 'border-[#FF5722] bg-orange-50 dark:bg-orange-950/20'
                                }`}>
                                  <p className="text-[9px] font-bold text-[#FF5722] mb-0.5">
                                    {parsed.replyTo.senderId === currentUserId ? 'You' : contacts.find(c => c.id?.toString() === parsed.replyTo.senderId?.toString())?.name || 'User'}
                                  </p>
                                  <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate font-medium">
                                    {parsed.replyTo.text || 'Message'}
                                  </p>
                                </div>
                              )}

                              {/* Message text */}
                              {msg.isDeleted ? (
                                <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 italic text-xs py-0.5">
                                  <span>This message was deleted</span>
                                </div>
                              ) : (
                                <p className="break-words font-normal text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                  {parsed?.text || msg.content}
                                </p>
                              )}

                              {/* Timestamp & read receipts */}
                              <div className={`flex items-center gap-1 justify-end mt-1 text-[9px] font-medium ${
                                isMine ? 'text-[#FF5722]/80 dark:text-orange-300/80' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                <span>{formattedTime}</span>
                                {isMine && !msg.isDeleted && (
                                  <CheckCheck size={13} className="text-[#FF5722]" />
                                )}
                              </div>
                            </div>

                            {/* Reaction capsules */}
                            {reactionEntries.length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                {reactionEntries.map(([emoji, users]) => {
                                  const count = Array.isArray(users) ? users.length : 0;
                                  const reacted = Array.isArray(users) && users.includes(currentUserId?.toString());
                                  return (
                                    <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)}
                                      className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                                        reacted
                                          ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-400 text-[#FF5722]'
                                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                      }`}>
                                      <span>{emoji}</span>
                                      {count > 0 && <span className="text-[9px]">{count}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-transparent">
                    <div className="w-14 h-14 bg-white dark:bg-gray-800 border border-orange-100 dark:border-gray-700 rounded-2xl flex items-center justify-center text-[#FF5722] mb-3 shadow-sm">
                      <MessageSquare size={24} />
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">
                      Start your conversation with {selectedChat.name || 'this contact'}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed font-medium">
                      Say hello to start discussing topics, study materials, and shared notes!
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Bar */}
              {selectedChat.type === 'group' && selectedChat.onlyAdminsCanPost && selectedChat.creatorId !== currentUserId ? (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-center text-xs font-bold text-gray-400 select-none">
                  Only admins can send messages in this group
                </div>
              ) : (
                <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col flex-shrink-0 z-10 p-3 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                  {/* Reply Banner */}
                  {replyingTo && (
                    <div className="mx-1 mb-2 p-2.5 bg-[#FFF7F2] dark:bg-orange-950/20 border-l-3 border-[#FF5722] rounded-xl flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#FF5722] mb-0.5">
                          Replying to {replyingTo.senderId === currentUserId ? 'yourself' : contacts.find(c => c.id?.toString() === replyingTo.senderId?.toString())?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium">
                          {parseMessageContent(replyingTo).text || 'Message'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-gray-400 hover:text-red-500 transition cursor-pointer shrink-0 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Input Form */}
                  <form 
                    onSubmit={handleSendMessage} 
                    className="flex items-center gap-2.5"
                  >
                    <div className="flex-1 flex items-center bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-300 transition-all shadow-xs">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          if (socketRef.current && selectedChat && selectedChat.type === 'direct') {
                            socketRef.current.emit('typing', { targetId: selectedChat.id, isTyping: e.target.value.length > 0 });
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent text-gray-900 dark:text-white border-none py-2 text-xs sm:text-sm font-medium focus:outline-none placeholder-gray-400"
                      />
                    </div>

                    {/* Circular Orange Send Button */}
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="w-11 h-11 rounded-full bg-[#FF5722] hover:bg-[#F4511E] disabled:opacity-40 disabled:hover:bg-[#FF5722] text-white flex items-center justify-center transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer shrink-0"
                      title="Send message"
                    >
                      <Send size={18} className="translate-x-0.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Group Details Sliding Panel */}
            {showGroupDetails && (
              <div className="w-full md:w-[320px] lg:w-[350px] shrink-0 h-full bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 flex flex-col z-20 absolute md:static inset-y-0 right-0 shadow-xl md:shadow-none animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Group Info</h3>
                  <button 
                    onClick={() => setShowGroupDetails(false)}
                    className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {loadingGroupDetails ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FF5722] border-t-transparent"></div>
                    <span className="text-xs font-bold">Loading group details...</span>
                  </div>
                ) : groupDetails ? (
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Main Info */}
                    <div className="flex flex-col items-center text-center gap-3 select-none">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl text-white bg-gradient-to-tr from-teal-500 to-emerald-500 shadow-sm">
                        {getGroupInitials(groupDetails.name)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{groupDetails.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Created on {new Date(groupDetails.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Description</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-normal leading-relaxed whitespace-pre-wrap">
                        {groupDetails.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Group Settings */}
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Group Settings</span>
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Only Admins Can Post</p>
                          <p className="text-[10px] text-gray-400 font-normal mt-0.5">
                            Restrict posting to the group creator.
                          </p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={groupDetails.onlyAdminsCanPost}
                          disabled={groupDetails.creatorId !== currentUserId}
                          onChange={(e) => handleToggleOnlyAdminsPost(e.target.checked)}
                          className="w-4 h-4 accent-[#FF5722] cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center select-none">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Members ({groupDetails.members.length})
                        </span>
                        {groupDetails.creatorId === currentUserId && (
                          <button
                            onClick={() => setShowAddMemberModal(true)}
                            className="flex items-center gap-1 text-[10px] text-[#FF5722] hover:text-orange-600 font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            <Plus size={10} strokeWidth={3} /> Add Member
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {groupDetails.members.map((member) => {
                          const isMemberAdmin = member.userId === groupDetails.creatorId;
                          const isMe = member.userId === currentUserId;
                          const u = member.user;
                          if (!u) return null;
                          
                          return (
                            <div key={member.id} className="flex items-center justify-between gap-3 p-1.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                              <div 
                                onClick={() => {
                                  setShowGroupDetails(false);
                                  onViewProfile(u.id);
                                }}
                                className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 hover:opacity-85"
                              >
                                <UserAvatar 
                                  src={u.profilePicture} 
                                  name={u.name} 
                                  className="w-8 h-8 rounded-full shrink-0" 
                                  textClassName="text-xs font-bold"
                                />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block">
                                    {u.name} {isMe && <span className="text-[#FF5722] font-semibold">(You)</span>}
                                  </span>
                                  {isMemberAdmin && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded mt-0.5 inline-block">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>

                              {groupDetails.creatorId === currentUserId && !isMemberAdmin && (
                                <button
                                  onClick={() => handleRemoveMember(u.id)}
                                  className="text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-950/25 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400 text-xs font-semibold">Failed to load group info.</div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Empty Chat Area Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF7F2] text-[#FF5722] flex items-center justify-center mb-4 border border-orange-100 shadow-xs">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Start Messaging</h3>
            <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed font-normal">
              Select a conversation from the sidebar or start a new chat with your friends!
            </p>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[1000] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-md w-full p-6 shadow-2xl"
            >
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Create Discussion Group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Group Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Study Group"
                    value={newGroupData.name}
                    onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Discussion about physics and chemistry"
                    value={newGroupData.description}
                    onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Privacy Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="privacy"
                        checked={!newGroupData.isPrivate}
                        onChange={() => setNewGroupData({ ...newGroupData, isPrivate: false })}
                        className="accent-[#FF5722]"
                      />
                      <Unlock size={14} className="text-emerald-500" /> Public
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="privacy"
                        checked={newGroupData.isPrivate}
                        onChange={() => setNewGroupData({ ...newGroupData, isPrivate: true })}
                        className="accent-[#FF5722]"
                      />
                      <Lock size={14} className="text-red-500" /> Private
                    </label>
                  </div>
                </div>

                {newGroupData.isPrivate && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Entry Key</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. PHY101"
                        value={newGroupData.entryKey}
                        onChange={(e) => setNewGroupData({ ...newGroupData, entryKey: e.target.value })}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-mono font-bold tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                          let key = '';
                          for (let i = 0; i < 6; i++) {
                            key += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setNewGroupData({ ...newGroupData, entryKey: key });
                        }}
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-2xl transition cursor-pointer"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#FF5722] hover:bg-[#F4511E] text-white font-bold text-sm rounded-2xl shadow-md transition cursor-pointer"
                  >
                    Create & Join
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Join Private Group Modal */}
      <AnimatePresence>
        {showJoinGroupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[1000] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl"
            >
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Lock size={18} className="text-red-500" />
                <span>Join Private Group</span>
              </h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed font-medium">
                The group <strong className="text-gray-700 dark:text-gray-200">"{showJoinGroupModal.name}"</strong> is private. Please enter the Entry Key to join.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleJoinGroup(showJoinGroupModal, joinKey);
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  required
                  placeholder="Enter Key"
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm text-center font-mono font-bold tracking-widest uppercase"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinGroupModal(null);
                      setJoinKey('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#FF5722] hover:bg-[#F4511E] text-white font-bold text-sm rounded-2xl shadow-md transition cursor-pointer"
                  >
                    Verify Key
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Start Direct Chat Modal */}
      <AnimatePresence>
        {showNewDirectChatModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[1000] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Start a Conversation</h3>
                <button 
                  onClick={() => {
                    setShowNewDirectChatModal(false);
                    setDirectChatSearch('');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Group Create option */}
              <button
                type="button"
                onClick={() => {
                  setShowNewDirectChatModal(false);
                  setShowCreateGroupModal(true);
                }}
                className="w-full mb-3 p-2.5 bg-orange-50 dark:bg-orange-950/30 text-[#FF5722] rounded-2xl flex items-center justify-center gap-2 font-bold text-xs hover:bg-orange-100 dark:hover:bg-orange-950/50 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Create New Group</span>
              </button>

              {contacts.length > 0 && (
                <div className="relative mb-3 shrink-0">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={directChatSearch}
                    onChange={(e) => setDirectChatSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/25 transition text-gray-950 dark:text-white placeholder-gray-400 font-medium"
                  />
                </div>
              )}

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-medium leading-relaxed">
                    You don't have any friends added yet.<br />Add friends from the Discover tab.
                  </p>
                ) : (() => {
                  const filtered = contacts.filter(friend =>
                    friend.name.toLowerCase().includes(directChatSearch.toLowerCase())
                  );
                  if (filtered.length === 0) {
                    return (
                      <p className="text-xs text-center text-gray-400 py-6 font-medium leading-relaxed">
                        No friends match your search.
                      </p>
                    );
                  }
                  return filtered.map(friend => (
                    <div
                      key={friend.id}
                      onClick={() => {
                        navigate(`/dashboard/social/chats/direct/${friend.id}`);
                        setShowNewDirectChatModal(false);
                        setDirectChatSearch('');
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition border border-transparent"
                    >
                      <UserAvatar 
                        src={friend.profilePicture} 
                        name={friend.name} 
                        className="w-9 h-9 rounded-full shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{friend.name}</h4>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {onlineUserIds.some(id => id.toString() === friend.id.toString()) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[1100] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Add Member</h3>
                <button 
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setInviteSearch('');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="relative mb-3 shrink-0">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/25 transition text-gray-950 dark:text-white placeholder-gray-400 font-medium"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {friendsToInvite.filter(friend => friend.name.toLowerCase().includes(inviteSearch.toLowerCase())).length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-medium leading-relaxed">
                    No friends available to add.
                  </p>
                ) : (
                  friendsToInvite
                    .filter(friend => friend.name.toLowerCase().includes(inviteSearch.toLowerCase()))
                    .map(friend => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/55 transition border border-transparent"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar 
                            src={friend.profilePicture} 
                            name={friend.name} 
                            className="w-8 h-8 rounded-full shrink-0" 
                          />
                          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{friend.name}</h4>
                        </div>
                        <button
                          onClick={() => {
                            handleAddMember(friend.id);
                            setShowAddMemberModal(false);
                            setInviteSearch('');
                          }}
                          className="bg-[#FF5722] hover:bg-[#F4511E] text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Options Action Drawer */}
      <AnimatePresence>
        {activeMenuMessage && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end md:items-center justify-center z-[2000]"
            onClick={() => setActiveMenuMessage(null)}
          >
            <motion.div 
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-gray-800 w-full md:w-[380px] rounded-t-3xl md:rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-gray-700 md:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4 md:hidden"></div>
              
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 select-none">
                Message Options
              </h5>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 mb-4 max-h-24 overflow-y-auto">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium break-words whitespace-pre-wrap leading-relaxed">
                  {parseMessageContent(activeMenuMessage).text || activeMenuMessage.content}
                </p>
              </div>

              {/* Quick Emoji Reactions */}
              {!activeMenuMessage.isDeleted && (
                <div className="flex justify-around items-center bg-gray-50 dark:bg-gray-900 rounded-2xl py-2 px-3 mb-3">
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => {
                    const reactions = parseMessageContent(activeMenuMessage).reactions || {};
                    const users = reactions[emoji];
                    const reacted = Array.isArray(users) && users.includes(currentUserId?.toString());
                    return (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleToggleReaction(activeMenuMessage.id, emoji);
                          setActiveMenuMessage(null);
                        }}
                        className={`text-2xl active:scale-75 transition-transform cursor-pointer rounded-full p-1 ${reacted ? 'bg-orange-100 dark:bg-orange-950/40' : 'hover:bg-gray-200 dark:hover:bg-gray-700/40'}`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                {/* Reply */}
                {!activeMenuMessage.isDeleted && (
                  <button
                    onClick={() => {
                      setReplyingTo(activeMenuMessage);
                      setActiveMenuMessage(null);
                    }}
                    className="w-full text-left py-2.5 px-4 rounded-xl text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-bold text-sm flex items-center gap-3 cursor-pointer"
                  >
                    <CornerUpLeft size={16} className="text-[#FF5722]" />
                    <span>Reply</span>
                  </button>
                )}

                {/* Copy Text */}
                {!activeMenuMessage.isDeleted && (
                  <button
                    onClick={() => {
                      const txt = parseMessageContent(activeMenuMessage).text || activeMenuMessage.content;
                      navigator.clipboard.writeText(txt);
                      setActiveMenuMessage(null);
                      setShowCopyToast(true);
                      setTimeout(() => setShowCopyToast(false), 2000);
                    }}
                    className="w-full text-left py-2.5 px-4 rounded-xl text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-bold text-sm flex items-center gap-3 cursor-pointer"
                  >
                    <Copy size={16} className="text-gray-400" />
                    <span>Copy Text</span>
                  </button>
                )}

                {/* Delete Message */}
                {activeMenuMessage.id && !activeMenuMessage.isDeleted && (
                  activeMenuMessage.senderId === currentUserId || 
                  (selectedChat.type === 'group' && selectedChat.creatorId === currentUserId)
                ) && (
                  <button
                    onClick={() => {
                      const msgToDelete = activeMenuMessage;
                      setActiveMenuMessage(null);
                      handleDeleteMessage(msgToDelete);
                    }}
                    className="w-full text-left py-2.5 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition font-bold text-sm flex items-center gap-3 cursor-pointer"
                  >
                    <Trash2 size={16} className="text-red-500" />
                    <span>Delete Message</span>
                  </button>
                )}

                {/* Cancel */}
                <button
                  onClick={() => setActiveMenuMessage(null)}
                  className="w-full text-center py-2.5 px-4 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition font-bold text-sm cursor-pointer mt-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Clipboard Copy Toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900/95 dark:bg-gray-800/95 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl border border-gray-700/30 z-[3000] select-none flex items-center gap-2"
          >
            <Check size={14} className="text-emerald-500" />
            <span>Message copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
