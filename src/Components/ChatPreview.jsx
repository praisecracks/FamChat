import React from "react";

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

const formatTime = (time) => {
  if (!time) return "";
  try {
    const dateObj = time.toDate ? time.toDate() : new Date(time);
    const now = new Date();
    const isToday =
      dateObj.getDate() === now.getDate() &&
      dateObj.getMonth() === now.getMonth() &&
      dateObj.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      dateObj.getDate() === yesterday.getDate() &&
      dateObj.getMonth() === yesterday.getMonth() &&
      dateObj.getFullYear() === yesterday.getFullYear();

    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "p.m." : "a.m.";
    hours = hours % 12 || 12;

    if (isToday) return `${hours}:${minutes} ${ampm}`;
    if (isYesterday) return `Yesterday ${hours}:${minutes} ${ampm}`;
    return `${dateObj.getDate().toString().padStart(2, "0")}/${
      (dateObj.getMonth() + 1).toString().padStart(2, "0")
    }/${dateObj.getFullYear()}`;
  } catch {
    return "";
  }
};

const ChatPreview = ({
  chatUser = {},
  lastMessage = "",
  lastMessageTime = null,
  unreadCount = 0,
  isActive = false,
  onClick = () => {},
  onAvatarClick = () => {},   // 🔥 Trigger modal open
  isSelf = false,
  isNoUser = false,
}) => {
  if (isNoUser) {
    return (
      <div className="flex items-center px-4 py-3 text-gray-400 italic cursor-default">
        No user found 🙁
      </div>
    );
  }

  const initial = chatUser.username?.[0]?.toUpperCase() || "U";
  const bgColor = getColorFromUsername(chatUser.username);

  return (
    <div
      onClick={!isSelf ? onClick : undefined}
      className={`
        flex items-center gap-4 px-4 py-3 transition-all rounded-xl
        ${isActive ? "bg-blue-600/30 backdrop-blur-sm" : "hover:bg-gray-800/50"}
        ${isSelf ? "cursor-default opacity-80" : "cursor-pointer"}
        shadow-md
      `}
    >
      {/* Avatar (opens ProfileModal) */}
      <div
        className="relative flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onAvatarClick(chatUser);
        }}
      >
        {chatUser.photoURL ? (
          <img
            src={chatUser.photoURL}
            alt={chatUser.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-700 cursor-pointer"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-700 cursor-pointer"
            style={{ backgroundColor: bgColor }}
          >
            {initial}
          </div>
        )}

        {chatUser.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-gray-900 rounded-full animate-pulse" />
        )}
      </div>

      {/* Username + Last message */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-white truncate">
            {chatUser.username} {isSelf ? "(You)" : ""}
          </span>

          {lastMessageTime && (
            <span className="text-xs text-gray-400 ml-2">
              {formatTime(lastMessageTime)}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-300 truncate">
            {lastMessage || "No messages yet"}
          </p>

          {unreadCount > 0 && !isSelf && (
            <span className="ml-2 text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-full shadow-lg animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPreview;
