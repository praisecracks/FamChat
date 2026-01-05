import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  collection, onSnapshot, query, orderBy, where, doc, updateDoc,
} from "firebase/firestore";
import { getExpiresMs, formatRemainingLabel } from "./helpers";
import { db } from "../../../firebase";
import {
  FaTimes, FaVolumeUp, FaVolumeMute, FaEye, FaHeart, FaTrash, FaDownload
} from "react-icons/fa";
import { useToaster } from "../../Utils/Toaster";
import { playPop } from "../../Utils/sfx";
import { motion, AnimatePresence } from "framer-motion";
import ReactionPanel from './ReactionPanel';
import FloatingEffects from './FloatingEffects';
import ReplyBar from './ReplyBar';

const IMAGE_DURATION = 5000;
const PROGRESS_INTERVAL = 100;

const StatusViewer = ({ currentUser, userId: propUserId, onClose }) => {
  const { userId: paramUserId } = useParams();
  const location = useLocation();
  const userId = propUserId || paramUserId;
  const { show: showToast } = useToaster();

  // 🔥 ALL HOOKS TOP LEVEL - NO 'current' UNTIL AFTER
  const [statuses, setStatuses] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const [reply, setReply] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [confetti, setConfetti] = useState([]);
  const [reactionAnim, setReactionAnim] = useState("");
  const [userReaction, setUserReaction] = useState("");
  const [expiresLabel, setExpiresLabel] = useState("");
  const [incomingReaction, setIncomingReaction] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ALL REFS
  const floatingTimerRef = useRef(null);
  const confettiTimerRef = useRef(null);
  const incomingTimerRef = useRef(null);
  const prevReactionsRef = useRef(null);
  const expiresTimerRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const holdTimer = useRef(null);
  const swipeStartX = useRef(0);
  const swipeEndX = useRef(0);
  const dragStartX = useRef(0);
  const lastTapRef = useRef({ time: 0, x: 0 });
  const tapResetTimer = useRef(null);
  const highlightHandledRef = useRef(false);

  const CONFETTI_COLORS = ['#ffd700', '#ff4d4d', '#3b82f6', '#34d399', '#f472b6'];

  // 🔥 ALL CALLBACKS - NO 'current' DEPENDENCY ISSUES
  const triggerFloatingReaction = useCallback((emoji) => {
    if (!emoji) return;
    if (floatingTimerRef.current) {
      clearTimeout(floatingTimerRef.current);
      setFloatingReaction("");
    }
requestAnimationFrame(() => setFloatingReaction(emoji));
    floatingTimerRef.current = setTimeout(() => {
      setFloatingReaction("");
      floatingTimerRef.current = null;
   }, 750);

    try {
      const enabled = localStorage.getItem('soundEnabled') !== '0';
      const vol = parseFloat(localStorage.getItem('soundVolume') ?? '0.45');
      if (enabled) playPop({ volume: Math.min(1, vol * 1.3) });
    } catch (e) {}

    if (confettiTimerRef.current) {
      clearTimeout(confettiTimerRef.current);
      setConfetti([]);
    }
    const pieces = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      angle: Math.random() * Math.PI * 2,
      dist: 60 + Math.random() * 60,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
    }));
    setConfetti(pieces);
    confettiTimerRef.current = setTimeout(() => {
      setConfetti([]);
      confettiTimerRef.current = null;
    }, 650);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (dragStartX.current !== 0) {
      swipeEndX.current = e.clientX;
    }
  }, []);

  const next = useCallback(() => {
    if (isPaused || isReplying) return;
    if (currentIndex < statuses.length - 1) setCurrentIndex((i) => i + 1);
    else onClose?.();
  }, [currentIndex, statuses.length, isPaused, isReplying, onClose]);

  const prev = useCallback(() => {
    if (isPaused || isReplying) return;
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex, isPaused, isReplying]);

  const react = useCallback(async (emoji) => {
    if (statuses.length === 0 || currentIndex >= statuses.length || !currentUser?.uid) return;
    
    const currentStatus = statuses[currentIndex];
    const prevReaction = userReaction;
    let newReaction = emoji;
    if (prevReaction === emoji) newReaction = "";

    // ✅ NO RE-PAUSE - STABLE
    setUserReaction(newReaction);
setTimeout(() => setShowReactions(false), 120);

    if (newReaction) {
      triggerFloatingReaction(newReaction);
    }

    const reactions = { ...(currentStatus.reactions || {}) };
    if (newReaction === "") delete reactions[currentUser.uid];
    else reactions[currentUser.uid] = newReaction;

    try {
      await updateDoc(doc(db, "statuses", currentStatus.id), { reactions });
      showToast({ message: newReaction ? 'Reaction sent!' : 'Reaction removed', type: 'success' });
    } catch (err) {
      setUserReaction(prevReaction);
      showToast({ message: 'Failed to send reaction', type: 'error' });
    }
  }, [statuses, currentIndex, currentUser?.uid, userReaction, showToast, triggerFloatingReaction]);

  const handleDownload = useCallback(() => {
    if (!statuses.length || currentIndex >= statuses.length) return;
    const currentStatus = statuses[currentIndex];
    if (!currentStatus?.url) return;
    
    const link = document.createElement('a');
    link.href = currentStatus.url;
    link.download = `status-${currentStatus.id}.${currentStatus.type === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ message: '⬇️ Downloading...', type: 'info' });
  }, [statuses, currentIndex, showToast]);

  const sendReply = useCallback(async () => {
    if (!reply.trim() || statuses.length === 0 || currentIndex >= statuses.length || !currentUser?.uid) return;
    const currentStatus = statuses[currentIndex];
    const newReply = { uid: currentUser.uid, text: reply, createdAt: Date.now() };
    try {
      await updateDoc(doc(db, "statuses", currentStatus.id), {
        replies: [...(currentStatus.replies || []), newReply],
      });
      setReply("");
      setIsReplying(false);
      showToast({ message: '✅ Reply sent!', type: 'success' });
    } catch (err) {
      showToast({ message: '❌ Failed to send reply', type: 'error' });
    }
  }, [reply, statuses, currentIndex, currentUser?.uid, showToast]);

  // 🔥 COMPUTED VALUES - AFTER ALL HOOKS
  const current = statuses[currentIndex];
  const reactionSummary = useMemo(() => {
    if (!current?.reactions) return { top: "", total: 0, counts: {} };
    const mapServer = current.reactions;
    const map = { ...mapServer };
    if (currentUser?.uid) {
      if (userReaction === "") delete map[currentUser.uid];
      else map[currentUser.uid] = userReaction;
    }
    const counts = Object.values(map).reduce((acc, r) => {
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      top: entries[0]?.[0] || "",
      total,
      counts,
      visibleCounts: currentUser?.uid === current?.userId ? counts : (userReaction ? { [userReaction]: 1 } : {}),
    };
  }, [current?.reactions, userReaction, currentUser?.uid, current?.userId]);

  // 🔥 ALL EFFECTS (unchanged)
  useEffect(() => {
    const update = () => setIsMobile(window.matchMedia("(max-width: 639px)").matches);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setStatuses([]);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "statuses"),
      where("userId", "==", userId),
      orderBy("timestamp")
    );

    const unsub = onSnapshot(q, 
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
        const filtered = all.filter((s) => {
          const expMs = getExpiresMs(s);
          if (expMs) return Date.now() < expMs;
          try {
            const t = s.timestamp?.toMillis?.() ?? (typeof s.timestamp === "number" ? s.timestamp : null);
            return typeof t === "number" && t > cutoffMs;
          } catch {
            return false;
          }
        });

        filtered.sort((a, b) => {
          const ta = a.timestamp?.toMillis?.() ?? (typeof a.timestamp === "number" ? a.timestamp : 0);
          const tb = b.timestamp?.toMillis?.() ?? (typeof b.timestamp === "number" ? b.timestamp : 0);
          return ta - tb;
        });

        setStatuses(filtered);
        setProgress(0);
        setIsLoading(false);

        if (filtered.length === 0) {
          showToast({ message: 'No statuses found', type: 'info' });
          setTimeout(() => onClose?.(), 1500);
        }
      }, 
      (err) => {
        console.error('StatusViewer Firestore error:', err);
        setIsLoading(false);
        setStatuses([]);
        
        if (err.code === 'permission-denied') {
          showToast({ 
            message: '🔒 Permission denied. Check your Firestore rules or login.', 
            type: 'error' 
          });
          setTimeout(() => onClose?.(), 2000);
        } else if (err.code === 'failed-precondition') {
          showToast({ 
            message: '⚠️ Firestore index needed. Check Firebase Console link in error.', 
            type: 'warning' 
          });
        } else {
          showToast({ message: `Load failed: ${err.message}`, type: 'error' });
        }
      }
    );

    return () => {
      try { unsub(); } catch(e) {}
    };
  }, [userId, onClose, showToast]);

  // Rest of effects (unchanged)...
  useEffect(() => {
    if (!current) return;
    const update = () => {
      const exMs = getExpiresMs(current);
      setExpiresLabel(exMs ? formatRemainingLabel(exMs) : "");
    };
    update();
    if (expiresTimerRef.current) clearInterval(expiresTimerRef.current);
    expiresTimerRef.current = setInterval(update, 1000);
    return () => { if (expiresTimerRef.current) clearInterval(expiresTimerRef.current); };
  }, [current]);

  useEffect(() => {
    if (!current) return;
    setUserReaction(current.reactions?.[currentUser?.uid] || "");
  }, [current, currentUser?.uid]);

  useEffect(() => {
    const prev = prevReactionsRef.current || {};
    const curr = current?.reactions || {};
    const countify = (m) => Object.values(m || {}).reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {});
    const prevCounts = countify(prev);
    const currCounts = countify(curr);
    let increasedEmoji = "";
    for (const [emoji, cnt] of Object.entries(currCounts)) {
      if ((prevCounts[emoji] || 0) < cnt) {
        increasedEmoji = emoji;
        break;
      }
    }
    if (increasedEmoji && currentUser?.uid) {
      const localDidIt = prev[currentUser.uid] !== curr[currentUser.uid] && curr[currentUser.uid] === userReaction;
      if (!localDidIt) {
        triggerFloatingReaction(increasedEmoji);
        setIncomingReaction(increasedEmoji);
        if (incomingTimerRef.current) clearTimeout(incomingTimerRef.current);
        incomingTimerRef.current = setTimeout(() => setIncomingReaction(""), 250);
      }
    }
    prevReactionsRef.current = { ...curr };
  }, [current?.reactions, userReaction, currentUser?.uid, triggerFloatingReaction]);

  useEffect(() => {
    if (!current || isPaused) return;
    if (current.type === "video" && videoRef.current) {
      const v = videoRef.current;
      v.currentTime = 0;
      v.muted = muted;
      v.play().catch(() => {});
      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        if (v.duration && !isNaN(v.duration)) setProgress((v.currentTime / v.duration) * 100);
      }, PROGRESS_INTERVAL);
      v.onended = next;
    } else {
      setProgress(0);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(next, IMAGE_DURATION);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [currentIndex, isPaused, muted, current, next]);

  // Touch/Mouse handlers (unchanged)
  const handleTouchStart = (e) => { if (showReactions || isReplying) return; swipeStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { swipeEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (showReactions || isReplying) { if (showReactions) { setShowReactions(false); } return; }
    const endX = e?.changedTouches?.[0]?.clientX ?? swipeEndX.current;
    const delta = swipeStartX.current - endX;
    if (Math.abs(delta) > 50) { delta > 0 ? next() : prev(); return; }
    const now = Date.now(); const last = lastTapRef.current; const width = window.innerWidth;
    if (now - last.time < 300 && Math.abs(endX - last.x) < 100) {
      endX > width / 2 ? next() : prev(); lastTapRef.current = { time: 0, x: 0 };
      if (tapResetTimer.current) clearTimeout(tapResetTimer.current);
    } else {
      lastTapRef.current = { time: now, x: endX };
      if (tapResetTimer.current) clearTimeout(tapResetTimer.current);
      tapResetTimer.current = setTimeout(() => { lastTapRef.current = { time: 0, x: 0 }; }, 350);
    }
  };

  const handleMouseDown = (e) => { if (showReactions || isReplying) return; dragStartX.current = e.clientX; holdStart(); };
  const handleMouseUp = (e) => {
    if (showReactions || isReplying) { if (showReactions) { setShowReactions(false); } dragStartX.current = 0; holdEnd(); return; }
    const endX = e.clientX; const delta = dragStartX.current - endX;
    if (Math.abs(delta) > 50) { delta > 0 ? next() : prev(); }
    dragStartX.current = 0; holdEnd();
  };

  const holdStart = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => { setIsPaused(true); videoRef.current?.pause(); }, 200);
  };
  const holdEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (!reply && !showReactions && !isReplying) { setIsPaused(false); videoRef.current?.play().catch(() => {}); }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, onClose]);

  useEffect(() => {
    const hid = location?.state?.highlightStatusId;
    if (hid && !highlightHandledRef.current && statuses.length > 0) {
      const idx = statuses.findIndex((s) => s.id === hid);
      if (idx !== -1) setCurrentIndex(idx);
      highlightHandledRef.current = true;
    }
  }, [location, statuses]);

 if (isLoading) {
  return (
    <div className="fixed inset-0 z-[20000] bg-black flex items-center justify-center">
      <motion.div
        className="text-white text-sm font-semibold bg-black/70 px-5 py-2 rounded-full"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
      >
        Loading status…
      </motion.div>
    </div>
  );
}


  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
        {/* 🚫 REMOVED: expiresLabel loader */}
        {/* Progress Bar - Compact */}
        <div className="absolute top-10 left-5 right-5 z-40">
          <div className="flex gap-1.5 h-1.5 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
            {statuses.map((_, i) => (
              <motion.div key={i} className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full"
                initial={false} animate={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }}
                transition={{ duration: 0.3 }} />
            ))}
          </div>
        </div>

        {/* Content - WHATSAPP FULL SIZE */}
        <div className="absolute inset-0 flex items-center justify-center p-2" // ✅ p-2 not p-4
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
          
          <AnimatePresence mode="wait">
            {current.type === "image" && (
              <motion.img 
                key={`img-${current.id}`} 
                src={current.url}
                className="max-h-[95vh] w-auto h-auto max-w-[95vw] object-contain rounded-2xl shadow-2xl ring-2 ring-white/30" // ✅ FULL WHATSAPP SIZE
                initial={{ opacity: 0, scale: 1.02 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} 
              />
            )}
            {current.type === "video" && (
              <motion.video 
                key={`video-${current.id}`} 
                ref={videoRef} 
                src={current.url}
                className="max-h-[88vh] max-w-full object-contain rounded-2xl shadow-xl ring-2 ring-white/20"
                playsInline 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.2 }} 
              />
            )}
            {current.type === "text" && (
             <motion.div
  key={`text-${current.id}`}
  className="w-full h-[75vh] flex items-center justify-center px-6"
  style={{ background: current.templateGradient || "#1f2937" }}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <p
    className="text-2xl md:text-4xl font-semibold text-center leading-snug"
    style={{ color: current.templateTextColor || "#fff" }}
  >
    {current.caption}
  </p>
</motion.div>

            )}
          </AnimatePresence>

          {/* Caption - Stable position */}
 <div className="absolute bottom-28 left-6 right-6 min-h-[64px]">
  {current.caption && current.type !== "text" && (
    <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-md p-4 rounded-2xl text-white max-w-md mx-auto">
      <p className="text-base font-medium text-center">
        {current.caption}
      </p>
    </div>
  )}
</div>
</div>

        {/* Compact Left Controls */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-6 opacity-60">
          <motion.button whileTap={{ scale: 0.9 }} onClick={prev}
            className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
            ‹
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={next}
            className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
            ›
          </motion.button>
        </div>

        {/* Compact Right Panel */}
        <div className="absolute right-4 top-24 z-40 flex flex-col items-center gap-4">
          <motion.div className="flex items-center gap-1.5 bg-black/50 backdrop-blur px-3 py-2 rounded-xl text-white shadow-lg min-w-[60px] justify-center"
            whileHover={{ scale: 1.05 }}>
            <FaEye className="w-4 h-4" />
            <span className="font-bold text-sm">{current.viewedBy?.length || 0}</span>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}
            onClick={handleDownload}
            className="w-12 h-12 bg-gradient-to-r from-green-500/70 to-emerald-600 rounded-xl shadow-lg flex items-center justify-center border border-green-400/50 backdrop-blur text-white hover:from-green-600 hover:to-emerald-700"
          >
            <FaDownload className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}
            onClick={(e) => { e.stopPropagation(); setShowReactions(!showReactions); }}
            className="w-14 h-14 bg-black/40 hover:bg-red-500/30 backdrop-blur rounded-2xl shadow-xl flex flex-col items-center justify-center p-1.5 border border-white/20 group relative overflow-hidden pointer-events-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            {userReaction ? (
              <span className="text-2xl drop-shadow-md">{userReaction}</span>
            ) : reactionSummary.top ? (
              <>
                <span className="text-xl drop-shadow-md">{reactionSummary.top}</span>
                <span className="text-xs font-bold bg-black/60 px-1.5 py-0.5 rounded">{reactionSummary.total}</span>
              </>
            ) : (
              <FaHeart className="w-5 h-5 text-white/70 group-hover:text-red-300 drop-shadow-md transition-colors" />
            )}
          </motion.button>

          {currentUser?.uid === current.userId && (
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (window.confirm('Delete this status?')) {
                  updateDoc(doc(db, "statuses", current.id), { deleted: true }).then(onClose);
                }
              }}
              className="w-12 h-12 bg-gradient-to-r from-red-500/90 to-red-600 rounded-xl shadow-lg border border-red-400/40 flex items-center justify-center text-white hover:from-red-600 hover:to-red-700"
            >
              <FaTrash className="w-4 h-4" />
            </motion.button>
          )}

          {current.type === "video" && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMuted(!muted)}
              className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center border backdrop-blur text-white ${
                muted 
                  ? 'bg-black/50 hover:bg-gray-600/40 border-gray-500/30' 
                  : 'bg-emerald-500/70 hover:bg-emerald-600 border-emerald-400/50'
              }`}>
              {muted ? <FaVolumeMute className="w-5 h-5" /> : <FaVolumeUp className="w-5 h-5" />}
            </motion.button>
          )}
        </div>

        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
          className="absolute top-4 right-4 z-50 w-12 h-12 bg-black/60 hover:bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg text-white">
          <FaTimes className="w-5 h-5" />
        </motion.button>

        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 text-white/90 text-sm font-bold bg-black/60 backdrop-blur px-4 py-2 rounded-full shadow-lg">
          {currentIndex + 1} / {statuses.length}
        </div>
      </div>

      <AnimatePresence>
        {showReactions && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[10000] pointer-events-none"
          >
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto">
              <ReactionPanel
                userReaction={userReaction}
                counts={reactionSummary.visibleCounts}
                onReact={react}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingEffects
        reactionAnim={reactionAnim}
        userReaction={userReaction}
        floatingReaction={floatingReaction}
        confetti={confetti}
        incomingReaction={incomingReaction}
      />

      <div className="fixed bottom-0 left-0 right-0 z-[10000] bg-black/95 backdrop-blur border-t border-white/10">
        <ReplyBar reply={reply} setReply={setReply} onSend={sendReply} setIsReplying={setIsReplying} />
      </div>
    </>
  );
};

export default React.memo(StatusViewer);
