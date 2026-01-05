import React, { useRef, useState, useEffect } from "react";
import SidebarDesktop from "../SidebarDesktop";
import SidebarMobile from "../SidebarMobile";
import MobileBottomNav from "../Utils/MobileBottomNav";
import { FaPhone, FaVideo, FaTools, FaRocket, FaClock } from "react-icons/fa";
import useCalls from "../../hooks/useCalls";
import Header from "../Header";

function Call({ sidebarExpanded, setSidebarExpanded, currentUser }) {
  const { calls, loading } = useCalls(currentUser);

  const [showDelete, setShowDelete] = useState(null);
  const [deletedCall, setDeletedCall] = useState(null);
  const timeoutRef = useRef(null);

  const handleDelete = (call) => {
    setDeletedCall(call);
    setShowDelete(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDeletedCall(null);
    }, 5000);
  };

  const handleUndo = () => {
    if (!deletedCall) return;
    setDeletedCall(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleCall = (call, type) => {
    console.log(`Starting ${type} call with ${call.name}`);
  };

  return (
    <div className="pt-20 flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative">
      {/* Desktop Sidebar */}
      <div className="hidden sm:block fixed inset-y-0 left-0 z-40">
        <SidebarDesktop
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
        />
      </div>
<Header currentUser={currentUser} />

      {/* Mobile Sidebar */}
      <div className="sm:hidden">
        <SidebarMobile />
      </div>

      {/* Main Content */}
      <div className="flex-1 sm:ml-[92px] flex flex-col p-8 text-white overflow-hidden">
        {/* Header */}
        <div className="mb-12 ">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-2xl mb-4">
            Call History
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <FaClock className="w-4 h-4" />
            <span>Coming soon...</span>
          </div>
        </div>

        {/* Loading for a while */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-800 rounded-3xl flex items-center justify-center p-8 shadow-2xl">
                <FaPhone className="w-20 h-20 text-gray-600" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-30 animate-pulse" />
            </div>
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-blue-400 mb-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Loading call history...</span>
              </div>
              <p className="text-lg">Please wait while we fetch your calls</p>
            </div>
          </div>
        )}

        {/* After loading - Developer Working Message */}
        {!loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8">
            {/* Main Visual */}
            <div className="relative group">
              <div className="w-48 h-48 bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all duration-500 p-12 relative overflow-hidden">
                <FaTools className="w-24 h-24 text-gray-500 absolute z-10 group-hover:rotate-12 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse" />
                <div className="absolute inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-20 animate-pulse" />
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/20 rounded-2xl blur-xl animate-bounce" />
            </div>

            {/* Main Message */}
            <div className="max-w-md space-y-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg mb-4">
                  No Call History
                </h2>
                <div className="flex items-center justify-center gap-2 text-2xl mb-6">
                  <FaRocket className="w-8 h-8 text-yellow-400 animate-bounce" />
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold drop-shadow-lg">
                    Developer working on it!
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-gray-400">
                <p className="text-xl leading-relaxed">
                  We're building an amazing call history feature for you.
                </p>
                <p className="text-lg">
                  Voice & video calls, swipe-to-delete, and smooth animations are coming soon! 🚀
                </p>
              </div>

              {/* Feature Preview Cards */}
              <div className="grid md:grid-cols-2 gap-4 mt-12 max-w-2xl w-full">
                <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <FaPhone className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-lg text-white">Quick Re-dial</h4>
                  </div>
                  <p className="text-gray-400 text-sm">One tap to call back</p>
                </div>

                <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <FaVideo className="w-6 h-6 text-purple-400" />
                    </div>
                    <h4 className="font-bold text-lg text-white">Video Calls</h4>
                  </div>
                  <p className="text-gray-400 text-sm">Crystal clear video</p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-12 border-t border-white/10">
              <p className="text-sm text-gray-500">
                Feature rolling out soon... <FaRocket className="inline w-4 h-4 ml-1 animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Undo Toast (if somehow triggered) */}
        {deletedCall && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-xl border border-red-500/40 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl">
              <FaTools className="w-5 h-5 text-yellow-400 shrink-0 animate-spin" />
              <div className="flex-1">
                <p className="font-semibold text-white">Call history coming soon!</p>
                <p className="text-sm text-red-200">Stay tuned for updates</p>
              </div>
              <button
                onClick={handleUndo}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-semibold text-white border border-white/30 transition-all duration-200"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>

      <MobileBottomNav visible />
    </div>
  );
}

export default Call;
