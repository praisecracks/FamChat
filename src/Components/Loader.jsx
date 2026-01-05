import React from "react";
import { motion } from "framer-motion";

function Loader() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 text-center max-w-md mx-auto"
      >
        {/* Professional Logo/Spinner */}
        <motion.div
          animate={{ 
            rotate: 360 
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="relative w-20 h-20"
        >
          <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-2xl shadow-xl opacity-75" />
          
          <div className="absolute inset-1 w-18 h-18 bg-white/90 rounded-xl shadow-lg border border-gray-100" />
          
          {/* Inner rotating ring */}
          <motion.div
            animate={{ 
              rotate: -360 
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-2 w-16 h-16 border-3 border-blue-500/30 border-t-blue-500 rounded-xl"
          />
        </motion.div>

        {/* Loading Text */}
        <div className="space-y-1">
          <motion.h2 
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="text-2xl font-bold text-gray-900 leading-tight"
          >
            FamChat
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0.5
            }}
            className="text-sm font-medium text-gray-500"
          >
            Loading your chats...
          </motion.p>
        </div>

        {/* Subtle Progress Bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ 
            scaleX: [0, 0.3, 0.6, 0.9, 1],
            opacity: [0.4, 0.6, 0.8, 1, 0.6]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 1
          }}
          className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden origin-left"
        >
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
        </motion.div>

        {/* Bottom dots - subtle activity indicator */}
        <div className="flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2.5 h-2.5 bg-blue-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Loader;
