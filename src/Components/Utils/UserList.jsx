import React, { useMemo } from "react";
import { FaCommentDots } from "react-icons/fa";

const UserList = ({
  users = [],
  currentChat,
  selectChat,
  unreadMap = {},
  searchTerm = "",
  isFabActive = false,
  currentUserUid, // Current logged-in user
}) => {
  const formatTime = (timestamp) => {
    if (!timestamp) timestamp = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const renderAvatar = (user) => {
    if (user.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt={user.username}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      );
    }
    const initials = user.username
      ? user.username
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "A";
    const bgColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500"];
    const bg = bgColors[user.uid?.charCodeAt(0) % bgColors.length] || "bg-gray-500";

    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${bg}`}
      >
        {initials}
      </div>
    );
  };

  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    if (!searchTerm) return users;
    return users.filter((u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  if (!filteredUsers.length) {
    return (
      <div className="p-4 text-gray-400 text-center text-sm">No users found</div>
    );
  }

  return (
    <div className="flex-1 relative overflow-y-auto bg-[#1F2937]">
      {filteredUsers.map((user) => {
        const isActive = currentChat?.uid === user.uid;
        const unreadCount = unreadMap[user.uid] || 0;
        const lastMessage = user.lastMessage || "No message yet";
        const lastMessageTime = user.lastMessageTime || user.createdAt || new Date();

        const isCurrentUser = user.uid === currentUserUid;
        const displayName = isCurrentUser ? `${user.username} (you)` : user.username || "Anonymous";

        return (
          <div
            key={user.uid}
            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-[#334155] transition-colors rounded-lg
              ${isActive ? "bg-blue-600/30" : ""}
              ${isCurrentUser ? "bg-blue-700/40" : ""}`}
            onClick={() => selectChat(user)}
          >
            <div className="flex items-center gap-3 min-w-0">
              {renderAvatar(user)}
              <div className="flex flex-col min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-medium text-white truncate">{displayName}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(lastMessageTime)}
                  </span>
                </div>
                <span className="text-xs text-gray-400 truncate">
                  {lastMessage.length > 40
                    ? lastMessage.substring(0, 37) + "..."
                    : lastMessage}
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs animate-pulse flex-shrink-0">
                {unreadCount}
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Action Button */}
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 p-3 rounded-full transition-all duration-300 ${
          isFabActive
            ? "bg-blue-500/30 backdrop-blur-sm scale-110 animate-pulse animate-bounce-once"
            : "bg-white/10 scale-100"
        }`}
        style={{
          boxShadow: isFabActive
            ? "0 0 20px rgba(59,130,246,0.7)"
            : "0 0 0 transparent",
        }}
      >
        <FaCommentDots className="text-white text-[20px]" />
      </div>
    </div>
  );
};

export default UserList;
