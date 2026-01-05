import React, { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, orderBy, startAt, endAt, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import NotFound from "../assets/FamNotFound.png";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#14b8a6", "#f472b6", "#6366f1",
  "#06b6d4", "#eab308", "#ec4899", "#84cc16"
];

// consistent avatar color from username
const getColorFromUsername = (username) => {
  if (!username) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const NewChatModal = ({ selectChat, onClose, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef();

  const searchUsers = useCallback(async (term) => {
    if (!term?.trim() || term.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      // Convert term to lowercase for case-insensitive search
      const lowerTerm = term.toLowerCase();
      const q = query(
        collection(db, "users"),
        orderBy("username"),
        startAt(lowerTerm),
        endAt(lowerTerm + "\uf8ff")
      );

      const snap = await getDocs(q);
      const results = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            username: data.username || "Unknown",
            online: data.online || false,
            photoURL: data.photoURL || null
          };
        })
        .filter(u => u.id !== currentUserId); // exclude self

      setUsers(results);
    } catch (err) {
      console.error("Search error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }
    const timeoutId = setTimeout(() => searchUsers(searchTerm.toLowerCase()), 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchUsers]);

  const highlightText = (text, highlight) => {
    if (!text || !highlight) return text;
    const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeHighlight})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-gradient-to-r from-yellow-400/90 to-orange-400/90 text-black font-bold px-1 rounded-sm shadow-sm backdrop-blur"
        >
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          ref={modalRef}
          className="w-full max-w-md max-h-[85vh] bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-800/50 flex items-center justify-between relative">
            <div>
              <h2 className="text-2xl font-bold text-white">New Chat</h2>
              <p className="text-sm text-gray-400">Find family members</p>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition"
              whileTap={{ scale: 0.95 }}
            >
              ×
            </motion.button>
          </div>

          {/* Search Input */}
          <div className="px-6 py-3 border-b border-gray-800/30 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search family members..."
              className="w-full h-12 pl-12 pr-4 bg-gray-800 text-white rounded-3xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
            {searchTerm && (
              <motion.button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-xl transition"
                whileTap={{ scale: 0.85 }}
              >
                ×
              </motion.button>
            )}
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto bg-gray-900 p-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-gray-500">
                <motion.div
                  className="w-10 h-10 border-3 border-gray-700/50 border-t-blue-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-sm font-semibold mt-4 tracking-wide">Searching...</p>
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 mb-2 rounded-2xl cursor-pointer hover:bg-gray-800/60 transition"
                  onClick={() => { selectChat?.(user); onClose(); }}
                >
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white overflow-hidden"
                    style={{
                      background: user.photoURL
                        ? "transparent"
                        : `linear-gradient(135deg, ${getColorFromUsername(user.username)}, #444)`
                    }}
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      user.username?.[0]?.toUpperCase() || "U"
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {highlightText(user.username || "Anonymous", searchTerm)}
                    </p>
                    <p className="text-xs text-gray-400">{user.online ? "Online" : "Offline"}</p>
                  </div>
                </motion.div>
              ))
            ) : searchTerm ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <img src={NotFound} alt="Not found" className="w-32 h-32 mb-4 opacity-70" />
                <p>No family members match "{searchTerm}"</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <p>Type a name to find family members</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FloatingButton = ({ selectChat = () => {}, currentUserId }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <motion.button
        className="fixed right-6 bottom-24 z-50 w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center text-2xl font-black transition hover:from-blue-700 hover:to-indigo-700"
        onClick={() => setModalOpen(true)}
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.96 }}
      >
        +
      </motion.button>

      <AnimatePresence mode="wait">
        {modalOpen && (
          <NewChatModal
            selectChat={selectChat}
            onClose={() => setModalOpen(false)}
            currentUserId={currentUserId}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingButton;
