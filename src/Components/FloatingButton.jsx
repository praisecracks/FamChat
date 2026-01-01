import React, { useState, useEffect } from "react";
import { collection, query, orderBy, startAt, endAt, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import NotFound from "../assets/FamNotFound.png";

const NewChatModal = ({ selectChat, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (term) => {
    if (!term) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        orderBy("username"),
        startAt(term),
        endAt(term + "\uf8ff")
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(results);
    } catch (err) {
      console.error("Error searching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(searchTerm.toLowerCase());
    }, 400);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const highlightText = (text, highlight) => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-300 text-black font-bold px-0.5 rounded-sm">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg w-full max-w-md animate-modalPop">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
        <h2 className="font-bold text-lg">Add Family</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl font-bold"
        >
          ×
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-700 flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search family..."
          className="flex-1 rounded-full px-4 py-2 bg-gray-900 text-white placeholder-gray-400 outline-none focus:bg-gray-700 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="ml-2 text-gray-400 hover:text-white font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* User List */}
      <div className="max-h-96 overflow-y-auto p-3 flex flex-col items-center">
        {loading ? (
          <div className="text-gray-400">Searching...</div>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                selectChat(user); // navigate to chat
                onClose();        // close modal
              }}
              className="flex items-center gap-3 p-3 hover:bg-gray-700 cursor-pointer transition animate-fadeInItem w-full rounded"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: "#4F46E5" }}
              >
                {user.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span>{highlightText(user.username, searchTerm)}</span>
            </div>
          ))
        ) : searchTerm ? (
          <div className="text-center text-gray-400 mt-4">
            <img
              src={NotFound}
              alt="User not found"
              className="w-24 h-24 mx-auto mb-2"
            />
            <div>User not found or cannot be added.</div>
          </div>
        ) : (
          <div className="text-gray-400 text-center mt-4">
            Start typing to search for your family... <br />Know if your family is on FamChat
          </div>
        )}
      </div>
    </div>
  );
};

const FloatingButton = ({ selectChat }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Floating Button */}
      <div
        className={`fixed right-6 bottom-24 z-50 transition-transform duration-700 ease-out ${
          visible ? "translate-y-0 subtle-bounce opacity-100" : "translate-y-20 opacity-0"
        }`}
      >
        <button
          onClick={() => setModalOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 active:scale-95 transition-all duration-200"
          title="Add family"
        >
          +
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 modal-pop w-11/12 max-w-md">
            <NewChatModal
              selectChat={(user) => {
                selectChat(user); // this navigates to chat window
                setModalOpen(false);
              }}
              onClose={() => setModalOpen(false)}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes subtleBounce { 0% { transform: translateY(20px); } 50% { transform: translateY(-5px); } 70% { transform: translateY(2px); } 100% { transform: translateY(0); } }
        .subtle-bounce { animation: subtleBounce 0.6s cubic-bezier(0.25, 1, 0.5, 1); }

        @keyframes modalPop { 0% { opacity: 0; transform: scale(0.9); } 60% { opacity: 1; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        .modal-pop { animation: modalPop 0.35s ease-out forwards; }

        @keyframes fadeIn { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }

        @keyframes fadeInItem { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fadeInItem { animation: fadeInItem 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default FloatingButton;
