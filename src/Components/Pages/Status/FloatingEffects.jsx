import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingEffects({ reactionAnim, userReaction, floatingReaction, confetti = [], incomingReaction }) {
  return (
    <>
      <AnimatePresence>
        {reactionAnim && userReaction && (
          <motion.div
            key="reactionAnim"
            initial={{ scale: 0, y: 0, opacity: 0 }}
            animate={{ scale: 1.2, y: -40, opacity: 1 }}
            exit={{ scale: 0, y: -60, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center text-6xl pointer-events-none"
          >
            {userReaction}
          </motion.div>
        )}

        {floatingReaction && (
          <motion.div
            key={`floating-${floatingReaction}`}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1.25, opacity: 1 }}
            exit={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center text-7xl pointer-events-none"
          >
            {floatingReaction}
          </motion.div>
        )}

        {confetti.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(p.angle) * p.dist, y: Math.sin(p.angle) * p.dist, opacity: 0, scale: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 pointer-events-none rounded-sm"
            style={{ transform: 'translate(-50%,-50%)', width: `${p.size}px`, height: `${p.size}px`, background: p.color }}
          />
        ))}

        {incomingReaction && (
          <motion.div
            key={`incoming-${incomingReaction}`}
            initial={{ scale: 0, y: 0, opacity: 0 }}
            animate={{ scale: 1.15, y: -30, opacity: 1 }}
            exit={{ scale: 0, y: -60, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center text-5xl pointer-events-none"
          >
            {incomingReaction}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
