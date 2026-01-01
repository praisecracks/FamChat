import React, { useState } from "react";
import { FaDownload, FaCloudUploadAlt, FaEnvelopeOpenText } from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function ChatSettings({ user, setUser }) {
  const [autoDownload, setAutoDownload] = useState(user.autoDownload ?? true);
  const [readReceipts, setReadReceipts] = useState(user.readReceipts ?? true);

  const toggleAutoDownload = async () => {
    const newValue = !autoDownload;
    setAutoDownload(newValue);
    const docRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(docRef, { autoDownload: newValue });
    setUser((prev) => ({ ...prev, autoDownload: newValue }));
  };

  const toggleReadReceipts = async () => {
    const newValue = !readReceipts;
    setReadReceipts(newValue);
    const docRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(docRef, { readReceipts: newValue });
    setUser((prev) => ({ ...prev, readReceipts: newValue }));
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-sm hover:bg-gray-700/50 transition cursor-pointer">
        <div className="flex items-center gap-3">
          <FaDownload />
          <span>Media Auto-Download</span>
        </div>
        <input
          type="checkbox"
          checked={autoDownload}
          onChange={toggleAutoDownload}
          className="accent-blue-500 w-5 h-5 cursor-pointer"
        />
      </div>

      <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-sm hover:bg-gray-700/50 transition cursor-pointer">
        <div className="flex items-center gap-3">
          <FaEnvelopeOpenText />
          <span>Read Receipts</span>
        </div>
        <input
          type="checkbox"
          checked={readReceipts}
          onChange={toggleReadReceipts}
          className="accent-blue-500 w-5 h-5 cursor-pointer"
        />
      </div>
    </div>
  );
}
