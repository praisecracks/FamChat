import React from 'react';
import { FaPaperPlane } from 'react-icons/fa';

export default function ReplyBar({ reply, setReply, onSend, setIsReplying }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-black/80">
      <input
        value={reply}
        onFocus={() => { setIsReplying(true); }}
        onBlur={() => { setIsReplying(false); }}
        onChange={(e) => { setReply(e.target.value); setIsReplying(!!e.target.value); }}
        placeholder="Reply to status..."
        className="flex-1 bg-white/10 text-white px-4 py-2 rounded-full outline-none"
      />
      <button onClick={onSend} className="text-white text-xl">
        <FaPaperPlane />
      </button>
    </div>
  );
}
