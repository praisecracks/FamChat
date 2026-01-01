import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaMoon,
  FaSun,
  FaBell,
  FaSignOutAlt,
} from "react-icons/fa";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Loader from "../Loader";
import MobileBottomNav from "../Utils/MobileBottomNav";
import AccountSettings from "../Privacy/AccountSettings";
import PrivacySettings from "../Privacy/PrivacySettings";
import ChatSettings from "../Privacy/ChatSettings";
import About from "../Privacy/About";
import { useToaster } from "../Utils/Toaster";

export default function Setting() {
  const navigate = useNavigate();

  /* =======================
     ALL HOOKS AT THE TOP
     ======================= */

  const { show: showToast } = useToaster();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeDark, setThemeDark] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("soundEnabled") !== "0";
    } catch {
      return true;
    }
  });

  const [soundVolume, setSoundVolume] = useState(() => {
    try {
      return parseFloat(localStorage.getItem("soundVolume") ?? "0.35");
    } catch {
      return 0.35;
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/signin");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const d = docSnap.data();
        setUser(d);

        if (d.soundEnabled !== undefined) setSoundEnabled(d.soundEnabled);
        if (d.soundVolume !== undefined) setSoundVolume(d.soundVolume);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  /* =======================
     CONDITIONAL RENDERING
     ======================= */

  if (loading) return <Loader />;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        User data not found!
      </div>
    );
  }

  /* =======================
     FUNCTIONS
     ======================= */

  const toggleTheme = () => {
    setThemeDark((prev) => !prev);
    document.documentElement.classList.toggle("dark", !themeDark);
  };

  const toggleNotifications = () =>
    setNotifications((prev) => !prev);

  const saveSoundPreference = async (enabled, volume) => {
    try {
      localStorage.setItem("soundEnabled", enabled ? "1" : "0");
      localStorage.setItem("soundVolume", String(volume));

      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "users", uid), {
          soundEnabled: enabled,
          soundVolume: volume,
        });
      }

      setSoundEnabled(enabled);
      setSoundVolume(volume);

      showToast({ message: "Sound preferences saved", type: "success" });
    } catch (err) {
      console.error(err);
      showToast({ message: "Failed to save sound preferences", type: "error" });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/signin");
  };

  /* =======================
     JSX
     ======================= */

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="hidden sm:flex p-2 mr-3 rounded hover:bg-gray-700/30"
        >
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold flex-1">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-2 pb-40">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            <AccountSettings user={user} setUser={setUser} />

            {/* Preferences */}
            <div>
              <h3 className="text-gray-400 uppercase text-sm mb-2">
                Preferences
              </h3>

              <div className="flex flex-col gap-4">
                <div className="bg-gray-800 p-4 rounded-lg flex justify-between">
                  <div className="flex items-center gap-3">
                    {themeDark ? <FaMoon /> : <FaSun />}
                    Dark Mode
                  </div>
                  <input
                    type="checkbox"
                    checked={themeDark}
                    onChange={toggleTheme}
                  />
                </div>

                <div className="bg-gray-800 p-4 rounded-lg flex justify-between">
                  <div className="flex items-center gap-3">
                    <FaBell />
                    Notifications
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={toggleNotifications}
                  />
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    Reaction sound
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) =>
                        saveSoundPreference(e.target.checked, soundVolume)
                      }
                    />
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={soundVolume}
                    onChange={(e) =>
                      saveSoundPreference(
                        soundEnabled,
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            <PrivacySettings user={user} setUser={setUser} />
            <ChatSettings user={user} setUser={setUser} />
            <About />

            <button
              onClick={handleLogout}
              className="bg-red-600 px-6 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>

      <MobileBottomNav activeScreen="settings" visible />
    </div>
  );
}
