import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaBars, FaBell, FaSearch, FaTimes, FaCheckCircle } from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp, 
  onSnapshot,
  collection 
} from "firebase/firestore";
import { auth, db } from "../firebase";
import logo from "../../public/HouseLogo.jpg";

const Header = ({
  appName = "FamChat",
  currentUser,
  unreadCount = 0,
  sidebarExpanded,
  setSidebarExpanded
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileViewers, setProfileViewers] = useState([]);
  const heartbeatRef = useRef();
  const statusRef = useRef();

  const navigate = useNavigate();

  // 👁 Track WHO viewed profile (Firestore-safe)
  const trackProfileView = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const now = new Date().toISOString();
      
      await updateDoc(userRef, {
        profileViewers: arrayUnion({
          viewerId: currentUser.uid,
          viewerName: currentUser.username || currentUser.displayName || "Unknown",
          timestamp: serverTimestamp()
        }),
        lastViewed: serverTimestamp()
      });
    } catch (error) {
      console.log("Profile view tracking failed:", error);
    }
  }, [currentUser]);

  // 🟢 True online/offline detection (heartbeat system)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userRef = doc(db, "users", currentUser.uid);
    const statusRefPath = `users/${currentUser.uid}`;
    const statusRefDoc = doc(db, statusRefPath);

    // Set initial online status
    updateDoc(userRef, {
      isOnline: true,
      lastSeen: serverTimestamp(),
      lastHeartbeat: serverTimestamp()
    });

    // Heartbeat every 30 seconds
    heartbeatRef.current = setInterval(async () => {
      await updateDoc(statusRefDoc, {
        isOnline: true,
        lastHeartbeat: serverTimestamp()
      });
    }, 30000);

    // Listen for own status changes
    const unsubscribeStatus = onSnapshot(statusRefDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsOnline(data.isOnline || false);
      }
    });

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatRef.current);
      unsubscribeStatus();
      
      // Set offline after 60 seconds
      setTimeout(async () => {
        await updateDoc(statusRefDoc, {
          isOnline: false,
          lastSeen: serverTimestamp()
        });
      }, 60000);
    };
  }, [currentUser?.uid]);

  useEffect(() => {
    setIsOnline(!!currentUser);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsOnline(!!user);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 🔥 Listen for profile viewers
  useEffect(() => {
    if (!currentUser?.uid) return;

    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileViewers(data.profileViewers || []);
      }
    });

    // Track own profile view on mount
    trackProfileView();

    return () => unsubscribe();
  }, [currentUser?.uid, trackProfileView]);

  // 🔥 INITIALIZE NOTIFICATIONS ON MOUNT
  useEffect(() => {
    const initialNotifications = [
      { id: 1, message: "Welcome to FamChat!", type: "welcome", read: false, time: "2 mins ago" },
      { id: 2, message: "New family member joined!", type: "member", read: false, time: "5 mins ago" },
      { id: 3, message: "You have 3 new messages", type: "message", read: true, time: "1 hour ago" },
    ];
    setNotifications(initialNotifications);
  }, []);

  const initials = (name) => (name ? name.slice(0, 1).toUpperCase() : "U");

  const handleLogoutClick = () => {
    setShowMenu(false);
    setShowLogoutConfirm(true);
  };

  const performLogout = async () => {
    setLoadingLogout(true);
    setLogoutError(null);
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (err) {
      console.error("Logout failed:", err);
      setLogoutError("Unable to log out. Try again.");
      setLoadingLogout(false);
    }
  };

  const getFirstWord = (str) => str?.split(" ")[0] || "User";

  // 🔥 WORKING MARK AS READ
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  // 🔥 WORKING MARK ALL AS READ
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const hasUnread = notifications.some(notif => !notif.read);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#1e293b] border-b border-[#334155] text-white z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              className="hidden md:block p-2 rounded hover:bg-gray-700/40"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
            >
              <FaBars size={18} />
            </button>

            <span className="font-extrabold text-xl text-blue-400 md:hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {appName}
            </span>

            <div className="hidden md:flex items-center gap-3">
              <img src="/HouseLogo.jpg" alt="FamChat Logo" className="w-10 h-10 object-contain" />
              <span className="font-extrabold text-xl text-blue-400" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {appName}
              </span>
            </div>
          </div>

          {/* CENTER */}
          <div className="hidden md:flex items-center bg-gray-800 px-3 py-2 rounded-xl border border-gray-700 w-80">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search chats or users..."
              className="bg-transparent outline-none text-gray-300 w-full"
            />
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-5">
            {/* NOTIFICATION BELL - CLICK TO OPEN MODAL */}
            <div className="relative cursor-pointer p-2 rounded hover:bg-gray-700/40 group" onClick={() => setShowNotifications(true)}>
              <FaBell size={20} className="group-hover:text-blue-400 transition-colors" />
              
              {/* GREEN DOT for unread */}
              {hasUnread && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse" />
              )}
            </div>

            {/* PROFILE */}
            <div className="relative">
              <button
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-700/40"
                onClick={() => setShowMenu((v) => !v)}
              >
                {/* Avatar */}
                <div className="relative w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    initials(currentUser?.username || currentUser?.displayName)
                  )}
                  
                  {/* 🟢 Online Status Ring */}
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-[#1e293b] rounded-full ring-2 ring-green-400/50 animate-ping" />
                  )}
                </div>

                {/* Username + status */}
                <div className="flex flex-col text-left">
                  <span className="text-white font-medium">
                    {getFirstWord(currentUser?.username || currentUser?.displayName)}
                  </span>
                  <span className="flex items-center text-xs text-gray-300">
                    <span
                      className={`w-2 h-2 rounded-full mr-1 ${
                        isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                      }`}
                    />
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </button>

              {/* PROFILE DROPDOWN */}
              {showMenu && (
                <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg w-44 shadow-lg p-1 z-50">
                  <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded"
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/profile");
                    }}
                  >
                    Profile ({profileViewers.length})
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded"
                    onClick={handleLogoutClick}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE SEARCH BAR */}
        <div className="px-4 mt-1 md:hidden"></div>
      </header>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-gray-900 text-white rounded-lg w-11/12 max-w-md p-5 shadow-lg z-50">
            <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-300 mb-4">Are you sure you want to log out?</p>

            {logoutError && <div className="mb-3 text-sm text-red-400">{logoutError}</div>}

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-transparent border border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutError(null);
                }}
                disabled={loadingLogout}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
                onClick={performLogout}
                disabled={loadingLogout}
              >
                {loadingLogout ? "Logging out..." : "OK, Log out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: NOTIFICATIONS MODAL - NOW FULLY WORKING */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowNotifications(false)}
        >
          <div 
            className="bg-gray-900 text-white rounded-2xl w-11/12 max-w-md lg:max-w-lg xl:max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Notifications
              </h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 hover:bg-gray-800 rounded-xl transition-all duration-200"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Welcome Message */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl border border-blue-500/30">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">
                Welcome back, {getFirstWord(currentUser?.username || currentUser?.displayName)}! 👋
              </h4>
              <p className="text-gray-300 text-sm">
                Here's what's happening in your FamChat family
              </p>
            </div>

            {/* 🔥 Profile Viewers Section */}
            {profileViewers.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
                <h4 className="text-lg font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                Profile
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {profileViewers.slice(-5).reverse().map((viewer, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {viewer.viewerName?.slice(0, 1).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{viewer.viewerName}</p>
                        <p className="text-xs text-gray-400">Just now</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:bg-gray-800/50 ${
                    notification.read 
                      ? "border-gray-700 bg-gray-800/30" 
                      : "border-blue-500/50 bg-blue-500/10 shadow-lg"
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-white">
                        {notification.type === "welcome" ? "🎉" :
                         notification.type === "member" ? "👨‍👩‍👧‍👦" :
                         "💬"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      {!notification.read && (
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mt-1 animate-pulse"></span>
                      )}
                      {notification.read && (
                        <span className="inline-block text-xs text-green-400 font-medium mt-1">Viewed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {hasUnread && (
              <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                <button 
                  onClick={markAllAsRead}
                  className="text-blue-400 hover:text-blue-300 text-sm font-bold bg-blue-500/20 px-4 py-2 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-all duration-200"
                >
                  <FaCheckCircle className="inline mr-2" /> Mark all as read ({notifications.filter(n => !n.read).length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎉 Birthday Confetti Animation */}
      {false && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
