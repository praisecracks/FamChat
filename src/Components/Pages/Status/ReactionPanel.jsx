import React from 'react';

const REACTIONS = ["❤️", "😂", "😮", "😢", "🔥"];

export default function ReactionPanel({ userReaction, counts = {}, onReact }) {
  return (
    <div className="absolute bottom-32 bg-black/70 px-4 py-2 rounded-full flex gap-3">
      {REACTIONS.map((r) => {
        const active = userReaction === r;
        const count = counts[r] || 0;
        return (
          <button
            key={r}
            onPointerUp={(e) => { e.stopPropagation(); onReact(r); }}
            onTouchStart={(e) => e.stopPropagation()}
            className={`text-2xl px-2 py-1 rounded ${active ? 'bg-white/20 scale-105' : ''}`}
          >
            <div className="flex flex-col items-center">
              <span>{r}</span>
              {count > 0 && <span className="text-xs text-white/80">{count}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
