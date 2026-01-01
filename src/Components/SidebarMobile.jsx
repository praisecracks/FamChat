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

  // 🔥 PERFECT SEARCH HANDLER
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // 🔥 CLEANUP EFFECT
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
    <div className="sm:hidden flex flex-col min-h-screen pt-2 pb-10 text-white bg-gradient-to-b from-gray-900 via-black/50 to-gray-900">
      
      {/* 🔥 MODERN SEARCH BAR */}
      <div className="sticky top-0 z-20 p-4 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search Family chats..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-gray-900/80 border border-gray-700 text-white rounded-2xl px-5 py-3 pl-12 outline-none placeholder-gray-400 backdrop-blur-xl shadow-xl focus:border-blue-500/50 focus:bg-gray-800/90 transition-all duration-200 text-base font-medium"
          />
          {searchTerm && (
            <motion.button 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full backdrop-blur transition-colors"
              onClick={() => setSearchTerm("")}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              ✕
            </motion.button>
          )}
        </div>
      </div>

      {/* 🔥 PERFECT USERS LIST */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => {
              const chatInfo = chatsMap[user.id] || {};
              const unreadCount = chatInfo.unreadCount || 0;
              const isActive = activeChatId === user.id;

              return (
                <motion.div
                  key={user.id || `self-${user.username}-${index}`}
                  layout
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    group relative p-4 rounded-2xl backdrop-blur-xl border border-transparent
                    transition-all duration-200 cursor-pointer overflow-hidden
                    ${isActive 
                      ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400/40 shadow-2xl shadow-blue-500/20" 
                      : "hover:bg-white/10 hover:border-white/20 hover:shadow-xl"
                    }
                    ${unreadCount > 0 && !user.isSelf ? "bg-green-500/10 border-green-400/30 shadow-green-500/20" : ""}
                  `}
                  onClick={() => {
                    if (!user.isSelf) {
                      setActiveChatUser(user);
                      setActiveChatId(user.id);
                      setMobileView("chat");
                    }
                  }}
                >
                  {/* ✨ Gradient Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                  <div className="flex items-center gap-4 relative z-10">
                    {/* 🎨 Premium Avatar */}
                    <motion.div
                      className="relative flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user.isSelf && setProfileModalUser) setProfileModalUser(user);
                      }}
                    >
                      {user.photoURL ? (
                        <motion.img
                          src={user.photoURL}
                          alt={user.username}
                          className="w-14 h-14 rounded-2xl object-cover ring-3 ring-white/40 shadow-2xl border-4 border-gray-900/50 hover:ring-white/60 transition-all duration-200"
                          whileHover={{ rotate: 1 }}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl ring-3 ring-white/40 border-4 border-gray-900/50 relative overflow-hidden hover:scale-110 transition-all duration-200"
                          style={{ 
                            background: `linear-gradient(135deg, ${getColorFromUsername(user.username)}, ${getColorFromUsername(user.username + '2')}cc)` 
                          }}
                        >
                          <span>{user.username?.[0]?.toUpperCase() || "U"}</span>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}

                      {/* 🟢 Online Status */}
                      {user.isOnline && (
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 border-4 border-gray-900 rounded-full shadow-lg ring-2 ring-green-400/50"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      )}
                    </motion.div>

                    {/* 📱 Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <motion.h3 
                          className={`font-bold text-lg truncate pr-4 ${
                            unreadCount > 0 ? "text-white" : isActive ? "text-blue-200" : "text-white/90 group-hover:text-blue-300"
                          }`}
                          whileHover={{ x: 2 }}
                        >
                          {user.username}
                          {user.isSelf && <span className="ml-2 text-xs text-blue-400 font-medium">(You)</span>}
                        </motion.h3>
                        
                        {chatInfo.lastMessageTime && (
                          <motion.span 
                            className="text-xs bg-black/60 px-2 py-px rounded-full backdrop-blur font-mono tracking-tight shadow-md"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            {formatTime(chatInfo.lastMessageTime)}
                          </motion.span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <motion.p 
                          className={`text-sm truncate pr-4 font-medium italic ${
                            unreadCount > 0 ? "text-white font-bold" : "text-gray-400 group-hover:text-gray-300"
                          }`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        >
                          {chatInfo.lastMessage?.length > 35 
                            ? `${chatInfo.lastMessage.slice(0, 35)}...` 
                            : chatInfo.lastMessage || "Say hello 👋"
                          }
                        </motion.p>
                      </div>
                    </div>

                    {/* 🔔 Premium Unread Badge */}
                    {unreadCount > 0 && !user.isSelf && (
                      <motion.div
                        className="relative ml-2"
                        initial={{ scale: 0, y: -10 }}
                        animate={{ scale: 1, y: 0 }}
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-black flex items-center justify-center rounded-2xl shadow-xl ring-2 ring-green-400/50">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-yellow-400/60 to-orange-400/60 rounded-2xl blur opacity-75"
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              className="flex flex-col items-center justify-center h-96 text-center text-gray-500"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div 
                className="text-6xl mb-6"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                😕
              </motion.div>
              <h3 className="text-xl font-bold text-white/70 mb-2">No Family Here Yet!</h3>
              <p className="text-sm">Your family members will appear here once they join FamChat</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🔥 MOBILE BOTTOM NAV */}
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
