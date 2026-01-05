import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaShieldAlt, FaUsers, FaClock, FaMobileAlt } from "react-icons/fa";
import familyImg from "../../assets/fam.png";
import logo from "../../../public/HouseLogo.jpg"

const AuthLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 p-4 sm:p-6 lg:p-8 h-full">
        
        {/* Left Column - Compact Content */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left"
        >
          {/* Compact Logo & Hero */}
          <div className="mb-6 lg:mb-8">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl mb-4 mx-auto lg:mx-0 mt-10">
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xl lg:text-2xl font-black text-white"
              >
                F
              </motion.span>
              <img src={logo} alt="" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent leading-tight mb-3 lg:mb-4">
              FamChat
            </h1>
            <p className="text-lg sm:text-xl lg:text-xl text-gray-600 leading-relaxed max-w-sm">
              Private family chat
            </p>
            <p className="text-sm lg:text-base text-gray-500 max-w-sm hidden sm:block">
              Share moments, stay connected
            </p>
          </div>

          {/* Compact Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8 w-full max-w-xs lg:max-w-sm">
            <div className="text-center p-2">
              <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-1">
                <FaShieldAlt />
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-900">Private</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-1">
                <FaUsers />
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-900">Family</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl lg:text-3xl font-bold text-purple-600 mb-1">24h</div>
              <div className="text-xs lg:text-sm font-semibold text-gray-900">Stories</div>
            </div>
            <div className="text-center p-2">
              <div className="text-2xl lg:text-3xl font-bold text-indigo-600 mb-1">
                <FaMobileAlt />
              </div>
              <div className="text-xs lg:text-sm font-semibold text-gray-900">Mobile/Web</div>
            </div>
          </div>

          {/* Compact CTA */}
          <div className="flex flex-col gap-3 w-full max-w-xs lg:max-w-sm">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/signup")}
              className="py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base lg:text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 border border-blue-600/20 flex items-center justify-center gap-2"
            >
              ↗️ Get Started
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/signin")}
              className="py-4 px-6 bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-gray-900 font-bold text-base lg:text-lg rounded-xl shadow-md hover:shadow-lg hover:border-gray-300 hover:bg-white active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              👋 Sign In
            </motion.button>
          </div>
        </motion.div>

        {/* Right Column - Optimized Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.85, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="lg:w-1/2 flex justify-center"
        >
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 max-w-full max-h-[70vh]">
            {/* Subtle backdrop */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5 rounded-2xl blur-xl -z-10" />
            
            {/* Image container */}
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl -z-10" />
              <img
                src={familyImg}
                alt="Family connecting on FamChat"
                className="w-full h-full object-cover rounded-2xl shadow-xl border-4 border-white/70 lg:border-6"
              />
              
              {/* Compact status indicators */}
              <div className="absolute -top-2 -right-2 w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl shadow-md animate-bounce-slow" />
              <div className="absolute -bottom-3 -left-3 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg shadow-md animate-pulse" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed Compact Footer */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-center">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="text-xs text-gray-500 px-3 bg-white/90 backdrop-blur-sm rounded-lg py-1.5 border border-gray-200/50 shadow-sm"
        >
          © {new Date().getFullYear()} FamChat.{' '}
          <span className="font-semibold text-blue-600">@Praise⚡crack</span>
        </motion.p>
      </div>
    </div>
  );
};

export default AuthLanding;
