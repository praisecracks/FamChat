import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import MobileBottomNav from "./Utils/MobileBottomNav";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#14b8a6", "#f472b6", "#6366f1",
  "#06b6d4", "#eab308", "#ec4899", "#84cc16"
];

const getColorFromUsername = (username) => {
  if (!username) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const formatTime = (time) => {
  if (!time) return "";
  try {
    const dateObj = time.toDate ? time.toDate() : new Date(time);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return "";
  }
};

// Request notification permission and show notification
const showNotification = async (title, body, icon = null, tag = null) => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  // Request permission if not granted
  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;
  }

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || `chat-${Date.now()}`,
      vibrate: [200, 100, 200],
      renotify: true,
      silent: false
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Click handler to focus chat
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

const useUsersWithSelfAndSorting = (rawUsers, currentUser, activeChatId, chatsMap) => {
  return useMemo(() => {
    if (!currentUser || !rawUsers.length) return [];

    // Add self at top
    let merged = [
      { 
        ...currentUser, 
        isSelf: true, 
        username: `${currentUser.username || "You"} (You)`,
        lastMessageTime: null,
        lastMessage: "You"
      },
      ...rawUsers.filter(u => u.id !== currentUser.uid)
    ];

    // Add chat data to each user
    merged = merged.map(user => ({
      ...user,
      lastMessage: chatsMap[user.id]?.lastMessage || "No messages yet",
      lastMessageTime: chatsMap[user.id]?.lastMessageTime || null,
      unreadCount: chatsMap[user.id]?.unreadCount || 0,
      chatId: chatsMap[user.id]?.chatId || null
    }));

    // Sort by lastMessageTime DESC (most recent first), self stays at top
    merged.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      
      const timeA = a.lastMessageTime ? a.lastMessageTime.toDate?.() || a.lastMessageTime : 0;
      const timeB = b.lastMessageTime ? b.lastMessageTime.toDate?.() || b.lastMessageTime : 0;
      
      return new Date(timeB) - new Date(timeA);
    });

    // Move active chat to position 1 (after self)
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
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const prevChatsMapRef = useRef({});

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        setHasNotificationPermission(permission === "granted");
      }
    };
    checkPermission();
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
          lastMessage: data.lastMessage || "No messages yet",
          lastMessageTime: data.lastMessageTime || data.createdAt || null,
          unreadCount: data.unreadBy?.includes(currentUser.uid) ? (data.unreadCount || 1) : 0,
          chatId
        };

        newMap[otherUserId] = currentChatData;

        // Check for new message notification
        if (hasNotificationPermission && 
            currentChatData.unreadCount > 0 && 
            (!prevChatData || prevChatData.unreadCount === 0) &&
            !document.hidden &&
            otherUserId !== activeChatId
        ) {
          // Show Chrome notification for new message
          const senderUser = users.find(u => u.id === otherUserId);
          showNotification(
            `New message from ${senderUser?.username || "Family"}`,
            data.lastMessage || "New message",
            senderUser?.photoURL || null,
            `chat-${otherUserId}`
          );
        }
      });

      prevChatsMapRef.current = newMap;
      setChatsMap(newMap);
    });

    return () => {
      unsubUsers();
      unsubChats();
    };
  }, [currentUser, hasNotificationPermission, activeChatId, users]);

  const sortedUsers = useUsersWithSelfAndSorting(
    users,
    currentUser,
    activeChatId,
    chatsMap
  );

  const filteredUsers = useMemo(() =>
    sortedUsers.filter(user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [sortedUsers, searchTerm]
  );

  if (mobileView !== "chats") return null;

  return (
    <div className="sm:hidden flex flex-col h-screen bg-gray-900 text-white">
      {/* Notification Permission Banner */}
      {!hasNotificationPermission && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-30 bg-blue-600/90 backdrop-blur-sm border-b border-blue-500/50 p-3 text-center text-sm"
        >
          <span>🔕 Enable notifications for new messages</span>
        </motion.div>
      )}

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

 {/* Users List - Aggressive New Message Highlighting */}
<div className="flex-1 overflow-y-auto scrollbar-hide mb-44 px-3">
<AnimatePresence>
{filteredUsers.length > 0 ? (
filteredUsers.map((user, index) => {
const chatInfo = chatsMap[user.id] || {};
const unreadCount = chatInfo.unreadCount || 0;
const isActive = activeChatId === user.id;
const isSelf = user.isSelf;
const hasUnread = unreadCount > 0 && !isSelf;

return (
<motion.div
key={user.id || `self-${index}`}
layout
initial={{ opacity: 0, x: -20 }}
animate={{ 
  opacity: 1, 
  x: 0,
  scale: hasUnread ? 1.02 : 1,        // Subtle lift for unread
  y: hasUnread ? [0, -1, 0] : 0       // Micro bounce for new messages
}}
exit={{ opacity: 0, x: 20 }}
transition={{ 
  duration: 0.15,
  scale: { duration: 2, repeat: Infinity },
  y: { duration: 1.5, repeat: Infinity }
}}
className={`group flex items-start p-3 cursor-pointer hover:bg-white/5 transition-all rounded-2xl mx-1 -my-[1px] border relative overflow-hidden ${
  // 🔥 NEW MESSAGE - Impossible to miss
  hasUnread
    ? "bg-gradient-to-r from-green-500/20 via-blue-500/15 to-green-500/20 border-green-400/70 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50 animate-pulse hover:shadow-green-500/50" 
    // Active chat
    : isActive 
      ? "border-blue-500/50 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/30" 
      // Self chat
      : isSelf 
        ? "border-gray-700/50 bg-gray-800/30" 
        // Normal
        : "border-transparent hover:border-gray-700/50"
}`}
onClick={() => {
  if (!user.isSelf) {
    setActiveChatUser(user);
    setActiveChatId(user.id);
    setMobileView("chat");
  }
}}
>
{/* 🔥 NEW MESSAGE GLOW RING around entire item */}
{hasUnread && (
  <motion.div
    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/40 via-blue-400/30 to-green-400/40 -m-1 animate-ping"
    animate={{ scale: [1, 1.05, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
)}

{/* Avatar - Pulsing border for unread */}
<div className="relative flex-shrink-0 w-12 h-12 mt-0.5 rounded-2xl overflow-hidden ring-2 ring-transparent">
  {user.photoURL ? (
    <img
      src={user.photoURL}
      alt=""
      className={`w-full h-full object-cover rounded-2xl transition-transform duration-200 ${
        hasUnread ? "ring-4 ring-green-400/50 animate-pulse" : ""
      }`}
    />
  ) : (
    <div
      className={`w-full h-full flex items-center justify-center rounded-2xl text-sm font-bold transition-all ${
        hasUnread ? "ring-4 ring-green-400/50 shadow-lg shadow-green-500/30 animate-pulse" : "shadow-md"
      }`}
      style={{ backgroundColor: getColorFromUsername(user.username) }}
    >
      {user.username?.[0]?.toUpperCase() || "U"}
    </div>
  )}
  
  {/* Online indicator */}
  {user.isOnline && !isSelf && (
    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-gray-900 rounded-full ring-2 ring-green-400/50" />
  )}
</div>

{/* User Info - AGGRESSIVE unread highlighting */}
<div className="ml-3 flex-1 min-w-0 py-0.5">
  <div className="flex justify-between items-start">
    {/* Username - EXTRA BOLD for unread */}
    <h3 className={`text-sm font-bold pr-4 ${
      hasUnread
        ? "text-white drop-shadow-2xl animate-pulse bg-gradient-to-r from-green-400/90 to-blue-400/90 bg-clip-text text-transparent" 
        : isActive 
          ? "text-white font-semibold" 
          : isSelf 
            ? "text-blue-300 font-semibold" 
            : "text-gray-200 hover:text-white font-medium"
    }`}>
      {user.username}
    </h3>
    
    {/* Time - Stands out for unread */}
    {chatInfo.lastMessageTime && !isSelf && (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shadow-md ${
        hasUnread
          ? "bg-green-500/30 text-white border-2 border-green-400/60 shadow-green-500/40 animate-pulse" 
          : isActive
            ? "bg-blue-500/20 text-blue-200"
            : "bg-gray-700 text-gray-400"
      }`}>
        {formatTime(chatInfo.lastMessageTime)}
      </span>
    )}
  </div>
  
  {/* Last Message - BOLD + Gradient for unread */}
  <p className={`text-xs font-bold pr-4 truncate ${
    hasUnread 
      ? "text-white drop-shadow-2xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent animate-pulse shadow-lg" 
      : isActive 
        ? "text-blue-100 font-medium" 
        : "text-gray-400 hover:text-gray-200"
  }`}>
    {chatInfo.lastMessage || "Say hello 👋"}
  </p>
</div>

{/* 🔥 COMPACT PULSING BADGE */}
{hasUnread && (
  <motion.div
    className="ml-2 flex-shrink-0"
    animate={{ scale: [1, 1.1, 1] }}
    transition={{ duration: 1.2, repeat: Infinity }}
  >
    <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full shadow-lg ${
      unreadCount > 99 ? "bg-red-500" : "bg-green-500"
    } text-white animate-bounce`}>
      {unreadCount > 99 ? "99+" : unreadCount}
    </div>
  </motion.div>
)}
</motion.div>
);
})
) : (
  // Empty state unchanged
  <div className="flex flex-col items-center justify-center h-96 text-center px-6 relative overflow-hidden">
    {/* ... empty state content ... */}
  </div>
)}
</AnimatePresence>
</div>


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
