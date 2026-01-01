import React, { useEffect, useState } from "react";
import { FaUser } from "react-icons/fa";

const ProfileModal = ({ user, onClose }) => {
  const [animateModal, setAnimateModal] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setAnimateModal(true);
  }, []);

  if (!user) return null;

  const visibility = user?.profileVisible ?? true;
  const avatar = user.photoURL && user.photoURL.trim() !== "" ? user.photoURL : null;

  const displayEmail = user.email || "No email provided";
  const displayPhone = user.phoneNumber || "No phone number";
  const displayBio = user.bio && user.bio.trim() !== "" ? user.bio : "No bio available";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        className={`bg-white w-80 rounded-xl p-5 text-center relative shadow-xl transform transition-all duration-300 ${
          animateModal ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        {/* Close Button */}
        <button
          className="absolute right-4 top-4 text-gray-600 text-xl hover:text-black transition"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Profile Picture */}
        <div className="w-28 h-28 mx-auto rounded-full border-4 border-gray-300 shadow overflow-hidden flex items-center justify-center bg-gray-200 transition-transform duration-300 hover:scale-105">
          {avatar ? (
            <img
              src={avatar}
              alt={user.username}
              className="w-full h-full object-cover"
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
          ) : (
            <FaUser className="text-gray-500 w-12 h-12" />
          )}
        </div>

        {/* Username */}
        <h2 className="text-xl font-bold mt-3 capitalize">{user.username || "Unknown User"}</h2>

        {/* Visibility Logic */}
        {visibility ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="bg-gray-100 p-2 rounded text-gray-700 break-words">{displayEmail}</p>
            <p className="bg-gray-100 p-2 rounded text-gray-700 break-words">{displayPhone}</p>
            <p className="bg-gray-100 p-2 rounded text-gray-700 italic break-words">{displayBio}</p>
          </div>
        ) : (
          <p className="mt-3 text-gray-600 italic">
            This user does not allow profile visibility.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
