import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaSearch } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const NewChatModal = ({ users = [], selectChat, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef();

  // Close modal on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          ref={modalRef}
          className="bg-[#1e293b] w-full max-w-sm rounded-lg overflow-hidden shadow-xl flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold text-lg">New Chat</h2>
            <button onClick={onClose} className="text-gray-300 hover:text-white">
              <FaTimes />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center p-3 border-b border-gray-700 bg-[#16202b]">
            <FaSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
            />
          </div>

          {/* User list */}
          <div className="max-h-80 overflow-y-auto relative">
            {filteredUsers.length === 0 && (
              <div className="p-4 text-gray-400 text-center">No users found</div>
            )}

            {filteredUsers.map((user) => (
              <div
                key={user.uid}
                onClick={() => selectChat(user)}
                className="flex items-center p-3 cursor-pointer hover:bg-[#334155] hover:scale-105 transition-transform transition-colors"
              >
                <img
                  src={user.photoURL || "https://via.placeholder.com/40"}
                  alt={user.username || "User"}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-white">{user.username || "Anonymous"}</span>
                  <span className="text-xs text-gray-400">
                    {user.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewChatModal;
