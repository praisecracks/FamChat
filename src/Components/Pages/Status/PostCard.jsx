import React, { useEffect, useRef, useState } from "react";
import { FaHeart } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "../../../firebase";
import { useToaster } from "../../Utils/Toaster";
import { playPop } from "../../Utils/sfx";

const PostCard = ({ post, currentUser }) => {
  const { show } = useToaster();
  const [userReaction, setUserReaction] = useState(
    post?.reactions?.[currentUser?.uid] || ""
  );
  const [animEmoji, setAnimEmoji] = useState("");
  const [pending, setPending] = useState(false);
  const [incomingReaction, setIncomingReaction] = useState("");
  const prevReactionsRef = useRef(null);

  const showLocalPopup = (emoji) => {
    if (!emoji) return;
    // Clear then set to force a retriggerable popup on repeated clicks
    setAnimEmoji("");
    setTimeout(() => {
      setAnimEmoji(emoji);
      setTimeout(() => setAnimEmoji(""), 150); // disappear quickly
    }, 20);
  };

  // Sync with server updates but keep optimistic local reaction when present
  useEffect(() => {
    setUserReaction(post?.reactions?.[currentUser?.uid] || "");
  }, [post?.reactions, currentUser?.uid]);

  // Detect incoming reactions (others reacting) and show a short popup + sound
  useEffect(() => {
    const prev = prevReactionsRef.current || {};
    const curr = post?.reactions || {};

    const countify = (m) => Object.values(m || {}).reduce((acc, r) => { acc[r] = (acc[r] || 0) + 1; return acc; }, {});
    const prevCounts = countify(prev);
    const currCounts = countify(curr);

    // Find emoji where count increased
    let increasedEmoji = "";
    for (const [emoji, cnt] of Object.entries(currCounts)) {
      const prevCnt = prevCounts[emoji] || 0;
      if (cnt > prevCnt) { increasedEmoji = emoji; break; }
    }

    if (increasedEmoji) {
      // If the locally optimistic reaction triggered the increase, skip animating
      const localChanged = currentUser && prev[currentUser.uid] !== curr[currentUser.uid] && curr[currentUser.uid] === userReaction;
      if (!localChanged) {
        setIncomingReaction(increasedEmoji);
        try {
          const enabled = (function () { try { return localStorage.getItem('soundEnabled') !== '0'; } catch { return true; } })();
          const vol = (function () { try { return parseFloat(localStorage.getItem('soundVolume') ?? '0.35'); } catch { return 0.35; } })();
          if (enabled) playPop({ volume: vol });
        } catch (e) {}
        setTimeout(() => setIncomingReaction(""), 250);
      }
    }

    prevReactionsRef.current = { ...curr };
  }, [post?.reactions, userReaction, currentUser?.uid]);

  const reactionSummary = React.useMemo(() => {
    const mapServer = post?.reactions || {};
    const map = { ...mapServer };
    if (currentUser?.uid && userReaction !== undefined) {
      if (userReaction === "") {
        // remove own reaction from map if present
        if (map[currentUser.uid]) delete map[currentUser.uid];
      } else {
        map[currentUser.uid] = userReaction;
      }
    }

    const counts = Object.values(map).reduce((acc, r) => {
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const entries = Object.entries(counts);
    if (entries.length === 0) return { top: "", total: 0, counts };
    entries.sort((a, b) => b[1] - a[1]);
    return { top: entries[0][0], total, counts };
  }, [post?.reactions, userReaction, currentUser?.uid]);

  const toggleHeart = async (e) => {
    e.stopPropagation();
    if (!currentUser?.uid) return show({ message: 'Sign in to react', type: 'error' });

    const prev = userReaction;
    const newReaction = prev === "❤️" ? "" : "❤️";

    // Optimistic UI
    setUserReaction(newReaction);
    setPending(true);
    if (newReaction) {
      showLocalPopup(newReaction);
    }

    // Firestore transaction for consistency
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "posts", post.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          throw new Error("Post not found");
        }
        const data = snap.data() || {};
        const reactions = { ...(data.reactions || {}) };
        if (newReaction === "") delete reactions[currentUser.uid];
        else reactions[currentUser.uid] = newReaction;
        tx.update(ref, { reactions });
      });

      // Show undo toast
      show({
        message: newReaction ? 'Reaction sent' : 'Reaction removed',
        actionLabel: 'Undo',
        duration: 5000,
        onAction: async () => {
          try {
            await runTransaction(db, async (tx) => {
              const ref = doc(db, "posts", post.id);
              const snap = await tx.get(ref);
              const data = snap.data() || {};
              const reactions = { ...(data.reactions || {}) };
              if (prev === "") delete reactions[currentUser.uid];
              else reactions[currentUser.uid] = prev;
              tx.update(ref, { reactions });
            });
            setUserReaction(prev);
            show({ message: 'Reaction reverted', type: 'success' });
          } catch (err) {
            console.error('Failed to undo reaction:', err);
            show({ message: 'Failed to undo reaction', type: 'error' });
          }
        }
      });
    } catch (err) {
      console.error('Failed to update reaction:', err);
      // revert optimistic
      setUserReaction(prev);
      setAnimEmoji("");
      show({ message: 'Failed to send reaction', type: 'error' });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition relative">
      <h3 className="font-semibold mb-2">{post.title}</h3>
      <p className="text-sm text-gray-600 mb-3">{post.content}</p>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleHeart}
          disabled={pending}
          aria-busy={pending}
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition ${userReaction ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'} ${pending ? 'opacity-80 cursor-wait' : ''}`}
          title={userReaction ? 'Remove reaction' : 'Heart'}
        >
          <FaHeart />
          <span className="text-sm">{reactionSummary.total > 0 ? reactionSummary.total : ''}</span>
          {pending && <span className="w-3 h-3 rounded-full bg-gray-500 ml-2 animate-pulse" />}
        </button>

        {reactionSummary.top && (
          <div className="text-sm text-gray-500">Top: <span className="ml-1">{reactionSummary.top}</span></div>
        )}
      </div>

      {/* Floating pop-up animation */}
      <AnimatePresence>
        {animEmoji && (
          <motion.div
            key={`anim-${post.id}-${animEmoji}`}
            initial={{ scale: 0, y: 0, opacity: 0 }}
            animate={{ scale: 1.2, y: -20, opacity: 1 }}
            exit={{ scale: 0, y: -40, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 transform -translate-x-1/2 top-2 text-4xl pointer-events-none"
          >
            {animEmoji}
          </motion.div>
        )}

        {incomingReaction && (
          <motion.div
            key={`incoming-${post.id}-${incomingReaction}`}
            initial={{ scale: 0, y: 0, opacity: 0 }}
            animate={{ scale: 1.15, y: -12, opacity: 1 }}
            exit={{ scale: 0, y: -40, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 transform -translate-x-1/2 top-2 text-3xl text-gray-900 pointer-events-none"
            aria-hidden
          >
            {incomingReaction}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostCard;
