import React, { useState, useEffect } from "react";
import { FaPlus, FaEye, FaUserCircle } from "react-icons/fa";
import ViewerModal from "../../Modals/ViewerModal";
import StatusViewer from "./StatusViewer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { getExpiresMs, formatRemainingLabel } from "./helpers";

const StatusCard = ({ user = {}, statuses = [], currentUser = {}, isSelf = false }) => {
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [statusViewerOpen, setStatusViewerOpen] = useState(false);
  const [expiresLabel, setExpiresLabel] = useState("");
  const [timeProgress, setTimeProgress] = useState(0);

  const { photoURL, username = "User", online = false, uid } = user;
  const latestStatus = statuses[0] || null;

  // Unseen status count
  const unseenCount = statuses.filter(
    (s) => !s.viewedBy?.includes(currentUser?.uid)
  ).length;

  // Update expiry label and time progress every second
  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted || !latestStatus) return;
      const exMs = getExpiresMs(latestStatus);
      setExpiresLabel(exMs ? formatRemainingLabel(exMs) : "");
      if (latestStatus.timestamp && exMs !== null) {
        const totalMs = 24 * 60 * 60 * 1000; // 24h expiry
        const elapsedMs = totalMs - exMs;
        setTimeProgress((elapsedMs / totalMs) * 100);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [latestStatus]);

  const formatStatusTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay && date.getDate() === now.getDate())
      return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diff < 2 * oneDay && date.getDate() === now.getDate() - 1)
      return `Yesterday, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    return date.toLocaleString([], {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenViewers = async (e, statusId) => {
    e.stopPropagation();
    if (!isSelf) return;

    try {
      const snap = await getDoc(doc(db, "statuses", statusId));
      const data = snap.data();
      const viewerUIDs = data?.viewedBy || [];

      const viewerProfiles = await Promise.all(
        viewerUIDs.map(async (uid) => {
          try {
            const userSnap = await getDoc(doc(db, "users", uid));
            return userSnap.exists()
              ? { uid, ...userSnap.data() }
              : { uid, username: "Unknown User" };
          } catch {
            return { uid, username: "Unknown User" };
          }
        })
      );

      setViewers(viewerProfiles);
      setViewerModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch viewers:", err);
      setViewers([]);
      setViewerModalOpen(true);
    }
  };

  const openStatusViewer = () => {
    if (!statuses.length) return;
    setStatusViewerOpen(true);
  };

  // PERFECT WhatsApp multi-status ring with gaps
  const renderStatusRing = () => {
    if (!statuses.length) return null;

    const total = statuses.length;
    const segmentSize = (360 / total) * 0.92;
    const gapSize = (360 / total) * 0.08;
    let gradientStops = [];
    let currentAngle = 0;

    statuses.forEach((status) => {
      const isViewed = status.viewedBy?.includes(currentUser?.uid);
      const color = isViewed ? "#d1d5db" : "#25D366"; // gray for viewed, green for new
      gradientStops.push(`${color} ${currentAngle}deg`);
      gradientStops.push(`${color} ${currentAngle + segmentSize}deg`);
      gradientStops.push(`transparent ${currentAngle + segmentSize}deg`);
      gradientStops.push(`transparent ${currentAngle + segmentSize + gapSize}deg`);
      currentAngle += segmentSize + gapSize;
    });

    const gradient = `conic-gradient(${gradientStops.join(", ")})`;

    return (
      <div
        className="absolute inset-0 w-20 h-20 rounded-full pointer-events-none"
        style={{ padding: "3px", background: gradient, zIndex: 10 }}
      />
    );
  };

  return (
    <>
      <div
        onClick={openStatusViewer}
        className="relative flex items-center gap-4 p-3 rounded-xl shadow-md cursor-pointer transition-all duration-200 bg-white dark:bg-gray-800 hover:shadow-xl hover:scale-[1.02] group"
      >
        <div className="relative flex-shrink-0 w-20 h-20 flex items-center justify-center">
          {/* REMOVED: Background mask for clean look */}
          
          {/* WhatsApp multi-status ring */}
          {renderStatusRing()}
          
          {/* CLEAN Profile Image - NO INNER CIRCLE */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-md border-4 border-white/90 dark:border-gray-900/90 z-20 flex items-center justify-center">
            {photoURL ? (
              <img
                src={photoURL}
                alt={username}
                className="w-full h-16 object-cover rounded-full shadow-sm"
              />
            ) : (
              <FaUserCircle className="w-12 h-12 text-gray-400" />
            )}

            {/* Status expiration circular progress - ABOVE profile */}
            {latestStatus && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                <circle
                  className="stroke-gray-300 dark:stroke-gray-600 transition-all"
                  cx="50%"
                  cy="50%"
                  r="34"
                  strokeWidth="3"
                  fill="none"
                  strokeOpacity="0.7"
                />
                <circle
                  className="stroke-green-400 origin-center transition-all duration-1000"
                  cx="50%"
                  cy="50%"
                  r="34"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="213"
                  strokeDashoffset={213 - (213 * timeProgress) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
            )}
          </div>

          {/* Online status dot */}
          <div className="absolute -bottom-1 -right-1 z-40">
            <div
              className={`w-5 h-5 rounded-full shadow-lg border-3 border-white dark:border-gray-800 transition-all duration-300 group-hover:scale-110 ${
                online
                  ? "bg-green-400 border-green-300/50 ring-2 ring-green-200/50"
                  : "bg-gray-400 border-gray-200 ring-2 ring-gray-100/50"
              }`}
              title={online ? "Online" : "Last seen recently"}
            />
          </div>

          {/* Add Status Button */}
          {isSelf && !statuses.length && (
            <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xl border-4 border-white z-50 group-hover:scale-110 transition-all duration-200">
              <FaPlus className="w-3 h-3" />
            </div>
          )}

          {/* Unseen count badge */}
          {unseenCount > 0 && !isSelf && (
            <div className="absolute -top-1 -right-1 p-1.5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white z-50 animate-pulse min-w-[18px] h-[18px]">
              {unseenCount > 9 ? "9+" : unseenCount}
            </div>
          )}
        </div>

        {/* Username & Meta */}
        <div className="flex flex-col flex-1 min-w-0 py-1">
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate leading-tight">
            {isSelf ? "My Status" : username}
          </span>

          {latestStatus ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="truncate">{formatStatusTime(latestStatus.timestamp)}</span>
              {expiresLabel && <span className="text-gray-400">· {expiresLabel}</span>}

              {isSelf && latestStatus.viewedBy?.length > 0 && (
                <button
                  onClick={(e) => handleOpenViewers(e, latestStatus.id)}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 -m-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all z-10"
                  title={`Viewed by ${latestStatus.viewedBy.length}`}
                >
                  <FaEye className="w-3 h-3 flex-shrink-0" />
                  <span className="font-mono text-[10px]">{latestStatus.viewedBy.length}</span>
                </button>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5 leading-tight">
              {isSelf ? "Tap to add status update" : "No status updates"}
            </span>
          )}
        </div>
      </div>

      {statusViewerOpen && (
        <StatusViewer currentUser={currentUser} userId={uid} onClose={() => setStatusViewerOpen(false)} />
      )}

      <ViewerModal open={viewerModalOpen} onClose={() => setViewerModalOpen(false)} viewers={viewers} />
    </>
  );
};

export default StatusCard;
