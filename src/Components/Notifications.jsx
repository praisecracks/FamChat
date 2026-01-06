import React from "react";
import { 
  FaTimes, 
  FaCheckCircle, 
  FaBell, 
  FaUser, 
  FaCrown,
  FaStar 
} from "react-icons/fa";

const Notifications = ({ 
  notifications = [], 
  onClose, 
  markAsRead, 
  markAllAsRead 
}) => {
  const hasUnread = notifications.some(n => !n.read);

  // Smart time formatting
  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
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

  // Professional notification types
  const getNotificationData = (type) => {
    const types = {
      welcome: { emoji: "🎉", color: "from-emerald-500 to-green-600", label: "Welcome" },
      message: { emoji: "💬", color: "from-blue-500 to-indigo-600", label: "Message" },
      feature_update: { emoji: "✨", color: "from-purple-500 to-pink-600", label: "New Feature" },
      profile_viewer: { emoji: "👁️", color: "from-orange-500 to-red-500", label: "Profile View" }
    };
    return types[type] || types.message;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-black/80 text-white rounded-3xl w-11/12 max-w-md lg:max-w-lg xl:max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-hidden border border-white/10 backdrop-blur-2xl relative overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-gray-900/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Background Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg" />

        {/* Professional Header */}
        <div className="flex items-center justify-between mb-8 pb-6 relative">
          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/20">
              <FaBell className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                Notifications
              </h2>
              <p className="text-sm font-medium text-gray-300 mt-1 flex items-center gap-2">
                {notifications.length} total
                {hasUnread && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold rounded-full shadow-md">
                    {notifications.filter(n => !n.read).length} unread
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="group relative p-3 hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl border border-white/20 backdrop-blur-sm z-10"
            aria-label="Close notifications"
          >
            <FaTimes className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300 blur-xl -z-10" />
          </button>
        </div>

        {/* Smart Notifications List */}
        <div className="space-y-4 mb-8">
          {notifications.map((notification, index) => {
            const { emoji, color, label } = getNotificationData(notification.type || 'message');
            const isUnread = !notification.read;
            const delay = index * 0.1;

            return (
              <div
                key={notification.id}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 cursor-pointer hover:shadow-2xl hover:-translate-y-2 backdrop-blur-md overflow-hidden ${
                  isUnread
                    ? `border-gradient-to-r from-blue-400/50 to-purple-400/50 bg-gradient-to-br ${color} shadow-[0_0_30px_rgba(59,130,246,0.3)] shadow-2xl`
                    : "border-white/20 bg-white/5 shadow-xl hover:border-white/30"
                }`}
                style={{
                  background: isUnread ? `linear-gradient(135deg, ${color})` : 'rgba(255,255,255,0.05)',
                  backgroundClip: isUnread ? 'padding-box' : 'border-box'
                }}
                onClick={() => isUnread && markAsRead(notification.id)}
              >
                {/* Priority Badge for NEW features */}
                {notification.type === 'feature_update' && (
                  <div className="absolute -top-4 left-6 px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-xs font-black uppercase tracking-wider rounded-full shadow-lg border-2 border-yellow-300/50 transform rotate-3">
                    NEW
                  </div>
                )}

                {/* Glassmorphism Icon Container */}
                <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-20 h-20 ${color} rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/30 backdrop-blur-xl group-hover:scale-110 transition-all duration-500 z-10`}>
                  <span className="text-3xl drop-shadow-2xl z-20 relative">{emoji}</span>
                </div>

                {/* Content */}
                <div className="relative pl-24 flex-1 min-h-[80px]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`text-lg font-black leading-tight pr-8 ${
                        isUnread 
                          ? "text-white drop-shadow-2xl bg-gradient-to-r from-white to-gray-200 bg-clip-text" 
                          : "text-gray-100"
                      }`}>
                        {notification.title || notification.message}
                      </p>
                      {notification.subtitle && (
                        <p className={`text-sm mt-1 pr-8 ${
                          isUnread ? "text-white/90" : "text-gray-400"
                        }`}>
                          {notification.subtitle}
                        </p>
                      )}
                    </div>
                    
                    {/* Smart Status Indicators */}
                    {isUnread ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-lg animate-ping" />
                        <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">NEW</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/20 px-2 py-1 rounded-full backdrop-blur-sm border border-emerald-400/30">
                        <FaCheckCircle className="w-3 h-3" />
                        Viewed
                      </div>
                    )}
                  </div>

                  {/* Smart Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/20">
                    <span className={`text-xs font-bold uppercase tracking-widest ${
                      isUnread ? "text-white/80" : "text-gray-500"
                    }`}>
                      {label}
                    </span>
                    <span className="text-xs font-mono text-gray-400 tracking-wider">
                      {formatTime(notification.timestamp || notification.time)}
                    </span>
                  </div>

                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -skew-x-12 animate-shimmer" />
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {!notifications.length && (
            <div className="text-center py-20 relative">
              <div className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-700 shadow-2xl backdrop-blur-sm">
                <FaBell className="w-16 h-16 text-gray-600" />
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-black text-gray-300 mb-3 tracking-tight">No Notifications</h3>
                <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
                  Stay tuned for updates, messages, and new features. 
                  You'll see them all here first.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Professional Action Bar */}
        {hasUnread && (
          <div className="pt-8 border-t border-white/10 bg-white/5 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                {notifications.filter(n => !n.read).length} unread
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500 font-mono">Quick Actions</span>
              </div>
            </div>
            
            <button
              onClick={markAllAsRead}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black py-4 px-8 rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 border border-blue-500/40 backdrop-blur-xl flex items-center justify-center gap-3 uppercase tracking-widest text-sm hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700"
            >
              <FaCheckCircle className="w-5 h-5" />
              Mark All Read
            </button>
          </div>
        )}

        {/* Profile Viewer Announcement - Professional Banner */}
    <div className="mt-8 pt-6 border-t border-purple-500/30 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 rounded-3xl p-6 border-l-4 border-purple-400/60 relative overflow-hidden group">
  {/* Ambient glow */}
  <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-500 to-pink-500 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 -z-10" />

  <div className="flex items-start gap-5 relative z-10">
    {/* Icon */}
    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/20 shrink-0 group-hover:scale-105 transition-transform duration-200">
      <FaEye className="w-7 h-7 text-white drop-shadow-md" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      {/* Badge row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 text-xs font-black uppercase rounded-full shadow-md border border-yellow-300/50">
          New Feature
        </span>
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
          FamChat Update
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xl font-black text-white mb-2 leading-snug">
        View User Profiles 👁️
      </h4>

      {/* Description */}
      <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-md">
        You can now enjoy the chat experience profile viewer features, Note all data and chats are securely store and encrypted.
      </p>

      {/* CTA */}
      <div className="flex items-center gap-4 text-sm">
        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all duration-200">
          Try it now
        </button>
        <span className="text-gray-500 font-mono text-xs">
          Just launched 🚀
        </span>
      </div>
    </div>
  </div>
</div>

      </div>
    </div>
  );
};

export default Notifications;
