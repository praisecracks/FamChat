import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  FaCommentDots,
  FaPhone,
  FaRegChartBar,
  FaRobot,
  FaCog,
  FaSearch,
} from "react-icons/fa";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#14b8a6", "#f472b6", "#6366f1",
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

const useUsersWithSelfAndSorting = (rawUsers, currentUser, activeChatId, chatsMap) => {
  return useMemo(() => {
    if (!currentUser || !rawUsers.length) return [];

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

    merged = merged.map(user => ({
      ...user,
      lastMessage: chatsMap[user.id]?.lastMessage || "No messages yet",
      lastMessageTime: chatsMap[user.id]?.lastMessageTime || null,
      unreadCount: chatsMap[user.id]?.unreadCount || 0,
      chatId: chatsMap[user.id]?.chatId || null
    }));

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

const SidebarDesktop = ({
  activeChatId,
  setActiveChatUser,
  setActiveChatId,
  sidebarExpanded,
  setSidebarExpanded,
  currentUser = null,
  setProfileModalUser = () => {},
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [chatsMap, setChatsMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const getActiveView = () => {
    if (location.pathname === "/dashboard") return "chats";
    if (location.pathname === "/calls") return "calls";
    if (location.pathname === "/status") return "status";
    if (location.pathname === "/ai") return "ai";
    return "chats";
  };

  const toggleSidebar = () => {
    if (getActiveView() !== "chats") {
      navigate("/dashboard");
      setSidebarExpanded(true);
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const qUsers = query(collection(db, "users"), orderBy("username"));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const qChats = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubChats = onSnapshot(qChats, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        const otherId = data.participants.find((u) => u !== currentUser.uid);
        map[otherId] = {
          lastMessage: data.lastMessage || "No messages yet",
          lastMessageTime: data.lastMessageTime || data.createdAt,
          unreadCount: data.unreadBy?.includes(currentUser.uid)
            ? data.unreadCount || 1
            : 0,
          chatId: d.id,
        };
      });
      setChatsMap(map);
    });

    return () => {
      unsubUsers?.();
      unsubChats?.();
    };
  }, [currentUser]);

  const sortedUsers = useUsersWithSelfAndSorting(
    users,
    currentUser,
    activeChatId,
    chatsMap
  );

  const filteredUsersList = useMemo(() => {
    if (!searchQuery.trim()) return sortedUsers;
    
    const queryLower = searchQuery.toLowerCase();
    return sortedUsers.filter((user) =>
      user.username?.toLowerCase().includes(queryLower)
    );
  }, [sortedUsers, searchQuery]);

  const handleNavClick = (view) => {
    if (view === "chats") {
      toggleSidebar();
      return;
    }
    navigate(`/${view}`);
    setSidebarExpanded(false);
  };

  const railItems = [
    { icon: <FaCommentDots />, view: "chats", tooltip: "Chats" },
    { icon: <FaPhone />, view: "calls", tooltip: "Calls" },
    { icon: <FaRegChartBar />, view: "status", tooltip: "Status" },
    { icon: <FaRobot />, view: "ai", tooltip: "Crack AI" },
  ];

  return (
    <div className="h-full pt-14 flex bg-gray-900 text-white">
      {/* Small Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center border-r border-gray-700">
        <div className="text-2xl font-extrabold text-blue-500 tracking-widest mt-4">
          FC
        </div>

        <div className="flex flex-col items-center gap-4 mt-6">
          {railItems.map((item) => {
            const isActive = getActiveView() === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`p-3 rounded-xl transition-all duration-200 hover:bg-gray-700/50 ${
                  isActive ? "bg-blue-600/80 border-r-4 border-blue-400" : ""
                }`}
                title={item.tooltip}
              >
                {item.icon}
              </button>
            );
          })}
        </div>

        <div className="mt-auto mb-4 flex flex-col items-center gap-4">
          <button
            className="p-2 hover:bg-gray-700/50 rounded"
            onClick={() => navigate("/setting")}
          >
            <FaCog />
          </button>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundColor: getColorFromUsername(currentUser?.username) }}
            onClick={() => setProfileModalUser(currentUser)}
          >
            {currentUser?.username?.[0]?.toUpperCase() || "🙍‍♂️"}
          </div>
        </div>
      </div>

      {/* Big Sidebar */}
      {sidebarExpanded && getActiveView() === "chats" && (
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <h2 className="text-xl font-bold mb-3 text-white">Chats</h2>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>
          </div>

          {/* No results */}
          {searchQuery.trim() && filteredUsersList.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400 flex-1 flex items-center justify-center">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">No chats found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-2 px-3 space-y-1">
            <AnimatePresence>
              {filteredUsersList.map((user, index) => {
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
                      scale: hasUnread ? 1.02 : 1,
                      y: hasUnread ? [0, -1, 0] : 0
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ 
                      duration: 0.15,
                      scale: { duration: 2, repeat: Infinity },
                      y: { duration: 1.5, repeat: Infinity }
                    }}
                    className={`group flex items-start p-3.5 cursor-pointer hover:bg-white/5 transition-all rounded-xl mx-1 -my-px border relative overflow-hidden ${
                      hasUnread
                        ? "bg-gradient-to-r from-green-500/20 via-blue-500/15 to-green-500/20 border-green-400/70 shadow-lg shadow-green-500/30 ring-2 ring-green-400/50 animate-pulse"
                        : isActive 
                          ? "border-blue-500/50 bg-blue-500/10 shadow-sm ring-1 ring-blue-500/30" 
                          : isSelf 
                            ? "border-gray-700/50 bg-gray-800/30" 
                            : "border-transparent hover:border-gray-700/50"
                    }`}
                    onClick={() => {
                      if (!user.isSelf) {
                        setActiveChatUser(user);
                        setActiveChatId(user.id);
                      }
                    }}
                  >
                    {/* GLOW RING */}
                    {hasUnread && (
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/40 via-blue-400/30 to-green-400/40 -m-1 animate-ping"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Avatar */}
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl overflow-hidden shadow-md mr-3">
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
                          className={`w-full h-full flex items-center justify-center rounded-2xl text-sm font-bold transition-all shadow-md ${
                            hasUnread ? "ring-4 ring-green-400/50 animate-pulse shadow-lg shadow-green-500/30" : ""
                          }`}
                          style={{ backgroundColor: getColorFromUsername(user.username) }}
                        >
                          {user.username?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>

                    {/* ✅ ONLINE STATUS - OUTSIDE, NO BLINKING */}
                    {user.isOnline && !isSelf && (
                      <div className="flex-shrink-0 -ml-2 mt-1.5">
                        <div className="w-3.5 h-3.5 bg-green-400 border-3 border-gray-900 rounded-full shadow-lg ring-2 ring-white/60" />
                      </div>
                    )}

                    {/* User Info */}
                    <div className="flex-1 min-w-0 py-0.5 ml-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-sm pr-4 truncate font-semibold ${
                          hasUnread
                            ? "text-white font-bold drop-shadow-lg bg-gradient-to-r from-green-400/90 to-blue-400/90 bg-clip-text text-transparent animate-pulse"
                            : isActive 
                              ? "text-white font-bold drop-shadow-md" 
                              : isSelf 
                                ? "text-blue-300 font-semibold" 
                                : "text-gray-200 font-medium"
                        }`}>
                          {user.username}
                        </h3>
                        
                        {chatInfo.lastMessageTime && !isSelf && (
                          <span className={`text-xs font-medium px-2 py-px rounded-full shadow-sm flex-shrink-0 ${
                            hasUnread
                              ? "bg-green-500/30 text-white font-bold border-2 border-green-400/60 shadow-green-500/40 animate-pulse"
                              : isActive
                                ? "bg-blue-500/20 text-blue-200 font-semibold border border-blue-400/50"
                                : "bg-gray-700/80 text-gray-400 font-medium"
                          }`}>
                            {formatTime(chatInfo.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      
                      <p className={`text-xs pr-4 truncate font-medium ${
                        hasUnread 
                          ? "text-white font-bold drop-shadow-lg bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent animate-pulse" 
                          : isActive 
                            ? "text-blue-100 font-semibold drop-shadow-md" 
                            : "text-gray-400 font-medium"
                      }`}>
                        {chatInfo.lastMessage || "Say hello 👋"}
                      </p>
                    </div>

                    {/* Badge */}
                    {hasUnread && (
                      <motion.div
                        className="ml-3 flex-shrink-0"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        
                        <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full shadow-xl ${
                          unreadCount > 99 ? "bg-red-500" : "bg-green-500"
                        } text-white animate-bounce`}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SidebarDesktop);
