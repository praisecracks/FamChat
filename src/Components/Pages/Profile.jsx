import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaCamera, FaCog, FaPencilAlt, FaUser, FaPhone, FaEnvelope,
  FaShieldAlt, FaCommentAlt, FaVideo, FaCheckCircle, FaMoon
} from "react-icons/fa";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Loader from "../Loader";
import { useToaster } from "../Utils/Toaster";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

function Profile() {
  const navigate = useNavigate();
  const { show: showToast } = useToaster();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsOnline(false);
        setLoading(false);
        return;
      }

      setIsOnline(true);
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(data);
        setStatus(data.bio || "Hey there! I am using FamChat");
        setName(data.username || "");
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setIsOnline(false);
    };
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleDeveloperWorking = () => {
    setShowDeveloperModal(true);
    setTimeout(() => setShowDeveloperModal(false), 3000);
  };

  const handleStatusSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { bio: status });
      setUser(prev => ({ ...prev, bio: status }));
      setEditingStatus(false);
      showToast({ message: "Status updated!", type: "success" });
    } catch {
      showToast({ message: "Failed to update status.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleNameSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { username: name });
      setUser(prev => ({ ...prev, username: name }));
      setEditingName(false);
      showToast({ message: "Name updated!", type: "success" });
    } catch {
      showToast({ message: "Failed to update name.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "chat_images");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcc1upymc/image/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");

      const photoURL = data.secure_url;
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { photoURL });
      setUser(prev => ({ ...prev, photoURL }));
      showToast({ message: "Profile picture updated!", type: "success" });
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      showToast({ message: "Failed to upload profile picture.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (!user)
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="text-center p-8">
          <div className={`w-24 h-24 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <FaUser className={`w-12 h-12 text-gray-400`} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User not found</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Please sign in again</p>
          <button
            onClick={() => navigate("/signin")}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}>
      
      {/* Header */}
      <div className={`backdrop-blur-sm border-b shadow-sm sticky top-0 z-10 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className={`p-2 rounded-xl mr-4 transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <FaArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-gray-800 text-blue-400' : 'hover:bg-gray-100 text-gray-700'}`}
              title={isDarkMode ? "Switch to Light" : "Switch to Dark"}
            >
              <FaMoon className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/setting")}
              className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <FaCog className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Card */}
        <div className={`rounded-3xl p-3 ${isDarkMode ? 'bg-gray-900/90' : 'bg-white/70 backdrop-blur-sm border-white/50'}`}>
          <div className="text-center">
            <div className="relative mx-auto mb-6 w-32 h-32 lg:w-36 lg:h-36">
              <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-8 ${isDarkMode ? 'border-gray-700 bg-gradient-to-br from-blue-600 to-blue-800' : 'border-white/60'}`}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-black text-white">
                      {user.username?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl border-4 shadow-lg ${isDarkMode ? 'border-gray-900' : 'border-white/80'} ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => document.getElementById("profileUpload").click()}
                className={`absolute -top-2 -right-2 w-12 h-12 rounded-3xl shadow-xl border-4 flex items-center justify-center hover:shadow-2xl transition-all ${isDarkMode ? 'bg-blue-600 border-gray-700' : 'bg-white border-white/50'}`}
              >
                <FaCamera className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
              </motion.button>
              <input id="profileUpload" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
            </div>

            {/* Name */}
            <div className="mb-6">
              {editingName ? (
                <div className="flex gap-3 justify-center items-center mb-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={`flex-1 max-w-sm px-4 py-3 rounded-2xl text-center font-bold text-lg outline-none backdrop-blur-sm focus:ring-2 ${isDarkMode ? 'bg-gray-700 border border-gray-600 text-white focus:ring-blue-500' : 'bg-white/90 border border-gray-200 text-gray-900 focus:ring-blue-400'}`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNameSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 mb-2">
                  <h2 className={`text-2xl lg:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.username || user.fullName}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingName(true)}
                    className={`p-2 transition-all ${isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-500 hover:text-blue-500'}`}
                  >
                    <FaPencilAlt className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              {editingStatus ? (
                <div className="flex gap-3 justify-center items-center">
                  <input
                    type="text"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="Update your status..."
                    maxLength={120}
                    className={`flex-1 max-w-md px-4 py-3 rounded-2xl text-center font-semibold text-lg outline-none backdrop-blur-sm focus:ring-2 ${isDarkMode ? 'bg-gray-700 border border-gray-600 text-white focus:ring-green-500' : 'bg-white/90 border border-gray-200 text-gray-900 focus:ring-green-400'}`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStatusSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:bg-green-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setEditingStatus(true)}
                  className={`px-6 py-4 rounded-2xl shadow-sm border cursor-pointer hover:shadow-md transition-all max-w-md mx-auto ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}
                >
                  <p className={`text-lg font-semibold text-center leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {status || "Hey there! I am using FamChat"}
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`grid grid-cols-2 gap-3 mt-4 pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
            <QuickActionButton icon={FaCommentAlt} label="Message" color="blue" onClick={handleDeveloperWorking} isDarkMode={isDarkMode} />
            <QuickActionButton icon={FaVideo} label="Call" color="green" onClick={handleDeveloperWorking} isDarkMode={isDarkMode} />
          </div>

          {/* Personal Info */}
          <PersonalInfoCards user={user} isDarkMode={isDarkMode} />
        </div>

      </div>

      {/* Developer Modal */}
      <DeveloperModal show={showDeveloperModal} />
    </div>
  );
}

// QuickActionButton component (compact height)
const QuickActionButton = ({ icon: Icon, label, color, onClick, isDarkMode }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-3 rounded-2xl shadow-lg hover:shadow-xl transition-all border backdrop-blur-sm ${
      isDarkMode
        ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
        : 'bg-white/70 border-gray-200/50 hover:bg-white'
    }`}
  >
    <Icon
      className={`w-5 h-5 ${
        color === 'blue'
          ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
          : isDarkMode ? 'text-green-400' : 'text-green-600'
      }`}
    />
    <span className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
  </motion.button>
);

// PersonalInfoCards component
const PersonalInfoCards = ({ user, isDarkMode }) => (
  <div className="space-y-4 mt-6">
    <h3 className={`text-lg font-bold uppercase tracking-wide flex items-center gap-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
      <FaShieldAlt className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      Personal Info
    </h3>
    <div className="space-y-3">
      <InfoCard icon={FaUser} label="Full Name" value={user.fullName || user.username || "Not set"} isDarkMode={isDarkMode} bgColor="gray" />
      <InfoCard icon={FaEnvelope} label="Email" value={user.email} isDarkMode={isDarkMode} bgColor="blue" />
      <InfoCard icon={FaPhone} label="Phone" value={user.phone || "Not set"} isDarkMode={isDarkMode} bgColor="green" />
    </div>
  </div>
);

// InfoCard component
const InfoCard = ({ icon: Icon, label, value, isDarkMode, bgColor }) => {
  const colors = {
    gray: isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-r from-gray-100 to-gray-200',
    blue: isDarkMode ? 'bg-blue-600/20' : 'bg-gradient-to-r from-blue-100 to-blue-200',
    green: isDarkMode ? 'bg-green-600/20' : 'bg-gradient-to-r from-green-100 to-green-200',
  };
  const textColors = {
    gray: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    blue: isDarkMode ? 'text-blue-400' : 'text-blue-600',
    green: isDarkMode ? 'text-green-400' : 'text-green-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all backdrop-blur-sm ${isDarkMode ? 'bg-gray-800 border-gray-600 hover:border-gray-500' : 'bg-white/70 border-white/50'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[bgColor]}`}>
          <Icon className={`w-6 h-6 ${textColors[bgColor]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{label}</p>
          <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Developer Modal component
const DeveloperModal = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="w-full max-w-md rounded-3xl p-10 shadow-2xl text-center border-4 bg-gray-900 border-gray-700 backdrop-blur-2xl"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl border-4 border-white/20">
            <FaCog className="w-10 h-10 text-white animate-spin drop-shadow-lg" />
          </div>
          <h3 className="text-3xl font-black mb-4 text-white drop-shadow-2xl">Coming Soon!</h3>
          <p className="text-xl mb-8 leading-relaxed text-blue-300 drop-shadow-md">Developer is working on it 🚀</p>
          <div className="text-lg font-bold px-6 py-3 rounded-2xl shadow-xl bg-blue-600 text-white backdrop-blur-xl">
            Stay tuned! ✨
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Profile;
