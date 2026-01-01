import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ChatPreview from "./ChatPreview";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  FaCommentDots,
  FaPhone,
  FaRegChartBar,
  FaRobot,
  FaCog,
  FaBars,
} from "react-icons/fa";

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#f472b6",
  "#6366f1",
];

const getColorFromUsername = (username) => {
  if (!username) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash % COLORS.length)];
};

const SidebarDesktop = ({
  activeChatId,
  setActiveChatUser,
  setActiveChatId,
  sidebarExpanded,
  setSidebarExpanded,
  currentUser = null,
  filteredUsers = null,
  setProfileModalUser = () => {},
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [chatsMap, setChatsMap] = useState({});

  /* ---------------- ACTIVE VIEW ---------------- */
  const getActiveView = () => {
    if (location.pathname === "/dashboard") return "chats";
    if (location.pathname === "/calls") return "calls";
    if (location.pathname === "/status") return "status";
    if (location.pathname === "/ai") return "ai";
    return "chats";
  };

  /* ---------------- 🔥 SINGLE TOGGLE SOURCE ---------------- */
  const toggleSidebar = () => {
    if (getActiveView() !== "chats") {
      navigate("/dashboard");
      setSidebarExpanded(true);
    } else {
      setSidebarExpanded((prev) => !prev);
    }
  };

  /* ---------------- FIREBASE ---------------- */
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
      unsubUsers();
      unsubChats();
    };
  }, [currentUser]);

  /* ---------------- USERS ---------------- */
  const usersWithSelf = useMemo(() => {
    if (!currentUser) return filteredUsers || users;

    let merged = [
      { ...currentUser, isSelf: true, username: `${currentUser.username} (You)` },
      ...users.filter((u) => u.id !== currentUser.uid),
    ];

    if (filteredUsers) {
      merged = [merged[0], ...filteredUsers.filter((u) => u.id !== currentUser.uid)];
    }

    return merged;
  }, [users, currentUser, filteredUsers]);

  /* ---------------- NAV CLICK ---------------- */
  const handleNavClick = (view) => {
    if (view === "chats") {
      toggleSidebar(); // 🔥 SAME TOGGLE AS MENU BAR
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
    <div className="h-full flex bg-gray-900 text-white">
      {/* ---------------- SMALL SIDEBAR ---------------- */}
      <div className="w-16 bg-gray-800 flex flex-col items-center border-r border-gray-700">

        {/* 🔥 MENU TOGGLE BAR (TOP OF FC) */}
        <button
          onClick={toggleSidebar}
          className="w-full h-14 flex items-center justify-center border-b border-gray-700 hover:bg-gray-700/50 transition"
          title="Toggle chats"
        >
          <FaBars />
        </button>

        {/* FC */}
        <div className="text-2xl font-extrabold text-blue-500 tracking-widest mt-4">
          FC
        </div>

        {/* NAV ICONS */}
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

        {/* BOTTOM */}
        <div className="mt-auto mb-4 flex flex-col items-center gap-4">
          <button
            className="p-2 hover:bg-gray-700/50 rounded"
            onClick={() => navigate("/settings")}
          >
            <FaCog />
          </button>

          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer"
            style={{ backgroundColor: getColorFromUsername(currentUser?.username) }}
            onClick={() => setProfileModalUser(currentUser)}
          >
            {currentUser?.username?.[0]?.toUpperCase() || "🙍‍♂️"}
          </div>
        </div>
      </div>

      {/* ---------------- BIG SIDEBAR ---------------- */}
      {sidebarExpanded && getActiveView() === "chats" && (
        <div className="w-72 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <h2 className="text-xl font-bold px-4 py-3 border-b border-gray-700">
            Chats
          </h2>

          {usersWithSelf.map((user) => {
            const chatInfo = chatsMap[user.id] || {};
            return (
              <ChatPreview
                key={user.id}
                chatUser={user}
                lastMessage={chatInfo.lastMessage}
                lastMessageTime={chatInfo.lastMessageTime}
                unreadCount={chatInfo.unreadCount}
                isActive={activeChatId === user.id}
                isSelf={user.isSelf}
                onClick={() => {
                  if (!user.isSelf) {
                    setActiveChatUser(user);
                    setActiveChatId(user.id);
                  }
                }}
                onAvatarClick={(u) => setProfileModalUser(u)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SidebarDesktop;
