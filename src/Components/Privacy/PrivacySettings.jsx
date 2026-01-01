import React, { useState } from "react";
import { FaEye, FaLock } from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useToaster } from "../Utils/Toaster";

export default function PrivacySettings({ user, setUser }) {
  const [lastSeenVisible, setLastSeenVisible] = useState(user?.lastSeenVisible ?? true);
  const [profileVisible, setProfileVisible] = useState(user?.profileVisible ?? true);

  const [loadingSetting, setLoadingSetting] = useState("");

  const { show: showToast } = useToaster();

  const updateSetting = async (field, value, setter) => {
    try {
      setLoadingSetting(field); // mark which toggle is updating

      const docRef = doc(db, "users", auth.currentUser.uid);

      await updateDoc(docRef, { [field]: value });

      setter(value);

      setUser((prev) => ({
        ...prev,
        [field]: value,
      }));
    } catch (err) {
      console.error(err);
      showToast({ message: 'Failed to update setting. Please try again.', type: 'error' });

      // rollback UI if update fails
      setter((prev) => !prev);
    } finally {
      setLoadingSetting("");
    }
  };

  const toggleLastSeen = () =>
    updateSetting("lastSeenVisible", !lastSeenVisible, setLastSeenVisible);

  const toggleProfileVisible = () =>
    updateSetting("profileVisible", !profileVisible, setProfileVisible);

  return (
    <div className="flex flex-col gap-4 mt-4">

      {/* Last Seen Toggle */}
      <div
        className="bg-gray-800 p-4 rounded-lg flex items-center justify-between 
        shadow-sm hover:bg-gray-700/50 transition cursor-pointer"
        onClick={toggleLastSeen}
      >
        <div className="flex items-center gap-3">
          <FaEye />
          <span>Show Last Seen</span>
        </div>

        <div className="flex items-center gap-3">
          {loadingSetting === "lastSeenVisible" && (
            <span className="text-blue-400 text-sm">Saving...</span>
          )}

          <input
            type="checkbox"
            checked={lastSeenVisible}
            onChange={toggleLastSeen}
            disabled={loadingSetting === "lastSeenVisible"}
            className="accent-blue-500 w-5 h-5 cursor-pointer"
          />
        </div>
      </div>

      {/* Profile Visible Toggle */}
      <div
        className="bg-gray-800 p-4 rounded-lg flex items-center justify-between 
        shadow-sm hover:bg-gray-700/50 transition cursor-pointer"
        onClick={toggleProfileVisible}
      >
        <div className="flex items-center gap-3">
          <FaLock />
          <span>Profile Visible</span>
        </div>

        <div className="flex items-center gap-3">
          {loadingSetting === "profileVisible" && (
            <span className="text-blue-400 text-sm">Saving...</span>
          )}

          <input
            type="checkbox"
            checked={profileVisible}
            onChange={toggleProfileVisible}
            disabled={loadingSetting === "profileVisible"}
            className="accent-blue-500 w-5 h-5 cursor-pointer"
          />
        </div>
      </div>

      {/* Blocked Contacts Placeholder */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm text-gray-300 text-sm">
        Blocked contacts will appear here in a future update.
      </div>
      
    </div>
  );
}
