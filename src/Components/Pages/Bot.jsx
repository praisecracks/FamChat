import React, { useState } from "react";
import SidebarDesktop from "../SidebarDesktop";
import SidebarMobile from "../SidebarMobile";
import MobileBottomNav from "../Utils/MobileBottomNav";
import Header from "../Header";

function Bot({ sidebarExpanded, setSidebarExpanded, currentUser }) {
  const [mobileView, setMobileView] = useState("ai");

  return (
    <div className="pt-20 flex h-screen bg-gray-900 relative overflow-hidden">
      
      {/* Desktop Sidebar */}
      <div className="hidden sm:block fixed inset-y-0 left-0 z-40">
        <SidebarDesktop
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          currentUser={currentUser}
        />
      </div>

      {/* Header */}
      <Header
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        currentUser={currentUser}
        appName="AI"
      />

      {/* Mobile Sidebar */}
      <div className="sm:hidden">
        <SidebarMobile
          mobileView={mobileView}
          setMobileView={setMobileView}
          currentUser={currentUser}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 sm:ml-[92px] flex flex-col p-8 text-white overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="max-w-md">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              FamChat AI 🤖
            </h1>
            <p className="text-gray-400 text-lg">
              Your AI assistant is coming soon!
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        mobileView={mobileView}
        setMobileView={setMobileView}
        visible
      />
    </div>
  );
}

export default Bot;
