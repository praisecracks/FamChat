import React from "react";
import { motion } from "framer-motion";

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
  return COLORS[Math.abs(hash % COLORS.length)];
};

// ✅ UPDATED: WhatsApp-style date format (Today/Yesterday/Weekday/Date)
const formatTime = (time) => {
  if (!time) return "";
  
  try {
    const dateObj = time.toDate ? time.toDate() : new Date(time);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today - 86400000);
    const messageDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    
    // Today
    if (messageDate.getTime() === today.getTime()) {
      let hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "p.m." : "a.m.";
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    
    // Yesterday
    if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    
    // This week (Friday, Thursday, etc.)
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    if (messageDate >= today - 7 * 86400000) {
      return dayName;
    }
    
    // Full date format (11/5/2026)
    return dateObj.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return "Recent";
  }
};

const ChatPreview = ({
  chatUser = {},
  lastMessage = "",
  lastMessageTime = null,
  unreadCount = 0,
  isActive = false,
  onClick = () => {},
  onAvatarClick = () => {},
  isSelf = false,
  isNoUser = false,
  isOnline = false,
  messageStatus = 'sent', // 'sent', 'delivered', 'read'
  isTyping = false,
}) => {
  if (isNoUser) {
    return (
      <div className="flex items-center px-4 py-3 text-gray-400 italic cursor-default">
        No user found 🙁
      </div>
    );
  }

  const hasUnread = unreadCount > 0 && !isSelf;
  const initial = chatUser.username?.[0]?.toUpperCase() || "U";
  const bgColor = getColorFromUsername(chatUser.username);

  // ✅ WHATSAPP DOUBLE TICKS
  const getTickIcon = () => {
    if (isTyping) {
      return (
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      );
    }

    if (messageStatus === 'read') {
      return (
        <span className="text-blue-500 text-xs font-bold flex-shrink-0 tracking-tight">✓✓</span>
      );
    }
    
    if (messageStatus === 'delivered') {
      return (
        <span className="text-gray-400 text-xs font-bold flex-shrink-0 tracking-tight">✓✓</span>
      );
    }
    
    return (
      <span className="text-gray-400 text-xs flex-shrink-0">✓</span>
    );
  };

  return (
    <div
      onClick={!isSelf ? onClick : undefined}
      className={`
        flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-lg
        ${isActive ? "bg-blue-600/30 border-2 border-blue-500/50 shadow-blue-500/25" : "hover:bg-gray-800/50"}
        ${isSelf ? "cursor-default opacity-80" : "cursor-pointer"}
        shadow-md group
      `}
    >
      {/* Avatar */}
      <div
        className="relative flex-shrink-0 hover:scale-105 transition-transform duration-200"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick(chatUser);
        }}
      >
        {chatUser.photoURL ? (
          <img
            src={chatUser.photoURL}
            alt={chatUser.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 hover:border-white/50 transition-all"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-700 hover:border-white/50 transition-all"
            style={{ backgroundColor: bgColor }}
          >
            {initial}
          </div>
        )}

        {/* Online indicator */}
        {isOnline && (
          <motion.span
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full shadow-lg"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>

      {/* Username + Message */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span
            className={`truncate text-sm ${
              hasUnread ? "font-bold text-white" : "font-semibold text-white"
            }`}
          >
            {chatUser.username} {isSelf ? "(You)" : ""}
          </span>

          {/* Time + WhatsApp Ticks */}
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {lastMessageTime && (
              <span
                className={`text-xs ${
                  hasUnread ? "font-semibold text-white" : "text-gray-400"
                }`}
              >
                {formatTime(lastMessageTime)}
              </span>
            )}

            {/* ✅ DOUBLE BLUE TICKS FOR READ */}
            {!isSelf && lastMessageTime && getTickIcon()}
          </div>
        </div>

        <div className="flex justify-between items-center">
          {/* Message preview */}
          <p
            className={`line-clamp-2 text-sm pr-2 ${
              hasUnread
                ? "font-bold text-white"
                : isTyping
                ? "text-blue-400 font-medium italic"
                : "text-gray-300"
            }`}
          >
            {isTyping
              ? "Typing..."
              : lastMessage || "No messages yet"
            }
          </p>

          {/* Unread badge */}
          {hasUnread && (
            <motion.span
              className="ml-2 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 rounded-full shadow-lg font-bold"
              whileHover={{ scale: 1.05 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPreview;
