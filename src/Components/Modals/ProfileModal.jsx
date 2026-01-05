import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  FaUser,
  FaEye,
  FaEyeSlash,
  FaCamera,
  FaPhone,
  FaEnvelope,
  FaUsers
} from "react-icons/fa";
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "../../firebase"; // Make sure this import exists

/* ---------------- RELATIVE TIME FORMATTER ---------------- */
const formatRelativeTime = (input) => {
  if (!input) return null;

  let date;

  // Firestore Timestamp
  if (typeof input === "object" && input.seconds) {
    date = new Date(input.seconds * 1000);
  }
  // JS Date
  else if (input instanceof Date) {
    date = input;
  }
  // Already-relative string
  else if (typeof input === "string") {
    return input.toLowerCase();
  }
  else {
    return null;
  }

  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
};

const ProfileModal = ({ user, currentUser, onClose }) => {
  const [profileViews, setProfileViews] = useState(0);
  const [profileViewers, setProfileViewers] = useState([]);
  const [timeTick, setTimeTick] = useState(Date.now());
  const [isOnlineLive, setIsOnlineLive] = useState(false);

  /* ---------------- AUTO REFRESH RELATIVE TIME ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(Date.now());
    }, 60 * 1000); // every 1 minute

    return () => clearInterval(interval);
  }, []);

  /* ---------------- 👁 TRACK PROFILE VIEWS (WHO) ---------------- */
  const trackProfileView = useCallback(async () => {
    if (!currentUser?.uid || !user?.uid) return;
    
    try {
      const profileRef = doc(db, "users", user.uid);
      await updateDoc(profileRef, {
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
  }, [currentUser?.uid, user?.uid]);

  /* ---------------- 🟢 LIVE ONLINE STATUS ---------------- */
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsOnlineLive(data.isOnline || false);
        setProfileViews(data.profileViews || 0);
        setProfileViewers(data.profileViewers || []);
      }
    });

    // Track this view
    trackProfileView();

    return () => unsubscribe();
  }, [user?.uid, trackProfileView]);

  if (!user) return null;

  /* ---------------- PRIVACY ---------------- */
  const profileVisible = user?.profileVisible ?? true;
  const lastSeenVisible = user?.lastSeenVisible ?? true;

  /* ---------------- AVATAR ---------------- */
  const avatar =
    user.photoURL && user.photoURL.trim() !== "" ? user.photoURL : null;

  /* ---------------- PHONE ---------------- */
  const displayPhone =
    user.phoneNumber ||
    user.metadata?.phone ||
    "Phone number private";

  /* ---------------- BIRTHDAY (SAFE) ---------------- */
  const birthdayDate = useMemo(() => {
    if (!user?.birthday) return null;

    if (typeof user.birthday === "object" && user.birthday.seconds) {
      return new Date(user.birthday.seconds * 1000);
    }

    const parsed = new Date(user.birthday);
    return isNaN(parsed.getTime()) ? null : parsed;
  }, [user?.birthday]);

  const today = new Date();

  const isBirthdayToday = useMemo(() => {
    if (!birthdayDate) return false;
    return (
      birthdayDate.getDate() === today.getDate() &&
      birthdayDate.getMonth() === today.getMonth()
    );
  }, [birthdayDate, today]);

  const daysUntilBirthday = useMemo(() => {
    if (!birthdayDate) return null;

    const nextBirthday = new Date(
      today.getFullYear(),
      birthdayDate.getMonth(),
      birthdayDate.getDate()
    );

    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diff = nextBirthday - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [birthdayDate, today]);

  const getBirthdayStatus = () => {
    if (!birthdayDate) return "not set";
    if (isBirthdayToday) return "today 🎉";
    if (daysUntilBirthday <= 7) return `${daysUntilBirthday} days left`;
    return "upcoming";
  };

  /* ---------------- LAST SEEN (LIVE RELATIVE) ---------------- */
  const lastSeenText = useMemo(() => {
    return formatRelativeTime(user?.lastSeen);
  }, [user?.lastSeen, timeTick]);

  /* ---------------- ALBUM ---------------- */
  const albumPhotos = Array.isArray(user.albumPhotos)
    ? user.albumPhotos.slice(0, 4)
    : [];

  /* ---------------- 🎉 CONFETTI ANIMATION ---------------- */
  const Confetti = () => {
    if (!isBirthdayToday) return null;

    return (
      <div className="fixed inset-0 z-[101] pointer-events-none overflow-hidden">
        <div className="confetti-container w-full h-full">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti absolute w-3 h-3 rounded-sm shadow-lg"
              style={{
                left: `${Math.random() * 100}%`,
                animation: `confetti-fall ${2 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 🎉 BIRTHDAY CONFETTI */}
      <Confetti />

      {/* TRANSPARENT BACKDROP */}
      <div
        className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        <div
          className="bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-2xl rounded-3xl border border-gray-700/50 shadow-2xl max-w-md w-full max-h-[92vh] overflow-hidden mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="sticky top-0 z-20 p-6 pb-4 border-b border-gray-700/50 bg-gradient-to-b from-gray-800 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Profile</h2>
                {isOnlineLive ? (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Online now
                  </div>
                ) : null}
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-xl text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {isBirthdayToday && profileVisible && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs px-4 py-1 rounded-full animate-bounce shadow-lg">
                🎂 Birthday Today!
              </div>
            )}
          </div>

          {/* CONTENT */}
          <div className="p-6 pb-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
            {/* AVATAR */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-28 h-28 rounded-3xl overflow-hidden bg-gray-700 flex items-center justify-center group">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUser className="w-14 h-14 text-gray-400 group-hover:text-blue-400 transition-colors" />
                )}
                
                {/* 🟢 ONLINE RING */}
                {isOnlineLive && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-400 border-4 border-gray-900 rounded-full shadow-lg ring-2 ring-emerald-400/50 animate-ping" />
                )}
              </div>

              <h3 className="text-xl font-bold text-white mt-3 capitalize">
                {user.username || "Unknown User"}
              </h3>

              {lastSeenVisible && lastSeenText && (
                <p className="text-sm text-gray-400 mt-1">
                  Last seen • {lastSeenText}
                </p>
              )}
            </div>

            {/* PROFILE INFO */}
            {profileVisible ? (
              <div className="space-y-4">
                <InfoBlock
                  icon={<FaEnvelope />}
                  label="Email"
                  value={user.email || "No email"}
                />

                {displayPhone !== "Phone number private" && (
                  <InfoBlock
                    icon={<FaPhone />}
                    label="Phone"
                    value={displayPhone}
                  />
                )}

                {birthdayDate && (
                  <InfoBlock
                    icon="🎂"
                    label="Birthday"
                    value={getBirthdayStatus()}
                  />
                )}

                {user.bio && (
                  <div className="p-4 rounded-2xl bg-gray-800/60">
                    <p className="text-xs text-gray-400 uppercase mb-1">Bio</p>
                    <p className="text-gray-200 italic">{user.bio}</p>
                  </div>
                )}

                {/* 👁 PROFILE VIEWERS (OWNER ONLY) */}
                {user.uid === currentUser?.uid && profileViewers.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <FaEye className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Profile Views</p>
                        <p className="text-2xl font-bold text-emerald-400">{profileViewers.length}</p>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-20 overflow-y-auto scrollbar-hide">
                      {profileViewers.slice(-3).reverse().map((viewer, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300 bg-gray-800/50 px-2 py-1 rounded-lg">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {viewer.viewerName?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="truncate">{viewer.viewerName}</span>
                          <span className="text-gray-500 ml-auto">· {formatRelativeTime(viewer.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {albumPhotos.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-gray-300 mb-2">
                      Photos
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {albumPhotos.map((photo, i) => (
                        <img
                          key={i}
                          src={photo}
                          className="rounded-xl h-28 w-full object-cover hover:scale-105 transition-transform"
                          alt=""
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <FaEyeSlash className="w-12 h-12 mb-3" />
                Profile is private
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for confetti - ADD TO YOUR GLOBAL CSS */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti {
          pointer-events: none;
        }
      `}</style>
    </>
  );
};

/* ---------------- SMALL INFO COMPONENT ---------------- */
const InfoBlock = ({ icon, label, value }) => (
  <div className="p-4 rounded-2xl bg-gray-800/60 flex items-center gap-3 hover:bg-gray-800/80 transition-all">
    <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-xl text-white flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-200 capitalize truncate">{value}</p>
    </div>
  </div>
);

export default ProfileModal;
