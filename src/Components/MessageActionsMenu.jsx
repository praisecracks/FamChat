import React from "react";
import { FaReply, FaTrashAlt, FaRegCopy, FaTimes } from "react-icons/fa";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "😡"];

const MessageActionsMenu = ({ mine, onReply, onCopy, onDelete, onCancel, onReact }) => {
  // Position menu differently based on message side
  const menuPosition = mine
    ? "absolute -top-14 right-2" // your messages: menu appears above, aligned right
    : "absolute -top-14 left-2"; // others' messages: menu appears above, aligned left

  return (
    <div
      className={`${menuPosition} bg-[#f0f2f5] shadow-2xl rounded-2xl border border-[#e9edef] px-3 py-2 flex flex-col gap-2 z-50 min-w-[180px]`}
    >
      {/* Reactions row */}
      <div className="flex items-center justify-between gap-1">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="text-lg hover:scale-110 transition-transform"
            onClick={() => onReact?.(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-[#d1d7db] my-1" />

      {/* Actions */}
      <button
        type="button"
        onClick={onReply}
        className="flex items-center gap-2 text-xs font-semibold text-[#128c7e] hover:bg-[#e1f3f0] px-2 py-1 rounded-xl text-left"
      >
        <FaReply className="w-3 h-3" />
        <span>Reply</span>
      </button>

      <button
        type="button"
        onClick={onCopy}
        className="flex items-center gap-2 text-xs font-semibold text-[#111b21] hover:bg-gray-100 px-2 py-1 rounded-xl text-left"
      >
        <FaRegCopy className="w-3 h-3" />
        <span>Copy</span>
      </button>

      {mine && (
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-2 text-xs font-semibold text-red-500 hover:bg-red-50 px-2 py-1 rounded-xl text-left"
        >
          <FaTrashAlt className="w-3 h-3" />
          <span>Delete</span>
        </button>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-xs font-semibold text-[#667781] hover:bg-gray-100 px-2 py-1 rounded-xl text-left"
      >
        <FaTimes className="w-3 h-3" />
        <span>Cancel</span>
      </button>
    </div>
  );
};

export default MessageActionsMenu;
