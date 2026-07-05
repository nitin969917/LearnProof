import { useState, useEffect, useRef } from 'react';
import { 
  Search, Lock, Unlock, Plus, Copy, Check, MessageSquare, 
  ArrowLeft, Send, LogOut, CheckCheck, MoreVertical, PlusCircle, UserPlus, Sparkles, X, Trash2, CornerUpLeft,
  Phone, Video as VideoIcon, Paperclip, Smile, Mic, Image, FileText, Play
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
import { getMatrixClient } from '../../../utils/matrixClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ChatsTab({ currentUserId, selectedContact, onClearSelectedContact, onToggleHeader, onViewProfile }) {
  const { confirm } = useModal();
  const { user, matrixClient } = useAuth();
  const navigate = useNavigate();
  const isMatrixActive = !!(user?.matrixCredentials && matrixClient);

  // Use shared Zustand stores for instant loading (no spinner on re-open)
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
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'direct', 'groups', 'discover'

  // Selected chat: can be { ...friend, type: 'direct' } or { ...group, type: 'group' }
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Last message previews
  const [lastMessages, setLastMessages] = useState({});

  // WhatsApp/Telegram features states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const quickEmojis = ['😀', '😂', '🔥', '👍', '❤️', '👏', '🎉', '🚀', '💡', '🤔'];

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingInterval = useRef(null);

  const [replyingTo, setReplyingTo] = useState(null);
  const [swipeState, setSwipeState] = useState({}); // { [msgIndex]: { x: number, triggered: bool } }
  const SWIPE_THRESHOLD = 60; // px to trigger reply

  const parseMessageContent = (msg) => {
    if (!msg || !msg.content) return { text: "" };
    try {
      const data = JSON.parse(msg.content);
      if (data && typeof data === 'object' && ('text' in data || 'replyTo' in data || 'reactions' in data)) {
        return data;
      }
    } catch (e) {}
    return {
      text: msg.content,
      isFile: msg.isFile,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
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

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size cannot exceed 2 MB");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      toast.success(`Attached ${file.name}`);
    }
  };

  const handleDownloadFile = (fileName) => {
    toast.success(`Downloading ${fileName}...`);
    const element = document.createElement("a");
    const file = new Blob(["Simulated content for " + fileName], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    toast.success("Recording voice note...");
    recordingInterval.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async (shouldSend = true) => {
    setIsRecording(false);
    clearInterval(recordingInterval.current);
    if (shouldSend && recordingSeconds > 0) {
      const voiceMessage = {
        senderId: currentUserId,
        receiverId: selectedChat.id,
        content: `🎙️ Voice Note (${recordingSeconds}s)`,
        isVoiceNote: true,
        duration: recordingSeconds,
        createdAt: new Date().toISOString(),
      };
      
      try {
        if (isMatrixActive) {
          const roomId = await getOrCreateMatrixRoom(selectedChat.id);
          if (roomId) {
            await matrixClient.sendMessage(roomId, {
              msgtype: "m.text",
              body: `🎙️ Voice Note (${recordingSeconds}s)`
            });
          }
        } else {
          socketRef.current?.emit('sendMessage', {
            receiverId: selectedChat.id.toString(),
            message: voiceMessage,
          });
        }
        setMessages((prev) => [...prev, voiceMessage]);
        toast.success("Voice note sent!");
      } catch (err) {
        console.error("Failed to send voice note:", err);
      }
    }
  };

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showJoinGroupModal, setShowJoinGroupModal] = useState(null); // stores group object
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
      
      // Calculate friends who are not already group members
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
      alert('Failed to update group settings');
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      await socialApi.post(`/groups/${selectedChat.id}/members`, {
        userId: friendId
      });
      await fetchGroupDetails(selectedChat.id);
    } catch (err) {
      console.error('Failed to add member:', err);
      alert(err.response?.data?.error || 'Failed to add member');
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
    } catch (err) {
      console.error('Failed to remove member:', err);
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  // Sync group details if open when selectedChat changes
  useEffect(() => {
    if (selectedChat && selectedChat.type === 'group' && showGroupDetails) {
      fetchGroupDetails(selectedChat.id);
    } else {
      setGroupDetails(null);
      setShowGroupDetails(false);
    }
  }, [selectedChat]);

  // Refetch group details if showGroupDetails is opened
  useEffect(() => {
    if (selectedChat && selectedChat.type === 'group' && showGroupDetails) {
      fetchGroupDetails(selectedChat.id);
    }
  }, [showGroupDetails]);

  const onlineUserIds = useSocialStatusStore((state) => state.onlineUserIds);
  const { unreadByContact, setActiveChatUser, clearUnreadForContact, incrementUnread } = useSocialMessageStore();

  const socketRef = useRef(null);
  if (currentUserId && !socketRef.current) {
    socketRef.current = getSocialSocket(currentUserId);
  }
  const messagesEndRef = useRef(null);
  const selectedChatRef = useRef(null);
  const longPressTimer = useRef(null);

  // Sync ref to avoid closure issues in socket callbacks
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

  // Fetch initial friendships and groups
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
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
        socketRef.current.off('messageSent');
        socketRef.current.off('messageError');
        socketRef.current.off('receiveGroupMessage');
        socketRef.current.off('incomingCall');
        socketRef.current.off('callAccepted');
        socketRef.current.off('callRejected');
      }
      setActiveChatUser(null);
    };
  }, [currentUserId]);

  // Set up Matrix event listeners
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
        } else {
          incrementUnread(senderId);
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

  // Set up socket listeners
  useEffect(() => {
    if (!socketRef.current) return;

    // Typing indicator
    const handleUserTyping = ({ senderId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [senderId]: isTyping
      }));
    };

    // Read status listener
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

    // Message reaction listener
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

    // Direct Messages (only if Matrix is not active)
    const handleDirectMessage = (message) => {
      if (isMatrixActive) return;
      const active = selectedChatRef.current;
      const isSenderActive = active && active.type === 'direct' && message.senderId?.toString() === active.id?.toString();

      if (isSenderActive) {
        setMessages((prev) => [...prev, message]);
        clearUnreadForContact(message.senderId);
        socketRef.current?.emit('readReceipt', { senderId: message.senderId });
        socialApi.get(`/messages/${message.senderId}`).catch(err => console.error(err));
      } else {
        incrementUnread(message.senderId);
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

    // Group Messages
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

    // Message Deletions
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

  // Sync if opened via shortcut from other tabs (Feed, Friends, etc.)
  useEffect(() => {
    if (selectedContact) {
      const found = contacts.find((c) => c.id === selectedContact.id) || selectedContact;
      setSelectedChat({ ...found, type: selectedContact.type || 'direct' });
      onClearSelectedContact();
    }
  }, [selectedContact, contacts]);

  // Handle conversation selection change
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

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Direct or Group Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedChat) return;
    if (!inputText.trim() && !selectedFile) return;

    if (selectedFile) {
      const fileMessage = {
        senderId: currentUserId,
        receiverId: selectedChat.id,
        content: `📎 Sent a file: ${selectedFile.name}`,
        isFile: true,
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        createdAt: new Date().toISOString(),
      };

      try {
        if (isMatrixActive) {
          const roomId = await getOrCreateMatrixRoom(selectedChat.id);
          if (roomId) {
            await matrixClient.sendMessage(roomId, {
              msgtype: "m.text",
              body: `📎 File: ${selectedFile.name}`
            });
          }
        } else {
          socketRef.current?.emit('sendMessage', {
            receiverId: selectedChat.id.toString(),
            message: fileMessage,
          });
        }
        setMessages((prev) => [...prev, fileMessage]);
        setSelectedFile(null);
        toast.success("File sent!");
      } catch (err) {
        console.error("Failed to send file:", err);
      }
      return;
    }

    if (isMatrixActive) {
      if (selectedChat.type === 'direct') {
        const roomId = await getOrCreateMatrixRoom(selectedChat.id);
        if (roomId) {
          try {
            const content = {
              msgtype: "m.text",
              body: inputText,
            };
            await matrixClient.sendMessage(roomId, content);
            
            const newMessage = {
              senderId: currentUserId,
              receiverId: selectedChat.id,
              content: inputText,
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
        ? JSON.stringify({ text: inputText, replyTo: { id: replyingTo.id, senderId: replyingTo.senderId, text: parseMessageContent(replyingTo).text } })
        : inputText;
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
          ? JSON.stringify({ text: inputText, replyTo: { id: replyingTo.id, senderId: replyingTo.senderId, text: parseMessageContent(replyingTo).text } })
          : inputText;
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

  // Delete message handler
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
        
        // Emit socket event to recipient so their UI updates
        if (socketRef.current) {
          const receiverId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
          socketRef.current.emit('deleteMessage', {
            messageId: msg.id,
            receiverId: receiverId
          });
        }
      } else if (selectedChat.type === 'group') {
        await socialApi.delete(`/groups/${selectedChat.id}/messages/${msg.id}`);
        
        // Emit socket event to group room
        if (socketRef.current) {
          socketRef.current.emit('deleteGroupMessage', {
            messageId: msg.id,
            groupId: selectedChat.id
          });
        }
      }

      // Update local state
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
      alert(err.response?.data?.error || 'Failed to delete message');
    }
  };

  // Long-press Touch/Mouse Handlers for Message selection
  const handleStartPress = (e, msg) => {
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    // Set a timer for 500ms to open the menu
    longPressTimer.current = setTimeout(() => {
      setActiveMenuMessage(msg);
      // Vibrate if supported
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

  // Group Management APIs
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
      await fetchData(); // refresh list
      setSelectedChat({ ...created, type: 'group' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to create group');
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
      await fetchData(); // refresh
      setSelectedChat({ ...group, type: 'group', isJoined: true });
    } catch (err) {
      console.error(err);
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
      setSelectedChat(null);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // UI Helpers
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

  // Sort by last message date, or secondary by name
  activeConversations.sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const filteredConversations = activeConversations.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Discover Groups (All public/private groups user hasn't joined)
  const discoverGroups = groups.filter(g => !g.isJoined);
  const filteredDiscoverGroups = discoverGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div 
      className="bg-white dark:bg-[#111b21] md:rounded-3xl md:border md:border-orange-100 dark:md:border-gray-700 md:shadow-xl overflow-hidden flex flex-1 w-full h-full min-h-0"
    >
      {/* ── SIDEBAR CONVERSATION LIST ── */}
      <div 
        className={`${
          selectedChat ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-[350px] lg:w-[380px] shrink-0 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-[#111b21]`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={22} className="text-orange-500" />
              <span>Chats</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowNewDirectChatModal(true)}
                title="New Direct Chat"
                className="p-2 text-gray-550 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
              >
                <UserPlus size={18} />
              </button>
              <button
                onClick={() => {
                  setNewGroupData({ name: '', description: '', isPrivate: false, entryKey: '' });
                  setShowCreateGroupModal(true);
                }}
                title="Create Group"
                className="p-2 text-gray-550 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer"
              >
                <PlusCircle size={18} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search chat or group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 transition text-gray-900 dark:text-[#e9edef] placeholder-gray-400 font-semibold"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            {[
              { id: 'all', name: 'All' },
              { id: 'direct', name: 'Direct' },
              { id: 'groups', name: 'Groups' }
            ].map(filter => {
              const isActive = activeFilter === filter.id;
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer shrink-0 border ${
                    isActive 
                      ? 'bg-orange-500 border-orange-500 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-orange-500/30'
                  }`}
                >
                  {Icon && <Icon size={12} />}
                  <span>{filter.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar list items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-sm text-gray-400 gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
              <span>Syncing chats...</span>
            </div>
          ) : (
            // Regular Chat Mode
            filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-bold leading-relaxed">
                No active chats found.<br />Start a new conversation with a friend!
              </div>
            ) : (
              filteredConversations.map(chat => {
                const isSelected = selectedChat && selectedChat.type === chat.type && selectedChat.id === chat.id;
                const initials = chat.type === 'group' ? getGroupInitials(chat.name) : '';
                const lastMsg = chat.lastMessage;
                const formattedTime = lastMsg 
                  ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={`${chat.type}-${chat.id}`}
                    onClick={() => setSelectedChat(chat)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition ${
                      isSelected
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/10'
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 select-none">
                      {chat.type === 'direct' ? (
                        <img 
                          src={chat.profilePicture || '/default-avatar.png'} 
                          alt={chat.name} 
                          className="w-11 h-11 rounded-full object-cover bg-gray-200 border border-gray-100 dark:border-gray-700" 
                        />
                      ) : (
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm text-white shadow-sm bg-gradient-to-tr ${
                          isSelected ? 'from-orange-600 to-amber-600 border border-orange-400' : 'from-emerald-400 to-teal-500'
                        }`}>
                          {initials}
                        </div>
                      )}
                      {chat.type === 'direct' && chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={`text-sm truncate ${isSelected ? 'font-black text-white' : 'font-extrabold text-gray-800 dark:text-gray-200'}`}>
                          {chat.name}
                        </span>
                        <span className={`text-[10px] shrink-0 ml-1 font-bold ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                          {formattedTime}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center gap-1">
                        <p className={`text-xs truncate flex-1 font-semibold ${isSelected ? 'text-white opacity-85' : 'text-gray-400 dark:text-gray-500'}`}>
                          {chat.type === 'direct' && typingUsers[chat.id] ? (
                            <span className={isSelected ? 'text-white italic animate-pulse font-bold' : 'text-green-500 italic animate-pulse font-bold'}>
                              typing...
                            </span>
                          ) : lastMsg ? (
                            <>
                              {chat.type === 'group' && lastMsg.sender?.name && (
                                <span className="font-bold text-gray-500 dark:text-gray-400 mr-1">
                                  {lastMsg.senderId === currentUserId ? 'You' : lastMsg.sender.name}:
                                </span>
                              )}
                              <span className={lastMsg.isDeleted ? 'italic text-gray-450 dark:text-gray-500' : ''}>
                                {lastMsg.isDeleted
                                  ? 'This message was deleted'
                                  : lastMsg.isFile
                                  ? '📎 ' + (lastMsg.fileName || 'File')
                                  : lastMsg.isVoiceNote
                                  ? '🎤 Voice message'
                                  : (() => {
                                      try {
                                        const p = JSON.parse(lastMsg.content);
                                        if (p && typeof p === 'object' && p.text !== undefined) return p.text;
                                      } catch (e) {}
                                      return lastMsg.content;
                                    })()
                                }
                              </span>
                            </>
                          ) : (
                            chat.type === 'group' ? 'Tap to start group chat' : 'No messages yet'
                          )}
                        </p>
                        
                        {/* Unread count */}
                        {chat.unreadCount > 0 && (
                          <span className={`text-[10px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center ${
                            isSelected ? 'bg-white text-orange-600' : 'bg-orange-500 text-white shadow shadow-orange-500/25'
                          }`}>
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

      {/* ── ACTIVE CONVERSATION WINDOW ── */}
      <div 
        className={`${
          selectedChat ? 'flex' : 'hidden md:flex'
        } flex-1 flex-row h-full min-h-0 bg-white dark:bg-[#111b21] relative`}
      >
        {selectedChat ? (
          <>
            <div className="flex-1 flex flex-col h-full min-h-0 relative border-r border-gray-100 dark:border-gray-700/50">
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-[#202c33] flex items-center justify-between flex-shrink-0 z-10">
                <div 
                  onClick={() => {
                    if (selectedChat.type === 'group') {
                      setShowGroupDetails(true);
                    }
                  }}
                  className={`flex items-center gap-3 min-w-0 ${selectedChat.type === 'group' ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
                >
                  {/* Mobile Back Arrow */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChat(null);
                    }}
                    className="md:hidden p-1.5 rounded-xl text-gray-550 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer mr-1"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  {/* Avatar */}
                  {selectedChat.type === 'direct' ? (
                    <img 
                      src={selectedChat.profilePicture || '/default-avatar.png'} 
                      alt={selectedChat.name} 
                      className="w-10 h-10 rounded-full object-cover shrink-0 bg-gray-200 border border-gray-200/50 dark:border-gray-700" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white bg-gradient-to-tr from-emerald-400 to-teal-500 shrink-0 shadow-sm">
                      {getGroupInitials(selectedChat.name)}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-gray-900 dark:text-white text-sm truncate">{selectedChat.name}</h3>
                      {selectedChat.type === 'group' && (
                        selectedChat.isPrivate ? (
                          <span className="flex items-center gap-0.5 text-[9px] text-red-500 bg-red-50 dark:bg-red-950/20 px-1 rounded-md font-black uppercase">
                            <Lock size={9} /> Private
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] text-green-500 bg-green-50 dark:bg-green-950/20 px-1 rounded-md font-black uppercase">
                            <Unlock size={9} /> Public
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-550 mt-0.5 truncate">
                      {selectedChat.type === 'direct' ? (
                        typingUsers[selectedChat.id] ? (
                          <span className="text-green-500 italic font-black animate-pulse">typing...</span>
                        ) : onlineUserIds.some(id => id.toString() === selectedChat.id.toString()) ? (
                          <span className="text-green-500">Active now</span>
                        ) : (
                          'Offline'
                        )
                      ) : (
                        selectedChat.description || 'Tap for group info'
                      )}
                    </p>
                  </div>
                </div>

                {/* Header Right Actions */}
                <div className="flex items-center gap-1">
                  {selectedChat.type === 'group' && (
                    <>
                      {selectedChat.entryKey && (
                        <div className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-[#111b21] border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-xl">
                          <span className="text-[9px] font-black text-gray-400 uppercase">Entry Key:</span>
                          <code className="text-xs font-mono font-bold text-orange-500">{selectedChat.entryKey}</code>
                          <button
                            onClick={() => copyToClipboard(selectedChat.entryKey)}
                            className="text-gray-400 hover:text-orange-500 transition flex items-center cursor-pointer"
                            title="Copy Entry Key"
                          >
                            {copiedKey ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleLeaveGroup(selectedChat.id)}
                        title="Leave Group"
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition cursor-pointer"
                      >
                        <LogOut size={18} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      if (selectedChat.type === 'group') {
                        setShowGroupDetails(true);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 rounded-xl transition cursor-pointer"
                    title={selectedChat.type === 'group' ? "Group Info" : "Menu"}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* WhatsApp Wallpaper Chat Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] dark:bg-[#0b141a] relative"
              >
                <div className="absolute inset-0 bg-black/[0.02] dark:bg-black/[0.15] pointer-events-none"></div>

                {messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUserId;
                  const senderName = msg.sender?.name || '';
                  const senderPic = msg.sender?.profilePicture || '/default-avatar.png';
                  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  // Parse JSON content (replies/reactions)
                  const parsed = parseMessageContent(msg);
                  const reactions = parsed.reactions || {};
                  const reactionEntries = Object.entries(reactions);

                  // Swipe-to-reply state
                  const sw = swipeState[index] || { x: 0, triggered: false };
                  const swipeX = isMine
                    ? Math.min(0, Math.max(-(SWIPE_THRESHOLD + 10), sw.x))
                    : Math.max(0, Math.min(SWIPE_THRESHOLD + 10, sw.x));
                  const showReplyArrow = Math.abs(swipeX) > 15;

                  return (
                    <div
                      key={index}
                      className={`group flex items-start max-w-[85%] md:max-w-[75%] ${isMine ? 'ml-auto justify-end' : 'mr-auto justify-start'} relative overflow-hidden`}
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
                      {/* Reply arrow indicator — fades in as user swipes */}
                      {showReplyArrow && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/50 border border-orange-300 dark:border-orange-700 pointer-events-none z-10 ${isMine ? 'right-0' : 'left-0'}`}
                          style={{ opacity: Math.min(1, Math.abs(swipeX) / SWIPE_THRESHOLD) }}
                        >
                          <CornerUpLeft size={12} className={`text-orange-500 ${isMine ? 'scale-x-[-1]' : ''}`} />
                        </div>
                      )}

                      {/* Sliding inner wrapper */}
                      <div
                        className={`flex items-start gap-2 w-full ${isMine ? 'flex-row-reverse' : ''}`}
                        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s ease' : 'none' }}
                      >
                        {/* Avatar for group messages */}
                        {selectedChat.type === 'group' && !isMine && (
                          <img
                            src={senderPic}
                            alt={senderName}
                            onClick={() => onViewProfile && onViewProfile(msg.senderId)}
                            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-gray-200 bg-white cursor-pointer hover:opacity-80"
                          />
                        )}

                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          {/* Sender name in group */}
                          {selectedChat.type === 'group' && !isMine && (
                            <span
                              onClick={() => onViewProfile && onViewProfile(msg.senderId)}
                              className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 ml-1.5 mb-0.5 cursor-pointer hover:underline"
                            >
                              {senderName}
                            </span>
                          )}

                          {/* Message bubble */}
                          <div
                            className={`rounded-2xl px-3.5 py-1.5 shadow-sm text-sm relative border border-transparent select-none cursor-pointer active:scale-[0.99] transition-transform duration-100 ${
                              isMine
                                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-[#e9edef] rounded-tr-none'
                                : 'bg-white dark:bg-[#202c33] text-gray-800 dark:text-[#e9edef] rounded-tl-none'
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
                            title={!msg.isDeleted ? 'Long press or right-click for options' : undefined}
                          >
                            {/* Reply quote strip */}
                            {!msg.isDeleted && parsed.replyTo && (
                              <div className={`mt-1 mb-1.5 pl-2.5 pr-2 py-1 rounded-lg border-l-4 ${
                                isMine ? 'border-green-600 bg-green-200/50 dark:bg-green-900/30' : 'border-orange-400 bg-orange-50 dark:bg-orange-950/20'
                              }`}>
                                <p className="text-[9px] font-black text-orange-500 dark:text-orange-400 mb-0.5">
                                  {parsed.replyTo.senderId === currentUserId ? 'You' : contacts.find(c => c.id?.toString() === parsed.replyTo.senderId?.toString())?.name || 'User'}
                                </p>
                                <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate leading-tight">
                                  {parsed.replyTo.text || '📎 Attachment'}
                                </p>
                              </div>
                            )}

                            {/* Message content */}
                            {msg.isDeleted ? (
                              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 italic pb-3 pr-8 select-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                <span>This message was deleted</span>
                              </div>
                            ) : msg.isVoiceNote ? (
                              <div className="flex items-center gap-3 pb-4 pr-8 w-52 sm:w-60 select-none">
                                <button type="button" onClick={() => toast.success('Playing voice note...')}
                                  className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow active:scale-95 transition-all cursor-pointer shrink-0">
                                  <Play size={12} className="fill-white ml-0.5" />
                                </button>
                                <div className="flex-1 space-y-1">
                                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full w-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-1/3 rounded-full"></div>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] font-black text-gray-400">
                                    <span>0:00 / 0:{msg.duration < 10 ? `0${msg.duration}` : msg.duration}</span>
                                  </div>
                                </div>
                              </div>
                            ) : msg.isFile ? (
                              <div onClick={() => handleDownloadFile(msg.fileName)}
                                className="flex items-center gap-3 pb-4 pr-8 select-none cursor-pointer hover:opacity-85 transition active:scale-95"
                                title="Click to download file">
                                <div className="p-2.5 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl shrink-0">
                                  <FileText size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-gray-900 dark:text-white leading-tight">{msg.fileName}</p>
                                  <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase">{msg.fileSize || 'Unknown Size'}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="break-words font-medium leading-relaxed pb-3 pr-8 whitespace-pre-wrap">{parsed.text || msg.content}</p>
                            )}

                            {/* Timestamp + read receipt */}
                            <div className="absolute bottom-1 right-2 flex items-center gap-1 select-none opacity-60">
                              <span className="text-[8px] font-bold">{formattedTime}</span>
                              {isMine && !msg.isDeleted && (
                                msg.isRead
                                  ? <CheckCheck size={12} className="text-blue-500" />
                                  : <Check size={12} className="text-gray-400" />
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
                                        ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-400 text-orange-700 dark:text-orange-300'
                                        : 'bg-white dark:bg-[#2a3942] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
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
                  );
                })}

                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-transparent">
                    <div className="w-14 h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-orange-100/50 dark:border-gray-700/50 rounded-2xl flex items-center justify-center text-orange-500 mb-3 shadow-md">
                      <MessageSquare size={24} />
                    </div>
                    <h4 className="font-black text-gray-800 dark:text-gray-200 text-sm mb-1">
                      Welcome to the Chat with {selectedChat.name}!
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-550 max-w-xs leading-relaxed font-bold">
                      This is the start of your message history. Say hello to start discussing!
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bottom Bar / Blocked message */}
              {selectedChat.type === 'group' && selectedChat.onlyAdminsCanPost && selectedChat.creatorId !== currentUserId ? (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-white dark:bg-[#182229] text-center text-xs font-black text-gray-550 dark:text-gray-400 select-none">
                  Only admins can send messages in this group
                </div>
              ) : (
                <div className="border-t border-gray-100 dark:border-gray-700/50 bg-white dark:bg-[#202c33] flex flex-col flex-shrink-0 z-10 p-2 md:p-3">
                  
                  {/* Selected File Preview */}
                  {selectedFile && (
                    <div className="mx-2 mb-2 p-2 bg-gray-50 dark:bg-[#111b21] border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-[#e9edef] font-bold">
                        <FileText size={14} className="text-orange-500" />
                        <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                        <span className="text-[10px] text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Reply Banner */}
                  {replyingTo && (
                    <div className="mx-2 mb-2 p-2.5 bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-400 rounded-xl flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-orange-500 dark:text-orange-400 mb-0.5">
                          Replying to {replyingTo.senderId === currentUserId ? 'yourself' : contacts.find(c => c.id?.toString() === replyingTo.senderId?.toString())?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-semibold">
                          {parseMessageContent(replyingTo).text || '📎 Attachment'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="text-gray-400 hover:text-red-500 transition cursor-pointer shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Emoji Quick Drawer */}
                  {showEmojiPicker && (
                    <div className="mx-2 mb-2 p-2 bg-white dark:bg-[#2a3942] border border-gray-150 dark:border-gray-700 rounded-xl flex items-center gap-2.5 flex-wrap shadow-lg animate-in slide-in-from-bottom-2 duration-200">
                      {quickEmojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="text-xl hover:scale-125 transition active:scale-95 p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <form 
                    onSubmit={handleSendMessage} 
                    className="flex items-center gap-2"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />

                    {/* Attachment button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach File"
                      className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer shrink-0"
                    >
                      <Paperclip size={18} />
                    </button>

                    {/* Emoji button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Choose Emoji"
                      className="p-2.5 text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer shrink-0"
                    >
                      <Smile size={18} />
                    </button>

                    {/* Input field or Recording indicator */}
                    {isRecording ? (
                      <div className="flex-1 bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-black animate-pulse select-none">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          Recording voice note...
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono">{recordingSeconds}s</span>
                          <button
                            type="button"
                            onClick={() => stopRecording(false)}
                            className="text-gray-450 hover:text-red-500 transition cursor-pointer font-bold px-1.5 py-0.5 rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          if (socketRef.current && selectedChat && selectedChat.type === 'direct') {
                            socketRef.current.emit('typing', { targetId: selectedChat.id, isTyping: e.target.value.length > 0 });
                          }
                        }}
                        placeholder="Type your message here..."
                        className="flex-1 bg-white dark:bg-[#2a3942] text-gray-900 dark:text-[#e9edef] border border-gray-250 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold transition"
                      />
                    )}

                    {/* Send or Voice Record Action Button */}
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={() => stopRecording(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold p-3 rounded-2xl transition flex items-center justify-center shadow-lg shadow-orange-500/15 cursor-pointer shrink-0"
                      >
                        <Send size={18} />
                      </button>
                    ) : (inputText.trim() || selectedFile) ? (
                      <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold p-3 rounded-2xl transition flex items-center justify-center shadow-lg shadow-orange-500/15 cursor-pointer shrink-0 animate-in zoom-in-50 duration-150"
                      >
                        <Send size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startRecording}
                        title="Record Voice Note"
                        className="p-3 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 rounded-2xl transition cursor-pointer shrink-0"
                      >
                        <Mic size={18} />
                      </button>
                    )}
                  </form>
                </div>
              )}
            </div>

            {/* Group Details Sliding Panel */}
            {showGroupDetails && (
              <div className="w-full md:w-[320px] lg:w-[350px] shrink-0 h-full bg-white dark:bg-[#111b21] border-l border-gray-100 dark:border-gray-700/50 flex flex-col z-20 absolute md:static inset-y-0 right-0 shadow-xl md:shadow-none animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-[#202c33] flex items-center justify-between flex-shrink-0">
                  <h3 className="font-black text-gray-900 dark:text-white text-base">Group Info</h3>
                  <button 
                    onClick={() => setShowGroupDetails(false)}
                    className="p-1 rounded-xl text-gray-550 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                {loadingGroupDetails ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400 gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                    <span className="text-xs font-bold">Syncing group details...</span>
                  </div>
                ) : groupDetails ? (
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Main Info */}
                    <div className="flex flex-col items-center text-center gap-3 select-none">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl text-white bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-md">
                        {getGroupInitials(groupDetails.name)}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white text-lg">{groupDetails.name}</h4>
                        <p className="text-xs text-gray-450 dark:text-gray-500 mt-1 font-bold">Created on {new Date(groupDetails.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 dark:bg-[#202c33] p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest block mb-1">Description</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-bold leading-relaxed whitespace-pre-wrap">
                        {groupDetails.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Group Settings */}
                    <div className="bg-gray-50 dark:bg-[#202c33] p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-3">
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest block">Group Settings</span>
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-800 dark:text-gray-200">Only Admins Can Send Messages</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5 leading-normal">
                            Restrict posting to the group creator.
                          </p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={groupDetails.onlyAdminsCanPost}
                          disabled={groupDetails.creatorId !== currentUserId}
                          onChange={(e) => handleToggleOnlyAdminsPost(e.target.checked)}
                          className="w-4.5 h-4.5 accent-orange-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center select-none">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-550 uppercase tracking-widest">
                          Members ({groupDetails.members.length})
                        </span>
                        {groupDetails.creatorId === currentUserId && (
                          <button
                            onClick={() => setShowAddMemberModal(true)}
                            className="flex items-center gap-1 text-[10px] text-orange-500 hover:text-orange-600 font-black uppercase tracking-wider bg-orange-50 dark:bg-orange-950/20 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            <Plus size={10} strokeWidth={3.5} /> Add Member
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5">
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
                                className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 hover:opacity-85"
                              >
                                <img 
                                  src={u.profilePicture || '/default-avatar.png'} 
                                  alt={u.name} 
                                  className="w-9 h-9 rounded-full object-cover bg-gray-200 border border-gray-155 dark:border-gray-700" 
                                />
                                <div className="min-w-0">
                                  <span className="text-xs font-black text-gray-850 dark:text-gray-200 truncate block">
                                    {u.name} {isMe && <span className="text-orange-500 font-bold">(You)</span>}
                                  </span>
                                  {isMemberAdmin && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black uppercase bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded mt-0.5 inline-block">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action */}
                              {groupDetails.creatorId === currentUserId && !isMemberAdmin && (
                                <button
                                  onClick={() => handleRemoveMember(u.id)}
                                  className="text-[10px] font-black text-red-500 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-950/25 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
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
                  <div className="p-8 text-center text-gray-400 text-xs font-bold">Failed to sync group information.</div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Empty Chat Area Placeholder */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/20 dark:bg-gray-900/10">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/5 text-orange-500 flex items-center justify-center mb-4 border border-orange-500/10">
              <MessageSquare size={28} className="animate-pulse" />
            </div>
            <h3 className="text-base font-black text-gray-800 dark:text-gray-200">Start Messaging</h3>
            <p className="text-xs text-gray-400 dark:text-gray-550 max-w-xs mt-1 leading-relaxed font-bold font-sans">
              Select a conversation from the sidebar, or search for public groups in the "Discover Groups" tab to join discussions.
            </p>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroupModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-md w-full p-6 shadow-2xl"
            >
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Create Discussion Group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Group Name</label>
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
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Discussion and tips about physics and chemistry"
                    value={newGroupData.description}
                    onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Privacy Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="privacy"
                        checked={!newGroupData.isPrivate}
                        onChange={() => setNewGroupData({ ...newGroupData, isPrivate: false })}
                        className="accent-orange-500"
                      />
                      <Unlock size={14} className="text-green-500" /> Public
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="privacy"
                        checked={newGroupData.isPrivate}
                        onChange={() => setNewGroupData({ ...newGroupData, isPrivate: true })}
                        className="accent-orange-500"
                      />
                      <Lock size={14} className="text-red-500" /> Private
                    </label>
                  </div>
                </div>

                {newGroupData.isPrivate && (
                  <div>
                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Entry Key</label>
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
                        className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-300 text-xs font-extrabold rounded-2xl transition cursor-pointer"
                      >
                        Generate Key
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroupModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-extrabold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/10 transition cursor-pointer"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
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
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed font-bold">
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
                    className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-extrabold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/10 transition cursor-pointer"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white">Start a Conversation</h3>
                <button 
                  onClick={() => {
                    setShowNewDirectChatModal(false);
                    setDirectChatSearch('');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 font-extrabold cursor-pointer"
                >
                  Close
                </button>
              </div>

              {contacts.length > 0 && (
                <div className="relative mb-3 shrink-0">
                  <Search className="absolute left-3 top-2.5 text-gray-450" size={14} />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={directChatSearch}
                    onChange={(e) => setDirectChatSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/25 transition text-gray-950 dark:text-[#e9edef] placeholder-gray-400 font-semibold"
                  />
                </div>
              )}

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {contacts.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-bold leading-relaxed">
                    You don't have any friends added yet.<br />Add friends from the Friends tab.
                  </p>
                ) : (() => {
                  const filtered = contacts.filter(friend =>
                    friend.name.toLowerCase().includes(directChatSearch.toLowerCase())
                  );
                  if (filtered.length === 0) {
                    return (
                      <p className="text-xs text-center text-gray-450 py-6 font-bold leading-relaxed">
                        No friends match your search.
                      </p>
                    );
                  }
                  return filtered.map(friend => (
                    <div
                      key={friend.id}
                      onClick={() => {
                        setSelectedChat({ ...friend, type: 'direct' });
                        setShowNewDirectChatModal(false);
                        setDirectChatSearch('');
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition border border-transparent"
                    >
                      <img 
                        src={friend.profilePicture || '/default-avatar.png'} 
                        alt={friend.name} 
                        className="w-9 h-9 rounded-full object-cover bg-gray-200 shrink-0 border border-gray-100 dark:border-gray-700" 
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 truncate">{friend.name}</h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-0.5">
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white">Add Member</h3>
                <button 
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setInviteSearch('');
                  }}
                  className="text-xs text-gray-400 hover:text-gray-650 font-extrabold cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Friend Search bar */}
              <div className="relative mb-3 shrink-0">
                <Search className="absolute left-3 top-2.5 text-gray-450" size={14} />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/25 transition text-gray-950 dark:text-[#e9edef] placeholder-gray-400 font-semibold"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1">
                {friendsToInvite.filter(friend => friend.name.toLowerCase().includes(inviteSearch.toLowerCase())).length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-bold leading-relaxed">
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
                          <img 
                            src={friend.profilePicture || '/default-avatar.png'} 
                            alt={friend.name} 
                            className="w-8 h-8 rounded-full object-cover bg-gray-200 shrink-0" 
                          />
                          <h4 className="text-xs font-extrabold text-gray-800 dark:text-gray-200 truncate">{friend.name}</h4>
                        </div>
                        <button
                          onClick={() => {
                            handleAddMember(friend.id);
                            setShowAddMemberModal(false);
                            setInviteSearch('');
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition shadow-md shadow-orange-500/10 cursor-pointer"
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

      {/* Message Options Action Drawer (Bottom sheet on mobile, Modal on desktop) */}
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
              className="bg-white dark:bg-[#222e35] w-full md:w-[380px] rounded-t-3xl md:rounded-3xl p-5 shadow-2xl border border-orange-100/10 dark:border-gray-800 md:mb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grab handle on mobile */}
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4 md:hidden"></div>
              
              <h5 className="text-[10px] font-black text-gray-400 dark:text-gray-555 uppercase tracking-widest mb-3 select-none">
                Message Options
              </h5>
              
              {/* Message Content Preview */}
              <div className="bg-gray-50 dark:bg-[#182229] p-3 rounded-2xl border border-gray-100 dark:border-gray-800/80 mb-4 max-h-24 overflow-y-auto">
                <p className="text-xs text-gray-600 dark:text-gray-300 font-semibold break-words whitespace-pre-wrap leading-relaxed">
                  {parseMessageContent(activeMenuMessage).text || activeMenuMessage.content}
                </p>
              </div>

              {/* Quick Emoji Reactions */}
              {!activeMenuMessage.isDeleted && (
                <div className="flex justify-around items-center bg-gray-50 dark:bg-[#182229] rounded-2xl py-2.5 px-3 mb-3">
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
                        className={`text-2xl active:scale-75 transition-transform cursor-pointer rounded-full p-1 ${reacted ? 'bg-orange-100 dark:bg-orange-900/40' : 'hover:bg-gray-200 dark:hover:bg-gray-700/40'}`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                {/* Reply Option */}
                {!activeMenuMessage.isDeleted && (
                  <button
                    onClick={() => {
                      setReplyingTo(activeMenuMessage);
                      setActiveMenuMessage(null);
                    }}
                    className="w-full text-left py-3 px-4 rounded-xl text-gray-800 dark:text-gray-250 hover:bg-gray-100 dark:hover:bg-[#2a3942] transition font-extrabold text-sm flex items-center gap-3 cursor-pointer"
                  >
                    <CornerUpLeft size={16} className="text-orange-500 dark:text-orange-400" />
                    <span>Reply</span>
                  </button>
                )}

                {/* Copy Text Option */}
                {!activeMenuMessage.isDeleted && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeMenuMessage.content);
                      setActiveMenuMessage(null);
                      setShowCopyToast(true);
                      setTimeout(() => setShowCopyToast(false), 2000);
                    }}
                    className="w-full text-left py-3 px-4 rounded-xl text-gray-800 dark:text-gray-250 hover:bg-gray-100 dark:hover:bg-[#2a3942] transition font-extrabold text-sm flex items-center gap-3 cursor-pointer"
                  >
                    <Copy size={16} className="text-gray-450 dark:text-gray-500" />
                    <span>Copy Text</span>
                  </button>
                )}

                {/* Delete Message Option */}
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
                    className="w-full text-left py-3 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition font-extrabold text-sm flex items-center gap-3 cursor-pointer"
                  >
                    <Trash2 size={16} className="text-red-500 dark:text-red-400" />
                    <span>Delete Message</span>
                  </button>
                )}

                {/* Cancel Option */}
                <button
                  onClick={() => setActiveMenuMessage(null)}
                  className="w-full text-center py-3 px-4 rounded-xl text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#182229] hover:bg-gray-100 dark:hover:bg-[#2a3942] transition font-extrabold text-sm cursor-pointer mt-1"
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
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900/95 dark:bg-gray-800/95 text-white text-xs font-extrabold px-4 py-2.5 rounded-full shadow-xl border border-gray-700/30 z-[3000] select-none flex items-center gap-2"
          >
            <Check size={14} className="text-green-500" />
            <span>Message copied to clipboard</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
