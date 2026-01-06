import React from "react";
import { FaReply, FaHeart } from "react-icons/fa";
import VoiceNoteBubble from "./VoiceNoteBubble";
import MessageStatus from "./MessageStatus";

const ChatMessage = ({
  message,
  mine,
  user,
  deleted,
  likes,
  likedByUser,
  reactions,
  replies,
  onLike,
  onReplyClick,
  onSwipeReply,
  onContextMenu,
  onDoubleClick,
  onOpenMedia,
  formatTimestamp,
  getMessageTime,
  messageStatus,
}) => {
  if (deleted) {
    return (
      <div className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-400 italic">
        This message has been deleted
      </div>
    );
  }

  return (
    <>
      {/* Reply preview */}
      {message.replyTo && (
        <div
          onClick={onReplyClick}
          className="mb-1 px-2 py-1 bg-gray-100 rounded-l-md border-l-2 border-blue-500 text-sm italic cursor-pointer"
        >
          {message.replyTo.text.length > 50
            ? message.replyTo.text.slice(0, 50) + "..."
            : message.replyTo.text}
        </div>
      )}

      {/* MEDIA */}
      {message.mediaType === "audio" && (
        <VoiceNoteBubble message={message} mine={mine} />
      )}

      {message.mediaType === "image" && (
        <img
          src={message.mediaUrl}
          className="rounded-lg max-w-[200px] max-h-[150px] object-cover cursor-pointer"
          onClick={() => onOpenMedia("image")}
        />
      )}

      {message.mediaType === "video" && (
        <video
          src={message.mediaUrl}
          className="rounded-lg max-w-[200px] max-h-[150px] object-cover cursor-pointer"
          muted
          playsInline
          onClick={() => onOpenMedia("video")}
        />
      )}

      {/* TEXT */}
      {message.text && (
        <div className="whitespace-pre-wrap mt-1">{message.text}</div>
      )}

      {/* REACTIONS */}
      {reactions.size > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {[...reactions.entries()].map(([emoji, count]) => (
            <div
              key={emoji}
              className="bg-white px-2 py-1 rounded-full text-xs shadow flex gap-1"
            >
              {emoji} <span>{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* LIKE */}
      <button
        onClick={onLike}
        className={`flex items-center gap-1 text-xs mt-1 ${
          likedByUser ? "text-red-500" : "text-gray-400"
        }`}
      >
        <FaHeart /> {likes.size || ""}
      </button>

      {/* FOOTER */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
        <span>{formatTimestamp(getMessageTime(message))}</span>
        {mine && <MessageStatus status={messageStatus} mine />}
      </div>
    </>
  );
};

export default React.memo(ChatMessage);
