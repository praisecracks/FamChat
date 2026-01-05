import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SidebarDesktop from "../SidebarDesktop";
import SidebarMobile from "../SidebarMobile";
import MobileBottomNav from "../Utils/MobileBottomNav";
import Header from "../Header";
import {
  FaMoon,
  FaSun,
  FaBell,
  FaChevronRight,
  FaUser,
  FaLock,
  FaCog,
  FaInfoCircle,
  FaTrashAlt,
  FaExclamationTriangle,
  FaSignOutAlt,
} from "react-icons/fa";

import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, deleteUser } from "firebase/auth";

import Loader from "../Loader";
import AccountSettings from "../Privacy/AccountSettings";
import PrivacySettings from "../Privacy/PrivacySettings";
import ChatSettings from "../Privacy/ChatSettings";
import About from "../Privacy/About";
import { useToaster } from "../Utils/Toaster";

export default function Setting({ sidebarExpanded, setSidebarExpanded }) {
  const navigate = useNavigate();
  const { show: showToast } = useToaster();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeDark, setThemeDark] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Confirmation modals
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/signin");
        return;
      }

      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (snap.exists()) {
        const firestoreData = snap.data();
        const mergedUser = { 
          ...firebaseUser, 
          ...firestoreData,
          uid: firebaseUser.uid 
        };
        setUser(mergedUser);
      } else {
        setUser(firebaseUser);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  if (loading) return <Loader />;
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        User data not found
      </div>
    );
  }

  /* ================= FUNCTIONS ================= */
  const toggleTheme = () => {
    setThemeDark((prev) => !prev);
    document.documentElement.classList.toggle("dark", !themeDark);
  };

  const toggleNotifications = () => setNotifications((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/signin");
    } catch (error) {
      showToast({ message: "Logout failed", type: "error" });
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteDoc(doc(db, "users", currentUser.uid));
        await deleteUser(currentUser);
        showToast({ message: "Account deleted successfully", type: "success" });
        navigate("/signin");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      showToast({ message: "Failed to delete account. Please try again.", type: "error" });
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="pt-[40px] flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden sm:block fixed inset-y-0 left-0 z-40">
        <SidebarDesktop
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
        />
      </div>

      {/* SHARED HEADER */}
      <Header 
        title="Settings" 
        sidebarExpanded={sidebarExpanded} 
        setSidebarExpanded={setSidebarExpanded}
        currentUser={user}
      />

      {/* MOBILE SIDEBAR */}
      <div className="sm:hidden">
        <SidebarMobile />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 sm:ml-[92px] flex flex-col p-8 text-white overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-8 lg:pb-12 -mr-4 pr-4 scrollbar-hide">
          
          {/* USER PROFILE HEADER */}
          <div className="mb-8 lg:mb-12 max-w-4xl mx-auto">
            <div className="p-3 lg:p-4 bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-2xl">
              <div className="flex items-center gap-4 lg:gap-6">
                <div className="flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl lg:rounded-3xl flex items-center justify-center font-bold text-2xl lg:text-3xl shadow-2xl ring-2 ring-white/20">
                  {user.username?.[0]?.toUpperCase() || user.displayName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">
                    {user.username || user.displayName || "User"}
                  </h1>
                  <p className="text-gray-400 text-sm lg:text-base mt-1">Manage your account & preferences</p>
                </div>
              </div>
            </div>
          </div>

          {/* SETTINGS GRID */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 xl:gap-10">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-1 xl:col-span-1 space-y-6">
              
              {/* ACCOUNT */}
              <section className="bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                <div className="p-6 lg:p-8 border-b border-gray-700/50 bg-gradient-to-b from-gray-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                      <FaUser className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold">Account</h3>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <AccountSettings user={user} setUser={setUser} />
                </div>
              </section>

              {/* PRIVACY - NOW INCLUDES NOTIFICATIONS */}
              <section className="bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                <div className="p-6 lg:p-8 border-b border-gray-700/50 bg-gradient-to-b from-gray-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                      <FaLock className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold">Privacy</h3>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <PrivacySettings user={user} setUser={setUser} />
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-1 xl:col-span-2 space-y-6">
              
              {/* CHATS */}
              <section className="lg:col-span-1 xl:col-span-1 bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="p-6 lg:p-8 border-b border-gray-700/50 bg-gradient-to-b from-gray-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                      <FaCog className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold">Chats</h3>
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <ChatSettings user={user} setUser={setUser} />
                </div>
              </section>

              {/* PREFERENCES - REMOVED SOUND CONTROLS */}
              <section className="lg:col-span-1 xl:col-span-2 bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300">
                <div className="p-6 lg:p-8 border-b border-gray-700/50 bg-gradient-to-b from-gray-800/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                      <FaCog className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold">Preferences</h3>
                  </div>
                </div>
                <div className="p-6 lg:p-8 space-y-6">
                  {/* Toggles - ONLY Dark Mode & Notifications */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* DARK MODE */}
                    <div className="group bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 rounded-2xl p-6 lg:p-8 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {themeDark ? <FaMoon className="w-6 h-6 text-blue-400" /> : <FaSun className="w-6 h-6 text-yellow-400" />}
                          <div>
                            <span className="font-semibold text-base lg:text-lg block">Dark Mode</span>
                            <span className="text-gray-400 text-sm">Interface appearance</span>
                          </div>
                        </div>
                        <label className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-600 transition cursor-pointer">
                          <input type="checkbox" checked={themeDark} onChange={toggleTheme} className="sr-only peer" />
                          <span className="w-6 h-6 mx-0.5 rounded-full bg-white shadow-sm translate-x-0.5 transition peer-checked:translate-x-6 peer-checked:bg-blue-500" />
                        </label>
                      </div>
                    </div>

                    {/* NOTIFICATIONS - NOW SYNCED WITH PRIVACY */}
                    <div className="group bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 rounded-2xl p-6 lg:p-8 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/20 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <FaBell className="w-6 h-6 text-emerald-400" />
                          <div>
                            <span className="font-semibold text-base lg:text-lg block">Notifications</span>
                            <span className="text-gray-400 text-sm">Push notifications</span>
                          </div>
                        </div>
                        <label className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-600 transition cursor-pointer">
                          <input type="checkbox" checked={notifications} onChange={toggleNotifications} className="sr-only peer" />
                          <span className="w-6 h-6 mx-0.5 rounded-full bg-white shadow-sm translate-x-0.5 transition peer-checked:translate-x-6 peer-checked:bg-emerald-500" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ABOUT */}
                <section className="lg:col-span-1 bg-gray-800/70 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer group">
                  <div className="p-6 lg:p-8 bg-gradient-to-b from-gray-800/20 group-hover:from-gray-800/40 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FaInfoCircle className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
                        </div>
                        <span className="font-bold text-xl lg:text-2xl">About</span>
                      </div>
                      <FaChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-gray-500 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                  <div className="p-4 lg:p-6">
                    <About />
                  </div>
                </section>

                {/* LOGOUT */}
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="lg:col-span-1 group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-6 px-6 rounded-3xl border border-red-500/50 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:shadow-3xl hover:shadow-red-500/30 hover:-translate-y-1 active:translate-y-0 overflow-hidden relative"
                >
                  <FaSignOutAlt className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="font-semibold text-lg tracking-wide">Sign Out</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              </div>

              {/* DELETE ACCOUNT */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="col-span-full group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-6 px-8 rounded-3xl border border-red-500/50 transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:shadow-3xl hover:shadow-red-500/30 hover:-translate-y-1 active:translate-y-0 overflow-hidden relative text-lg"
              >
                <FaTrashAlt className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-bold tracking-wide flex items-center gap-2">
                  <FaExclamationTriangle className="w-4 h-4" />
                  Delete Account
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <MobileBottomNav visible />

      {/* MODALS - SAME AS BEFORE */}
      {showLogoutModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowLogoutModal(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl max-w-sm w-full mx-4 p-8 animate-in fade-in zoom-in duration-200 pointer-events-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-3xl flex items-center justify-center">
                  <FaSignOutAlt className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sign Out?</h3>
                <p className="text-gray-400 mb-8">Are you sure you want to sign out of your account?</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-2xl transition-all duration-200 font-medium text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-red-500/50 rounded-2xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showDeleteModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-gray-800/95 backdrop-blur-xl rounded-3xl border border-red-500/30 shadow-2xl max-w-md w-full mx-4 p-8 animate-in fade-in zoom-in duration-200 pointer-events-auto">
              <div className="text-center mb-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-3xl flex items-center justify-center border-2 border-red-500/30">
                  <FaTrashAlt className="w-12 h-12 text-red-400" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-4">
                  Delete Account
                </h3>
                <p className="text-gray-300 text-lg mb-2">This action cannot be undone.</p>
                <p className="text-gray-400 text-sm">All your data, chats, and account information will be permanently deleted.</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-2xl transition-all duration-200 font-medium text-gray-300 hover:text-white"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-red-500/50 rounded-2xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:shadow-red-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Account"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
