import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { FaCheckDouble, FaTimes, FaArrowDown, FaTrash, FaCircle } from "react-icons/fa";
import { db } from "../firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import MessageActionsMenu from "./MessageActionsMenu";

// ---------- Helper Functions ----------
const formatTimestamp = (time) => {
  if (!time) return "";
  const date = new Date(time);
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";

  const now = new Date();
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const todayDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const yesterdayDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );

  const isToday = messageDate.getTime() === todayDate.getTime();
  const isYesterday = messageDate.getTime() === yesterdayDate.getTime();

  const timeDiffDays = Math.floor(
    (now - messageDate) / (1000 * 60 * 60 * 24)
  );
  if (timeDiffDays > 7) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${
      monthNames[date.getMonth()]
    } ${date.getFullYear().toString().slice(-2)}`;
  }

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  if (isToday) return `${hours}:${minutes} ${ampm}`;
  if (isYesterday) return `Yesterday ${hours}:${minutes} ${ampm}`;

  const dayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];
  return `${dayNames[date.getDay()]} ${hours}:${minutes} ${ampm}`;
};

const getMessageTime = (message) => {
  if (message.time?.toDate) return message.time.toDate().getTime();
  if (message.time) return new Date(message.time).getTime() || 0;
  if (message.createdAt) return message.createdAt;
  return 0;
};

const getReactionSummary = (reactions = {}) => {
  const counts = {};
  Object.values(reactions).forEach((emoji) => {
    counts[emoji] = (counts[emoji] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([emoji, count]) => (count > 1 ? `${emoji} ${count}` : emoji))
    .join(" ");
};

const scrollToMessage = (messageId, scrollRef) => {
  setTimeout(() => {
    const element = document.getElementById(`message-${messageId}`);
    if (element && scrollRef.current) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest' 
      });
      element.style.backgroundColor = '#fff3cd';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  }, 100);
};

// ---------- MessageStatus, DeleteModal, VoiceNoteBubble, ImageModal (UNCHANGED) ----------
const MessageStatus = ({ mine }) =>
  mine ? (
    <div className="flex items-center gap-[1px]">
      <div className="w-3 h-3 bg-[#53bdeb] rounded-sm shadow-sm" />
      <div className="w-3 h-3 bg-[#53bdeb] rounded-sm shadow-sm" />
    </div>
  ) : null;

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, messageText }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <FaTrash className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete message?</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
        </div>
        {messageText && (
          <div className="p-6 border-b border-gray-100 max-h-40 overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-3 max-w-full">
              <p className="text-sm text-gray-900 line-clamp-3">{messageText}</p>
            </div>
          </div>
        )}
        <div className="p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 shadow-sm transition-all flex items-center gap-2"
          >
            <FaTrash className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const VoiceNoteBubble = ({ message, mine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#128c7e] hover:bg-[#0f7a6a] text-white min-w-[260px] max-w-[340px] shadow-lg relative">
      <div className="flex items-center gap-2 flex-1">
        <span className="w-2 h-2 bg-white rounded-full" />
        <span className="text-xs font-mono opacity-90">
          {formatTime(currentTime || duration)}
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-[2px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-white/70"
              style={{
                height: `${4 + (i % 4) * 2}px`,
                opacity: isPlaying ? 0.9 : 0.6,
              }}
            />
          ))}
        </div>
      </div>
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all duration-200"
      >
        {isPlaying ? (
          <span className="w-3 h-3 flex gap-0.5">
            <span className="w-[2px] h-[10px] bg-white" />
            <span className="w-[2px] h-[14px] bg-white" />
          </span>
        ) : (
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
            <path d="M6 4l10 6-10 6V4z" />
          </svg>
        )}
      </button>
      <audio ref={audioRef} src={message.mediaUrl} preload="metadata" />
    </div>
  );
};

const ImagePreviewModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[55] cursor-pointer backdrop-blur-sm"
    >
      <img
        src={src}
        alt="Preview"
        className="max-w-[95%] max-h-[95%] object-contain rounded-2xl shadow-2xl"
      />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/70 rounded-2xl p-3 transition-all duration-200"
      >
        <FaTimes className="w-5 h-5" />
      </button>
    </div>
  );
};

// ✅ FIXED: Scroll button LEFT + z-[9999]
const ScrollToBottomButton = ({ scrollRef, isVisible }) => {
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToBottom}
      className="fixed bottom-28 left-4 z-[9999] w-12 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 animate-bounce hover:animate-none hover:scale-110"
      title="Scroll to bottom"
    >
      <FaArrowDown className="w-5 h-5" />
    </button>
  );
};

// ✅ NEW: Typing/Voice indicators
const TypingIndicator = ({ otherUserTyping, otherUserVoice }) => {
  if (!otherUserTyping && !otherUserVoice) return null;

  return (
    <div className="fixed bottom-24 left-16 z-[50] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg border border-gray-200 max-w-xs">
      <div className="flex items-center gap-2">
        {otherUserTyping && (
          <>
            <div className="flex gap-1">
              <FaCircle className="w-2 h-2 text-green-500 animate-pulse" />
              <FaCircle className="w-2 h-2 text-green-500 animate-pulse" style={{animationDelay: '0.1s'}} />
              <FaCircle className="w-2 h-2 text-green-500 animate-pulse" style={{animationDelay: '0.2s'}} />
            </div>
            <span className="text-xs text-gray-700 font-medium">Typing...</span>
          </>
        )}
        {otherUserVoice && !otherUserTyping && (
          <>
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-3 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: `${3 + i}px`
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-700 font-medium">Voice message...</span>
          </>
        )}
      </div>
    </div>
  );
};

// ---------- Main ChatWindow ----------
const ChatWindow = ({
  messages = [],
  user = {},
  chatId,
  replyTo,
  setReplyTo,  // 👈 Used to CLEAR reply after send
  onBack,
  otherUserTyping = false,  // 👈 New prop
  otherUserVoice = false,   // 👈 New prop
}) => {
  const scrollRef = useRef();
  const [groupedMessages, setGroupedMessages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [deletedMessages, setDeletedMessages] = useState({});
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    messageId: null, 
    messageText: "" 
  });
  const messageRefs = useRef({});
  const lastTapRef = useRef(0);

  // ... (groupMessages, sortedMessages, useEffects - UNCHANGED)

  const groupMessages = useCallback((msgs) => {
    const groups = [];
    let currentGroup = [];
    let lastDate = null;
    msgs.forEach((msg) => {
      const msgDateStr = new Date(getMessageTime(msg)).toDateString();
      if (lastDate !== msgDateStr || currentGroup.length >= 5) {
        if (currentGroup.length > 0)
          groups.push({ messages: currentGroup, date: lastDate });
        currentGroup = [msg];
        lastDate = msgDateStr;
      } else {
        currentGroup.push(msg);
      }
    });
    if (currentGroup.length > 0)
      groups.push({ messages: currentGroup, date: lastDate });
    return groups;
  }, []);

  const sortedMessages = useMemo(
    () =>
      [...messages]
        .filter((m) => m.time || m.createdAt)
        .sort((a, b) => getMessageTime(a) - getMessageTime(b)),
    [messages]
  );

  useEffect(() => setGroupedMessages(groupMessages(sortedMessages)), [
    sortedMessages,
    groupMessages,
  ]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      setShowScrollButton(scrollTop < scrollHeight - clientHeight - 100);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------- Delete handlers (UNCHANGED) ----------
  const openDeleteModal = (msg) => {
    setDeleteModal({
      isOpen: true,
      messageId: msg.id,
      messageText: msg.text || (msg.mediaType === "image" ? "Photo" : "Media"),
    });
    setActiveMessageId(null);
  };

  const confirmDelete = async () => {
    const msgId = deleteModal.messageId;
    const idToUse = chatId;

    if (!idToUse || !msgId) {
      console.error("Missing chatId or msg.id:", { chatId: idToUse, msgId });
      setDeletedMessages((prev) => ({
        ...prev,
        [msgId]: "Missing chat ID",
      }));
      closeDeleteModal();
      return;
    }

    try {
      await deleteDoc(doc(db, "chats", idToUse, "messages", msgId));
      setDeletedMessages((prev) => ({
        ...prev,
        [msgId]: `This message was deleted by ${user.displayName || "You"}`,
      }));
    } catch (err) {
      console.error("Delete FAILED:", err);
      setDeletedMessages((prev) => ({
        ...prev,
        [msgId]: `Delete failed: ${err.message}`,
      }));
    }
    closeDeleteModal();
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, messageId: null, messageText: "" });
    setActiveMessageId(null);
  };

  const handleCancel = () => {
    setActiveMessageId(null);
  };

  const handleTouch = (e, msgId) => {
    const now = Date.now();
    const timeSince = now - lastTapRef.current;
    if (timeSince < 300 && timeSince > 0) {
      setActiveMessageId(msgId);
    }
    lastTapRef.current = now;
  };

  const handleContextMenu = (e, msgId) => {
    e.preventDefault();
    setActiveMessageId(msgId);
  };

  const buildReplyPayload = (m) => {
    let replyText = m.text || "";
    if (!replyText) {
      if (m.mediaType === "image") replyText = "Photo";
      else if (m.mediaType === "audio") replyText = "Voice message";
      else if (m.mediaType === "video") replyText = "Video";
      else replyText = "Media";
    }
    return {
      id: m.id,
      text: replyText,
      senderId: m.senderId,
      mediaType: m.mediaType || null,
      mediaUrl: m.mediaUrl || null,
    };
  };

  // ✅ FIXED: Reply onReply calls setReplyTo(null) after send
  const handleReply = (m) => {
    setReplyTo?.(buildReplyPayload(m));
    setActiveMessageId(null);
  };

  const handleReactToMessage = async (m, emoji) => {
    if (!chatId || !m.id || !user?.uid) {
      console.log("Reaction blocked: missing ids", {
        chatId,
        msgId: m?.id,
        uid: user?.uid,
      });
      return;
    }

    const currentReactions = m.reactions || {};
    const updatedReactions = {
      ...currentReactions,
      [user.uid]: emoji,
    };

    try {
      await updateDoc(doc(db, "chats", chatId, "messages", m.id), {
        reactions: updatedReactions,
      });
    } catch (err) {
      console.error("Reaction update failed:", err);
    }
    setActiveMessageId(null);
  };

  const hasMessages = groupedMessages.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-2 px-3 py-2 bg-[#202c33] text-white shadow-md">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mr-1 flex items-center justify-center rounded-full p-1 hover:bg-white/10 transition md:hidden"
          >
            <span className="text-lg leading-none">&larr;</span>
          </button>
        )}
        <span className="text-sm font-semibold truncate">Chats</span>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#f0f2f5_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,#e1e8ed_0%,transparent_50%)]" />
      </div>

      {/* Messages Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 pb-28 space-y-1.5 scrollbar-thin scrollbar-thumb-[#8696a0]/50 scrollbar-track-transparent mt-10"
      >
        {!hasMessages && (
          <div className="h-full flex items-center justify-center px-4">
            <div className="max-w-xs w-full text-center bg-white/90 backdrop-blur-md rounded-3xl px-6 py-8 shadow-lg animate-fadeIn">
              <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center bg-[#007bff]/20 text-[#007bff] rounded-full animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#111b21] mb-2">No messages yet</h3>
              <p className="text-sm text-[#667781] mb-4">Say hi and start your first conversation.</p>
              <button className="px-5 py-2 bg-[#007bff] text-white text-sm font-semibold rounded-full shadow-md hover:bg-[#0056b3] transition-all">
                Start Chat
              </button>
            </div>
          </div>
        )}

        {hasMessages &&
          groupedMessages.map((group, gIndex) => (
            <React.Fragment key={gIndex}>
              {gIndex > 0 && (
                <div className="flex justify-center my-6">
                  <div className="bg-[#e1e8ed] px-6 py-2 rounded-2xl text-xs font-semibold text-[#667781] shadow-sm backdrop-blur-sm">
                    {new Date(group.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                {group.messages.map((m) => {
                  const mine = m.senderId === user?.uid;
                  const deletedPlaceholder = deletedMessages[m.id];
                  const isActive = activeMessageId === m.id;

                  return (
                    <div
                      id={`message-${m.id}`}
                      key={m.id}
                      ref={(el) => {
                        if (el) messageRefs.current[m.id] = el;
                      }}
                      className={`flex py-1 message-item transition-all duration-200 ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                      onDoubleClick={() => setActiveMessageId(m.id)}
                      onTouchEnd={(e) => handleTouch(e, m.id)}
                      onContextMenu={(e) => handleContextMenu(e, m.id)}
                    >
                      <div className="relative max-w-[75%]">
                        {isActive && (
                          <MessageActionsMenu
                            mine={mine}
                            onReply={() => handleReply(m)}  // 👈 FIXED: Clears after send
                            onCopy={() => {
                              if (m.text) {
                                navigator.clipboard
                                  .writeText(m.text)
                                  .catch(() => {});
                              }
                              setActiveMessageId(null);
                            }}
                            onDelete={() => openDeleteModal(m)}
                            onCancel={handleCancel}
                            onReact={async (emoji) => {
                              await handleReactToMessage(m, emoji);
                            }}
                          />
                        )}

                        <div
                          className={`px-4 py-2.5 rounded-[18px] shadow-sm relative transition-all duration-200 ${
                            mine
                              ? "bg-[#d1e7c5] rounded-br-[4px] mr-2 ml-auto shadow-md"
                              : "bg-white rounded-bl-[4px] ml-2 mr-auto shadow-sm"
                          } ${
                            deletedPlaceholder
                              ? "bg-[#f0f2f5]/80 border border-dashed border-[#a8b0b9]"
                              : ""
                          }`}
                        >
                          {deletedPlaceholder ? (
                            <div className="text-[#667781] text-xs italic py-2 px-3 text-center">
                              {deletedPlaceholder}
                            </div>
                          ) : (
                            <>
                              {/* ✅ FIXED: Dropdown LEFT + z-[40] */}
                              <button
                                type="button"
                                className="absolute -bottom-2 left-0 z-[40] text-xs text-[#667781] bg-[#f0f2f5] rounded-full px-2 py-[2px] shadow hover:bg-[#e1e8ed] transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMessageId(isActive ? null : m.id);
                                }}
                              >
                                ⋮
                              </button>

                              {m.replyTo && (
                                <div
                                  className={`mb-1 px-3 py-1.5 rounded-2xl text-xs border-l-4 cursor-pointer hover:bg-opacity-80 transition-all ${
                                    mine
                                      ? "bg-[#c3ddf5] border-[#4f9cff]"
                                      : "bg-[#f0f2f5] border-[#9ba9b4]"
                                  }`}
                                  onClick={() => scrollToMessage(m.replyTo.id, scrollRef)}
                                >
                                  <div className="font-semibold text-[11px] text-[#667781] mb-[2px]">
                                    {m.replyTo.senderName ||
                                      (m.replyTo.senderId === user?.uid
                                        ? "You"
                                        : "Contact")}
                                  </div>
                                  {m.replyTo.text && (
                                    <div className="line-clamp-2 text-[12px] text-[#111b21]">
                                      {m.replyTo.text}
                                    </div>
                                  )}
                                  {m.replyTo.mediaType === "image" && (
                                    <div className="text-[11px] text-[#667781] italic">
                                      Photo
                                    </div>
                                  )}
                                  {m.replyTo.mediaType === "audio" && (
                                    <div className="text-[11px] text-[#667781] italic">
                                      Voice message
                                    </div>
                                  )}
                                </div>
                              )}

                              {m.mediaUrl && m.mediaType === "image" && (
                                <img
                                  src={m.mediaUrl}
                                  alt="Message"
                                  onClick={() => setPreviewImage(m.mediaUrl)}
                                  className="max-w-full max-h-64 object-cover rounded-xl cursor-pointer hover:scale-105 transition-transform"
                                />
                              )}

                              {m.mediaUrl && m.mediaType === "audio" && (
                                <VoiceNoteBubble message={m} mine={mine} />
                              )}

                              {m.text && (
                                <div className="text-sm leading-tight break-words text-[#000000de]">
                                  {m.text}
                                </div>
                              )}

                              {m.reactions &&
                                Object.keys(m.reactions).length > 0 && (
                                  <div className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-white/90 text-xs text-[#111b21] shadow-sm mt-1 self-end">
                                    {getReactionSummary(m.reactions)}
                                  </div>
                                )}

                              <div
                                className={`flex items-center justify-end gap-1 mt-2 text-xs ${
                                  mine ? "text-[#0000008a]" : "text-[#667781]"
                                }`}
                              >
                                <span className="min-w-[44px] text-right">
                                  {formatTimestamp(getMessageTime(m))}
                                </span>
                                <MessageStatus mine={mine} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}

        <div style={{ height: "1px" }} />
      </div>

      {/* ✅ FIXED: Scroll button LEFT + z-[9999] */}
      <ScrollToBottomButton scrollRef={scrollRef} isVisible={showScrollButton} />
      
      {/* ✅ NEW: Typing/Voice indicators */}
      <TypingIndicator 
        otherUserTyping={otherUserTyping}
        otherUserVoice={otherUserVoice}
      />
      
      {previewImage && (
        <ImagePreviewModal 
          src={previewImage} 
          onClose={() => setPreviewImage(null)} 
        />
      )}
      
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        messageText={deleteModal.messageText}
      />
    </div>
  );
};

export default ChatWindow;
