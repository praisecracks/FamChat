import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaSearch } from "react-icons/fa";

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#ef4444", "#14b8a6", "#f472b6", "#6366f1",
  "#06b6d4", "#eab308", "#ec4899", "#84cc16"
];

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
  const [loading, setLoading] = useState(true);
  const modalRef = useRef();

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("username"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedUsers = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              username: data.username || "Unknown",
              online: data.online || false,
              photoURL: data.photoURL || null
            };
          })
          .filter((user) => user.id !== currentUserId)
          .sort((a, b) => a.username.localeCompare(b.username));
        setUsers(fetchedUsers);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setUsers([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  // Close modal on Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close modal on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          ref={modalRef}
          className="bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.92, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h2 className="text-2xl font-bold text-white">New Chat</h2>
              <p className="text-sm text-gray-400">Select family member</p>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition"
              whileTap={{ scale: 0.95 }}
            >
              <FaTimes size={18} />
            </motion.button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-800">
            <div className="relative">
              <FaSearch
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search family members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-3xl bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto bg-gray-900">
            {loading ? (
              <div className="flex items-center justify-center h-full p-12 text-gray-400">
                Loading...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-12 text-gray-500">
                <h3 className="text-xl font-bold mb-2">No matches found</h3>
                <p className="text-gray-400">Try searching for different family members</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  layout
                  onClick={() => selectChat && selectChat(user)}
                  className="flex items-center p-4 cursor-pointer hover:bg-gray-800/60 transition rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white overflow-hidden"
                    style={{
                      background: user.photoURL
                        ? "transparent"
                        : `linear-gradient(135deg, ${getColorFromUsername(user.username)}, #444)`
                    }}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.username[0]?.toUpperCase() || "U"
                    )}
                  </div>

                  {/* Info */}
                  <div className="ml-4 flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{user.username}</p>
                    <p className="text-xs text-gray-400">{user.online ? "Online" : "Offline"}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;
