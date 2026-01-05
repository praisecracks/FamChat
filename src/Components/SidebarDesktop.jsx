import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase";
import ChatPreview from "./ChatPreview"; // ✅ IMPORT CHATPREVIEW
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

// ✅ ENHANCED HOOK WITH WHATSAPP FEATURES
const useUsersWithSelfAndSorting = (rawUsers, currentUser, activeChatId, chatsMap) => {
  return useMemo(() => {
    if (!currentUser || !rawUsers.length) return [];

    let merged = [
      { 
        ...currentUser, 
        isSelf: true, 
        username: `${currentUser.username || "You"} (You)`,
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
        // ✅ WHATSAPP FEATURES
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

  // ✅ ENHANCED FIRESTORE WITH WHATSAPP DATA
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
          lastMessage: data.lastMessage || "Say hello 👋",
          lastMessageTime: data.lastMessageTime || data.createdAt,
          unreadCount: data.unreadBy?.includes(currentUser.uid) ? data.unreadCount || 1 : 0,
          chatId: d.id,
          // ✅ WHATSAPP FEATURES SUPPORT
          messageStatus: data.lastMessageStatus || 'sent',
          isTyping: data.typingUsers?.includes(otherId) || false,
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

      {/* ✅ WHATSAPP CHATPREVIEW - DESKTOP VERSION */}
      {sidebarExpanded && getActiveView() === "chats" && (
        <div className="w-96 bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col">
          {/* Enhanced Header */}
          <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800/95 backdrop-blur-sm z-10">
            <h2 className="text-2xl font-black mb-4 text-white tracking-tight">Messages</h2>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-gray-700/50 border-2 border-gray-600 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500/60 focus:bg-gray-700/80 transition-all shadow-xl text-lg"
              />
            </div>
          </div>

          {/* No results */}
          {searchQuery.trim() && filteredUsersList.length === 0 && (
            <div className="px-8 py-16 text-center text-gray-400 flex-1 flex items-center justify-center">
              <div>
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-700/50 rounded-2xl flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold mb-2">No conversations found</p>
                <p className="text-lg">Try searching for a different name</p>
              </div>
            </div>
          )}

          {/* ✅ PERFECT CHATPREVIEW INTEGRATION */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-4 space-y-2">
            <AnimatePresence>
              {filteredUsersList.map((user) => {
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
                    isNoUser={false}
                    isOnline={user.isOnline || false}
                    messageStatus={chatInfo.messageStatus || 'sent'}
                    isTyping={chatInfo.isTyping || false}
                    onClick={() => {
                      if (!isSelf) {
                        setActiveChatUser(user);
                        setActiveChatId(user.id);
                      }
                    }}
                    onAvatarClick={() => setProfileModalUser(user)}
                  />
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
