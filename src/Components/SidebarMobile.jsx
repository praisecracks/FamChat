import React, { useEffect, useState, useMemo, useCallback } from "react";
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

const useUsersWithSelf = (rawUsers, currentUser, activeChatId, chatsMap) => {
  return useMemo(() => {
    if (!currentUser) return rawUsers;

    let merged = [
      { ...currentUser, isSelf: true, username: `${currentUser.username || "You"} (You)` },
      ...rawUsers.filter(u => u.id !== currentUser.uid)
    ];

    let activeUser;
    if (activeChatId) {
      const idx = merged.findIndex(u => u.id === activeChatId);
      if (idx > 0) activeUser = merged.splice(idx, 1)[0];
    }

    const usersWithUnread = [];
    const usersWithoutUnread = [];

    for (let i = 1; i < merged.length; i++) {
      const user = merged[i];
      const unreadCount = chatsMap[user.id]?.unreadCount || 0;
      if (unreadCount > 0) usersWithUnread.push(user);
      else usersWithoutUnread.push(user);
    }

    let finalList = [merged[0]];
    if (activeUser) finalList.push(activeUser);
    return finalList.concat(usersWithUnread, usersWithoutUnread);
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
      snap.docs.forEach(d => {
        const data = d.data();
        const otherUserId = data.participants.find(uid => uid !== currentUser.uid);
        newMap[otherUserId] = {
          lastMessage: data.lastMessage || "No messages yet",
          lastMessageTime: data.lastMessageTime || data.createdAt || null,
          unreadCount: data.unreadBy?.includes(currentUser.uid) ? (data.unreadCount || 1) : 0,
          chatId: d.id
        };
      });
      setChatsMap(newMap);
    });

    return () => {
      unsubUsers();
      unsubChats();
    };
  }, [currentUser]);

  const usersWithSelf = useUsersWithSelf(
    users.map(u => ({
      ...u,
      lastMessage: chatsMap[u.id]?.lastMessage || "No messages yet",
      lastMessageTime: chatsMap[u.id]?.lastMessageTime || u.createdAt,
      unreadCount: chatsMap[u.id]?.unreadCount || 0
    })),
    currentUser,
    activeChatId,
    chatsMap
  );

  const filteredUsers = useMemo(() => 
    usersWithSelf.filter(user =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [usersWithSelf, searchTerm]);

  if (mobileView !== "chats") return null;

  return (
    <div className="sm:hidden  flex flex-col h-screen
 bg-gray-900 text-white">
      
      {/* Search Bar */}
      <div className="sticky top-0 z-20 p-3 bg-gray-900 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search Family chats..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-2 outline-none placeholder-gray-400 focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => {
              const chatInfo = chatsMap[user.id] || {};
              const unreadCount = chatInfo.unreadCount || 0;
              const isActive = activeChatId === user.id;

              return (
                <motion.div
                  key={user.id || `self-${user.username}-${index}`}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center p-3 cursor-pointer hover:bg-gray-800/50 transition rounded-xl ${
                    isActive ? "bg-gray-800 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => {
                    if (!user.isSelf) {
                      setActiveChatUser(user);
                      setActiveChatId(user.id);
                      setMobileView("chat");
                    }
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center rounded-xl font-bold text-white" style={{ backgroundColor: getColorFromUsername(user.username) }}>
                        {user.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className={`font-medium text-sm truncate ${isActive ? "text-white" : "text-gray-200"}`}>
                        {user.username}{user.isSelf ? " (You)" : ""}
                      </h3>
                      {chatInfo.lastMessageTime && (
                        <span className="text-xs text-gray-400">{formatTime(chatInfo.lastMessageTime)}</span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${unreadCount > 0 ? "font-semibold text-white" : "text-gray-400"}`}>
                      {chatInfo.lastMessage || "Say hello 👋"}
                    </p>
                  </div>

                  {unreadCount > 0 && !user.isSelf && (
                    <div className="ml-2 w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-xs font-bold rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
          <div className="flex flex-col items-center justify-center h-96 text-center px-6 relative overflow-hidden">
  {/* Animated Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-transparent to-blue-900/20" />
  
  {/* Main Family Icon */}
  <motion.div 
    className="w-32 h-32 mb-8 p-8 bg-gray-900/30 rounded-3xl backdrop-blur-xl border border-gray-800/50 shadow-2xl flex items-center justify-center relative z-10"
    initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
    animate={{ 
      scale: 1, 
      opacity: 1, 
      rotate: 0 
    }}
    transition={{ 
      type: "spring", 
      duration: 1, 
      bounce: 0.4 
    }}
  >
    {/* Premium Family SVG */}
    <svg className="w-24 h-24 text-gray-300 drop-shadow-2xl" fill="none" stroke="currentColor" viewBox="0 0 48 48" strokeWidth={2.5}>
      <path d="M12 20c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8z" />
      <path d="M20 36c-5.523 0-10 1.686-10 3.772V40h20v-0.228C30 37.686 25.523 36 20 36z" />
      <circle cx="4" cy="20" r="4" />
      <circle cx="44" cy="20" r="4" />
      <path d="M36 20c0-4.418-3.582-8-8-8s-8 3.582-8 8 3.582 8 8 8 8-3.582 8-8z" />
    </svg>
    
    {/* Elegant Pulse Ring */}
    <motion.div 
      className="absolute w-full h-full border-2 border-blue-400/30 rounded-3xl"
      animate={{ 
        scale: [1, 1.15, 1], 
        opacity: [0.6, 1, 0.6] 
      }}
      transition={{ 
        duration: 2.5, 
        repeat: Infinity 
      }}
    />
  </motion.div>

  {/* Professional Title */}
  <motion.h3 
    className="text-3xl font-bold text-white mb-4 leading-tight tracking-tight drop-shadow-md"
    initial={{ y: 40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
  >
    Family Chats
  </motion.h3>

  {/* Elegant Subtitle */}
  <motion.p 
    className="text-xl text-gray-300 font-medium mb-10 max-w-sm leading-relaxed drop-shadow-sm"
    initial={{ y: 40, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.6, duration: 0.7 }}
  >
    Your family conversations will appear here
  </motion.p>

  {/* Floating Feature Pills */}
  <motion.div 
    className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 opacity-0 lg:opacity-100"
    initial={{ scale: 0.8 }}
    animate={{ scale: 1 }}
    transition={{ delay: 1.2, duration: 0.5 }}
  >
    <motion.div 
      className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700/50 shadow-lg"
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-xs font-semibold text-gray-300">👨‍👩‍👧‍👦 Private</span>
    </motion.div>
    <motion.div 
      className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700/50 shadow-lg"
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-xs font-semibold text-gray-300">⚡ Real-time</span>
    </motion.div>
  </motion.div>

  {/* Subtle Bottom Gradient */}
  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
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
