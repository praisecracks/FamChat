import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCommentDots, FaPhone, FaRegChartBar, FaRobot, FaCog } from "react-icons/fa";

const navItems = [
  { type: "chats", icon: FaCommentDots, path: "/dashboard" },
  { type: "calls", icon: FaPhone, path: "/calls" },
  { type: "status", icon: FaRegChartBar, path: "/status" },
  { type: "ai", icon: FaRobot, path: "/ai" },
  { type: "settings", icon: FaCog, path: "/setting" },
];

const MobileBottomNav = ({ visible = true }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <nav
      className={`sm:hidden fixed bottom-0 left-0 w-full z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16 pointer-events-none"
      }`}
    >
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-3xl shadow-xl backdrop-blur-xl transition-all mx-2 mb-2"
        style={{
          background: "linear-gradient(120deg, rgba(15,23,42,0.85), rgba(30,41,59,0.7))",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.35), inset 0 0 12px rgba(255,255,255,0.04)",
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.type}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center flex-1 gap-1 transition-transform active:scale-95 relative"
              title={item.type}
            >
              <div
                className={`p-3 rounded-full transition-all flex items-center justify-center ${
                  isActive ? "bg-blue-500/40 backdrop-blur-sm scale-110" : "bg-white/10"
                }`}
                style={{
                  boxShadow: isActive
                    ? "0 0 12px rgba(59,130,246,0.55)"
                    : "0 0 0 transparent",
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <Icon className="text-white text-[20px]" />
              </div>
              <span
                className={`text-[11px] capitalize transition-colors ${
                  isActive ? "text-white font-semibold" : "text-white/80"
                }`}
              >
                {item.type}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
