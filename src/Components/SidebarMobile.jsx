import React, { useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import MobileBottomNav from "./Utils/MobileBottomNav";
import { collection, onSnapshot, query, orderBy, where, doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, increment, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import ChatPreview from "./ChatPreview";

// ✅ Sound Effects
const playSound = (type = 'message') => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  const sounds = {
    message: [800, 1000, 1200],
    typing: [400, 600],
    delivered: [300, 500],
  };
  
  const playTone = (freqs) => {
    freqs.forEach((freq, i) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.start(audioCtx.currentTime + i * 0.05);
      oscillator.stop(audioCtx.currentTime + 0.2 + i * 0.05);
    });
  };
  
  playTone(sounds[type]);
};

// ✅ Typing indicator
const useTypingIndicator = (chatId, currentUserId) => {
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  useEffect(() => {
    if (!chatId) return;
    
    const typingRef = doc(db, "chats", chatId, "typing", "status");
    return onSnapshot(typingRef, (snap) => {
      const data = snap.data();
      setTypingUsers(new Set(data?.users || []));
    });
  }, [chatId]);
  
  const setTyping = useCallback((isTyping) => {
    if (!chatId || !currentUserId) return;
    
    const typingRef = doc(db, "chats", chatId, "typing", "status");
    updateDoc(typingRef, {
      users: isTyping 
        ? arrayUnion(currentUserId)
        : arrayRemove(currentUserId),
      updatedAt: serverTimestamp()
    });
  }, [chatId, currentUserId]);
  
  return { typingUsers, setTyping };
};

// ✅ Mark as read
const markAsRead = async (chatId, currentUserId) => {
  if (!chatId) return;
  
  try {
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
      [`unreadBy.${currentUserId}`]: deleteField(),
      readBy: arrayUnion(currentUserId),
      unreadCount: increment(-999)
    });
    playSound('delivered');
  } catch (error) {
    console.error('Failed to mark as read:', error);
  }
};

// ✅ ENHANCED HOOK WITH FULL WHATSAPP FEATURES
const useUsersWithSelfAndSorting = (rawUsers, currentUser, activeChatId, chatsMap) => {
  return useMemo(() => {
    if (!currentUser || !rawUsers.length) return [];

    let merged = [
      { 
        ...currentUser, 
        isSelf: true, 
        username: `${currentUser.username || "You"} `,
        lastMessageTime: null,
        lastMessage: "You",
        isOnline: false,
        messageStatus: 'sent',
        isTyping: false
      },
      ...rawUsers.filter(u => u.id !== currentUser.uid)
    ];

    merged = merged.map(user => {
      const chatInfo = chatsMap[user.id] || {};
      return {
        ...user,
        lastMessage: chatInfo.lastMessage || "Say hello 👋",
        lastMessageTime: chatInfo.lastMessageTime || null,
        unreadCount: chatInfo.unreadCount || 0,
        chatId: chatInfo.chatId || null,
        messageStatus: chatInfo.messageStatus || 'sent',
        isTyping: chatInfo.isTyping || false,
        isOnline: user.isOnline || false
      };
    });

    merged.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      
      const timeA = a.lastMessageTime ? a.lastMessageTime.toDate?.() || a.lastMessageTime : 0;
      const timeB = b.lastMessageTime ? b.lastMessageTime.toDate?.() || b.lastMessageTime : 0;
      
      return new Date(timeB) - new Date(timeA);
    });

    if (activeChatId) {
      const activeIndex = merged.findIndex(u => u.id === activeChatId && !u.isSelf);
      if (activeIndex > 1) {
        const activeUser = merged.splice(activeIndex, 1)[0];
        merged.splice(1, 0, activeUser);
      }
    }

    return merged;
  }, [rawUsers, currentUser, activeChatId, chatsMap]);
};

const SidebarMobile = ({
  mobileView,
  setMobileView,
  setActiveChatUser,
  setActiveChatId,
  currentUser = null,
  activeScreen,
  setActiveScreen,
  activeChatId,
  setProfileModalUser,
}) => {
  const [users, setUsers] = useState([]);
  const [chatsMap, setChatsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const prevChatsMapRef = useRef({});
  
  const { typingUsers } = useTypingIndicator(activeChatId, currentUser?.uid);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const qUsers = query(collection(db, "users"), orderBy("username"));
    const unsubUsers = onSnapshot(qUsers, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qChats = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubChats = onSnapshot(qChats, snap => {
      const newMap = {};
      const prevMap = prevChatsMapRef.current;

      snap.docs.forEach(d => {
        const data = d.data();
        const otherUserId = data.participants.find(uid => uid !== currentUser.uid);
        const chatId = d.id;
        
        const prevChatData = prevMap[otherUserId];
        const currentChatData = {
          lastMessage: data.lastMessage || "Say hello 👋",
          lastMessageTime: data.lastMessageTime || data.createdAt || null,
          unreadCount: data.unreadBy?.[currentUser.uid] ? data.unreadCount || 1 : 0,
          chatId,
          messageStatus: data.lastMessageStatus || 'sent',
          isTyping: data.typingUsers?.includes(otherUserId) || false,
        };

        newMap[otherUserId] = currentChatData;

        // ✅ Notification permission check from PrivacySettings
        const messageNotifications = currentUser?.messageNotifications !== false;
        if (messageNotifications && 
          currentChatData.unreadCount > 0 && 
          (!prevChatData || prevChatData.unreadCount === 0) &&
          !document.hidden &&
          otherUserId !== activeChatId
        ) {
          const senderUser = users.find(u => u.id === otherUserId);
          showNotification?.(
            `New message from ${senderUser?.username || "Family"}`,
            data.lastMessage || "New message",
            senderUser?.photoURL || null,
            `chat-${otherUserId}`
          );
          playSound('message');
        }
      });

      prevChatsMapRef.current = newMap;
      setChatsMap(newMap);
    });

    return () => {
      unsubUsers();
      unsubChats();
    };
  }, [currentUser, activeChatId, users]);

  useEffect(() => {
    if (activeChatId && currentUser) {
      const timer = setTimeout(() => {
        markAsRead(activeChatId, currentUser.uid);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeChatId, currentUser]);

  const sortedUsers = useUsersWithSelfAndSorting(
    users,
    currentUser,
    activeChatId,
    chatsMap
  );

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return sortedUsers;
    
    const queryLower = searchTerm.toLowerCase();
    return sortedUsers.filter((user) =>
      user.username?.toLowerCase().includes(queryLower)
    );
  }, [sortedUsers, searchTerm]);

  if (mobileView !== "chats") return null;

  return (
    <div className="sm:hidden flex flex-col h-screen bg-gray-900 text-white">
      {/* ✅ REMOVED Notification Permission Banner - Now in PrivacySettings */}

      {/* Search Bar */}
      <div className="sticky top-0 z-20 p-3 bg-gray-900 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Family chats..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 pl-10 pr-10 outline-none placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:bg-gray-700/50 transition-all"
          />
          {searchTerm && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-all"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </motion.button>
          )}
        </div>
      </div>

      {/* ✅ "NO RESULTS" UI - LIKE DESKTOP */}
      {searchTerm.trim() && filteredUsers.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-6 py-12 text-center text-gray-400">
          <div>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-1">No user found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        </div>
      )}

      {/* ✅ WHATSAPP CHAT LIST */}
      {!searchTerm.trim() || filteredUsers.length > 0 ? (
        <div className="flex-1 overflow-y-auto scrollbar-hide mb-44 px-3">
          <AnimatePresence>
            {filteredUsers.map((user) => {
              const chatInfo = chatsMap[user.id] || {};
              const isActive = activeChatId === user.id;
              const isSelf = user.isSelf;

              return (
                <ChatPreview
                  key={user.id || `self-${user.username}`}
                  chatUser={user}
                  lastMessage={chatInfo.lastMessage}
                  lastMessageTime={chatInfo.lastMessageTime}
                  unreadCount={chatInfo.unreadCount || 0}
                  isActive={isActive}
                  isSelf={isSelf}
                  isOnline={user.isOnline || false}
                  messageStatus={chatInfo.messageStatus || 'sent'}
                  isTyping={typingUsers.has(user.id)}
                  onClick={() => {
                    if (!isSelf) {
                      setActiveChatUser(user);
                      setActiveChatId(user.id);
                      setMobileView("chat");
                    }
                  }}
                  onAvatarClick={() => setProfileModalUser(user)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      ) : null}

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <MobileBottomNav
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          visible={mobileView !== "chat"}
        />
      </div>
    </div>
  );
};

export default React.memo(SidebarMobile);
