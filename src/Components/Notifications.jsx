import React from "react";
import { 
  FaTimes, 
  FaCheckCircle, 
  FaUserFriends, 
  FaEye, 
  FaUsers, 
  FaStar, 
  FaUserPlus,
  FaGift 
} from "react-icons/fa";

const Notifications = ({ 
  notifications, 
  onClose, 
  markAsRead, 
  markAllAsRead 
}) => {
  const hasUnread = notifications.some(n => !n.read);

  // Enhanced notification type icons & emojis
  const getNotificationIcon = (type) => {
    const icons = {
      welcome: { icon: FaUsers, emoji: "🎉" },
      member: { icon: FaUserFriends, emoji: "👨‍👩‍👧‍👦" },
      message: { icon: FaEye, emoji: "💬" },
      profile_viewer: { icon: FaEye, emoji: "👁️" },
      friend_request: { icon: FaUserPlus, emoji: "🤝" },
      achievement: { icon: FaStar, emoji: "⭐" },
      feature_update: { icon: FaGift, emoji: "✨" },
      system: { icon: FaCheckCircle, emoji: "ℹ️" }
    };
    return icons[type] || icons.system;
  };

  // Dynamic notification colors by type
  const getNotificationColors = (type) => {
    const colors = {
      welcome: "from-blue-500 to-indigo-600",
      member: "from-green-500 to-emerald-600",
      message: "from-purple-500 to-pink-600",
      profile_viewer: "from-orange-500 to-red-500",
      friend_request: "from-yellow-500 to-amber-600",
      achievement: "from-emerald-400 to-teal-500",
      feature_update: "from-purple-500 to-pink-500",
      system: "from-gray-500 to-gray-600"
    };
    return colors[type] || colors.system;
  };

  // Smart time formatting
  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return notifTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Group notifications for better UX
  const groupedNotifications = notifications.reduce((acc, notif) => {
    const type = notif.type || 'system';
    if (!acc[type]) acc[type] = [];
    acc[type].push(notif);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-gray-900/95 to-gray-800/95 text-white rounded-3xl w-11/12 max-w-md lg:max-w-lg xl:max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-900 border border-gray-700/50 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FaCheckCircle className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
                Notifications
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
                {hasUnread && ` • ${notifications.filter(n => !n.read).length} unread`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-gray-800/80 rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg border border-gray-700/50 hover:border-gray-600"
            aria-label="Close notifications"
          >
            <FaTimes className="w-5 h-5 text-gray-300 hover:text-white" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4 mb-6">
          {Object.entries(groupedNotifications).map(([type, items]) => (
            <div key={type} className="space-y-3">
              {/* Group Header for grouped notifications */}
              {items.length > 1 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-xl border-l-4 border-blue-500/30">
                  <div className={`w-3 h-3 rounded-full ${getNotificationColors(type).replace('from-', 'bg-').replace('to-', 'via-')}`} />
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({items.length})
                  </span>
                </div>
              )}
              
              {items.map((notification) => {
                const iconData = getNotificationIcon(notification.type);
                const colors = getNotificationColors(notification.type);
                const isUnread = !notification.read;

                return (
                  <div
                    key={notification.id}
                    className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:-translate-y-1 hover:bg-opacity-80 backdrop-blur-sm ${
                      isUnread 
                        ? `border-${colors.split('from-')[1]?.split('-')[0] || 'blue'}-400/50 bg-${colors}/20 shadow-blue-500/25 shadow-lg` 
                        : "border-gray-700/50 bg-gray-800/40"
                    }`}
                    style={{ 
                      background: isUnread ? `linear-gradient(135deg, ${colors})` : undefined,
                      backgroundClip: isUnread ? 'padding-box' : undefined
                    }}
                    onClick={() => isUnread && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Enhanced Icon */}
                      <div className={`w-12 h-12 ${getNotificationColors(notification.type)} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl border-2 border-white/20 group-hover:scale-110 transition-all duration-200`}>
                        <span className="text-lg font-bold text-white drop-shadow-lg">
                          {iconData.emoji}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-start justify-between mb-1">
                          <p className={`text-sm font-bold ${isUnread ? 'text-white drop-shadow-md' : 'text-gray-200'}`}>
                            {notification.title || notification.message}
                          </p>
                          {isUnread && (
                            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-ping shadow-lg" />
                          )}
                        </div>
                        
                        {notification.subtitle && (
                          <p className={`text-xs ${isUnread ? 'text-blue-100' : 'text-gray-400'} mb-2 line-clamp-2`}>
                            {notification.subtitle}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`font-medium ${isUnread ? 'text-white/90' : 'text-gray-400'}`}>
                            {formatTime(notification.timestamp || notification.time)}
                          </span>
                          {notification.read && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                              Seen
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!notifications.length && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-800/50 rounded-3xl flex items-center justify-center">
              <FaCheckCircle className="w-10 h-10 text-gray-500" />
            </div>
            <h4 className="text-xl font-bold text-gray-300 mb-2">No notifications yet</h4>
            <p className="text-gray-500 text-sm">You'll see updates here when something happens</p>
          </div>
        )}

        {/* Enhanced Footer */}
        {hasUnread && (
          <div className="mt-8 pt-6 border-t border-gray-700/70 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">
                {notifications.filter(n => !n.read).length} unread notifications
              </span>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            </div>
            <button
              onClick={markAllAsRead}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 border border-blue-500/30 flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <FaCheckCircle className="w-5 h-5" />
              Mark All As Read
            </button>
          </div>
        )}

        {/* NEW: Profile Viewer Announcement */}
        <div className="mt-6 pt-4 border-t border-gray-700/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border-l-4 border-purple-400/50">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-lg font-bold text-white">👁️</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-white mb-1">🚀 Profile Viewer is Live!</p>
              <p className="text-sm text-purple-100 mb-2">See who viewed your profile. Look out for more exciting features coming soon!</p>
              <div className="flex items-center gap-2 text-xs text-purple-200">
                <span>FamChat Team</span>
                <span>• New Feature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
