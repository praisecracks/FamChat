import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaCheck, FaCheckDouble, FaReply, FaTimes, FaArrowLeft, FaDownload, 
  FaHeart, FaClock, FaCopy, FaShare, FaStar, FaSearch, FaTrash, 
  FaExclamationTriangle
} from "react-icons/fa";

// ✅ FIXED: Proper timestamp formatting with correct day detection
const formatTimestamp = (time) => {
  if (!time) return "";
  const date = new Date(time);
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";

  const now = new Date();
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  const isToday = messageDate.getTime() === todayDate.getTime();
  const isYesterday = messageDate.getTime() === yesterdayDate.getTime();

  // Full date if more than a week old
  const timeDiffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
  if (timeDiffDays > 7) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
  }

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  if (isToday) return `${hours}:${minutes} ${ampm}`;
  if (isYesterday) return `Yesterday ${hours}:${minutes} ${ampm}`;
  
  // This week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${dayNames[date.getDay()]} ${hours}:${minutes} ${ampm}`;
};

// Get safe timestamp
const getMessageTime = (message) => {
  if (message.time?.toDate) return message.time.toDate().getTime();
  if (message.time) {
    const date = new Date(message.time);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }
  if (message.createdAt) return message.createdAt;
  return 0;
};

// Message status icons
const MessageStatus = ({ status, mine }) => {
  switch (status) {
    case "sending":
      return (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
      );
    case "sent":
      return mine ? <FaCheck className="text-blue-400 text-xs" /> : null;
    case "delivered":
      return mine ? (
        <FaCheckDouble className="text-blue-400 text-xs" />
      ) : null;
    case "read":
      return mine ? (
        <FaCheckDouble className="text-green-500 text-xs" />
      ) : null;
    default:
      return null;
  }
};

const ReactionPicker = ({ messageId, onSelect }) => {
  const reactions = ["👍", "😂", "😮", "😢", "🔥", "❤️"];
  
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-2xl p-2 border flex gap-1 z-20">
      {reactions.map((emoji) => (
        <button
          key={emoji}
          className="text-2xl p-1 hover:bg-gray-100 rounded-xl transition-all"
          onClick={() => onSelect(messageId, emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

const ChatWindow = ({ 
  messages = [], 
  user = {}, 
  replyTo, 
  setReplyTo, 
  isOnline = true
}) => {
  const scrollRef = useRef();
  const messageRefs = useRef({});
  const location = useLocation();
  const navigate = useNavigate();

  const [activeMessageId, setActiveMessageId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mediaModal, setMediaModal] = useState({ open: false, mediaUrl: "", mediaType: "" });
  const [replyToStatus, setReplyToStatus] = useState(null);
  const [messageLikes, setMessageLikes] = useState({});
  const [messageReactions, setMessageReactions] = useState({});
  const [deletedMessages, setDeletedMessages] = useState({});
  const [undoQueue, setUndoQueue] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [swipeState, setSwipeState] = useState({
    messageId: null, startX: 0, currentX: 0, swiping: false,
  });
  const [deleteModal, setDeleteModal] = useState({ open: false, message: null });
  const longPressTimeout = useRef(null);
  const dragging = useRef(false);

  // Features 4-8 state
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, messageId: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [retryMessages, setRetryMessages] = useState({});
  const [groupedMessages, setGroupedMessages] = useState([]);

  // useEffects
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (location.state?.replyToStatus) {
      setReplyToStatus(location.state.replyToStatus);
    }
  }, [location.state]);

  // ✅ FIXED: Proper message grouping with date separators
  const groupMessages = useCallback((msgs) => {
    const groups = [];
    let currentGroup = [];
    let lastDate = null;

    msgs.forEach((msg) => {
      const msgDate = new Date(getMessageTime(msg));
      const msgDateStr = msgDate.toDateString();
      
      if (lastDate !== msgDateStr || currentGroup.length >= 5) {
        if (currentGroup.length > 0) {
          groups.push({ messages: currentGroup, date: lastDate });
        }
        currentGroup = [msg];
        lastDate = msgDateStr;
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ messages: currentGroup, date: lastDate });
    }
    
    return groups;
  }, []);

  const sortedMessages = useMemo(() => 
    [...messages]
      .filter((m) => m.time || m.createdAt)
      .sort((a, b) => getMessageTime(a) - getMessageTime(b)),
  [messages]);

  useEffect(() => {
    const groups = groupMessages(sortedMessages);
    setGroupedMessages(groups);
  }, [sortedMessages, groupMessages]);

  // ✅ FIXED: Get proper date separator text
  const getDateSeparator = (dateStr) => {
    const msgDate = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (msgDate.getTime() === today.getTime()) return "Today";
    if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
    
    const timeDiffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
    if (timeDiffDays <= 7) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return dayNames[msgDate.getDay()];
    }
    
    return msgDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handlers
  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-blue-100");
      setTimeout(() => el.classList.remove("bg-blue-100"), 800);
    }
  };

  const handleTouchStart = (e, messageId) => {
    setSwipeState({
      messageId,
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      swiping: true,
    });
  };

  const handleTouchMove = (e) => {
    if (!swipeState.swiping) return;
    setSwipeState((prev) => ({ ...prev, currentX: e.touches[0].clientX }));
  };

  const handleTouchEnd = (message) => {
    if (!swipeState.swiping || swipeState.messageId !== message.id) return;
    const deltaX = swipeState.currentX - swipeState.startX;
    if (deltaX > 50 && setReplyTo) setReplyTo(message);
    setSwipeState({ messageId: null, startX: 0, currentX: 0, swiping: false });
  };

  const [backPos, setBackPos] = useState({ x: 10, y: 10 });
  const handleDragStart = () => (dragging.current = true);
  const handleDrag = (e) => {
    if (!dragging.current) return;
    setBackPos({ x: e.clientX - 20, y: e.clientY - 20 });
  };
  const handleDragEnd = () => (dragging.current = false);

  const handleDownload = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "media";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleLike = (msgId) => {
    setMessageLikes((prev) => {
      const current = new Set(prev[msgId] || []);
      if (current.has(user.uid)) current.delete(user.uid);
      else current.add(user.uid);
      return { ...prev, [msgId]: current };
    });
  };

  const addReaction = (msgId, emoji) => {
    setMessageReactions((prev) => {
      const current = new Map(prev[msgId] || []);
      const count = current.get(emoji) || 0;
      current.set(emoji, count + 1);
      return { ...prev, [msgId]: current };
    });
    setShowReactionPicker(null);
  };

  const handleLongPressStart = (msg) => {
    if (msg.senderId !== user.uid || deletedMessages[msg.id]) return;
    longPressTimeout.current = setTimeout(() => {
      setDeleteModal({ open: true, message: msg });
    }, 700);
  };

  const handleLongPressEnd = () => clearTimeout(longPressTimeout.current);

  const confirmDelete = () => {
    const msg = deleteModal.message;
    if (!msg) return;
    setDeletedMessages((prev) => ({ ...prev, [msg.id]: true }));
    setDeleteModal({ open: false, message: null });
    setUndoQueue((prev) => [...prev, msg.id]);
    setTimeout(() => {
      setUndoQueue((prev) => prev.filter((id) => id !== msg.id));
    }, 5000);
  };

  const undoDelete = (msgId) => {
    setDeletedMessages((prev) => {
      const newState = { ...prev };
      delete newState[msgId];
      return newState;
    });
    setUndoQueue((prev) => prev.filter((id) => id !== msgId));
  };

  const handleContextMenu = useCallback((e, message) => {
    e.preventDefault();
    if (message.senderId === user.uid || !deletedMessages[message.id]) {
      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        messageId: message.id
      });
    }
  }, [user.uid, deletedMessages]);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setContextMenu(prev => ({ ...prev, show: false }));
  }, []);

  const handleForward = useCallback((message) => {
    console.log('Forwarding:', message);
    setContextMenu(prev => ({ ...prev, show: false }));
  }, []);

  const handleStar = useCallback((messageId) => {
    console.log('Starring:', messageId);
    setContextMenu(prev => ({ ...prev, show: false }));
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = sortedMessages
      .map((msg, index) => ({
        msg,
        index,
        matches: msg.text?.toLowerCase().includes(query.toLowerCase()) || false
      }))
      .filter(result => result.matches)
      .map(result => result.index);
    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [sortedMessages]);

  const jumpToSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const index = searchResults[currentSearchIndex];
    scrollToMessage(sortedMessages[index]?.id);
  }, [searchResults, currentSearchIndex, sortedMessages]);

  const retryMessage = useCallback((messageId) => {
    setRetryMessages(prev => {
      const newState = { ...prev };
      delete newState[messageId];
      return newState;
    });
  }, []);

  return (
<div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-blue-100 pb-20 relative">
  {/* Mobile back button */}
  {isMobile && (
    <FaArrowLeft
      className="absolute z-50 h-8 w-8 text-white bg-blue-600 rounded-full p-2 shadow cursor-pointer lg:hidden"
      style={{ left: backPos.x, top: backPos.y }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDrag}
      onMouseUp={handleDragEnd}
      onClick={() => window.location.reload()}
    />
  )}

      {/* Reply previews */}
      {replyToStatus && (
        <div className="flex items-center bg-blue-100 px-3 py-2 border-l-4 border-blue-600 sticky top-0 z-50 gap-2">
          {replyToStatus.type !== "text" && (
            <img src={replyToStatus.url} alt="status" className="w-12 h-12 rounded object-cover" />
          )}
          <span className="text-sm text-gray-800 truncate flex-1">
            {replyToStatus.caption || replyToStatus.type}
          </span>
          <button onClick={() => setReplyToStatus(null)}>
            <FaTimes />
          </button>
        </div>
      )}

      {replyTo && (
        <div className="flex items-center bg-gray-200 px-3 py-2 border-l-4 border-blue-500 sticky top-0 z-50">
          <span className="text-sm truncate flex-1">{replyTo.text}</span>
          <button onClick={() => setReplyTo(null)} className="ml-2">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Search Bar */}
      {searchQuery && (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b px-4 py-3 flex gap-2 items-center">
          <FaSearch className="text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search messages..."
          />
          <button 
            onClick={() => {setSearchQuery(""); setSearchResults([]);}}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes />
          </button>
          {searchResults.length > 0 && (
            <div className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
              {currentSearchIndex + 1}/{searchResults.length}
              <button 
                onClick={jumpToSearchResult}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ↓
              </button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 text-blue-500 text-4xl mb-4">
              👋
            </div>
            <div className="text-gray-500 text-sm">No messages yet</div>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {/* ✅ FIXED: Proper date separator */}
              {groupIndex > 0 && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-200 px-4 py-2 rounded-full text-xs text-gray-600 font-medium shadow-sm">
                    {getDateSeparator(group.date)}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {group.messages.map((m, msgIndex) => {
                  const mine = m.senderId === user?.uid;
                  const isSwiping = swipeState.swiping && swipeState.messageId === m.id;
                  const translateX = isSwiping ? Math.min(swipeState.currentX - swipeState.startX, 80) : 0;
                  const replies = messages.filter((msg) => msg.replyTo?.id === m.id);
                  const likes = messageLikes[m.id] || new Set();
                  const likedByUser = likes.has(user.uid);
                  const reactions = messageReactions[m.id] || new Map();
                  const messageStatus = m.status || (mine ? "sent" : "delivered");
                  const isRetry = retryMessages[m.id] && !isOnline;

                  return (
                    <div
                      key={m.id || msgIndex}
                      ref={(el) => (messageRefs.current[m.id] = el)}
                      className={`flex ${mine ? "justify-end" : "justify-start"} mb-2 relative mt-14`}
                      onTouchStart={(e) => handleTouchStart(e, m.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd(m)}
                      onContextMenu={(e) => handleContextMenu(e, m)}
                    >
                      {/* Retry indicator */}
                      {isRetry && (
                        <button
                          className="absolute -right-12 top-1/2 -translate-y-1/2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
                          onClick={() => retryMessage(m.id)}
                        >
                          <FaExclamationTriangle size={14} />
                        </button>
                      )}

                      {/* Replies count */}
                      {replies.length > 0 && !deletedMessages[m.id] && (
                        <div
                          className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs cursor-pointer"
                          title={`${replies.length} reply${replies.length > 1 ? "ies" : ""}`}
                          onClick={() => {
                            const firstReply = messages.find(msg => msg.replyTo?.id === m.id);
                            if (firstReply) scrollToMessage(firstReply.id);
                          }}
                        >
                          {replies.length}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        onClick={() => setActiveMessageId(activeMessageId === m.id ? null : m.id)}
                        onMouseDown={() => handleLongPressStart(m)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(m)}
                        onTouchEnd={handleLongPressEnd}
                        className={`relative px-4 py-2 rounded-2xl max-w-[80%] shadow-sm transition-transform duration-150 ease-out cursor-pointer group ${
                          deletedMessages[m.id] ? "bg-gray-100 text-gray-400 italic" : ""
                        }`}
                        style={{
                          transform: `translateX(${translateX}px)`,
                          backgroundColor: deletedMessages[m.id]
                            ? "#f0f0f0"
                            : mine
                            ? "#cff6b1ff"
                            : "#ffffff",
                          border: mine && !deletedMessages[m.id] ? "none" : "1px solid #e0e0e0",
                        }}
                        onDoubleClick={() => setShowReactionPicker(m.id)}
                      >
                        {deletedMessages[m.id] ? (
                          <div className="text-center">
                            This message has been deleted by {user.displayName || "FamChat"}
                          </div>
                        ) : (
                          <>
                            {isSwiping && translateX > 10 && (
                              <FaReply
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-500 opacity-80"
                                size={14}
                              />
                            )}

                            {m.replyToStatus && (
                              <div
                                onClick={() => {
                                  try {
                                    navigate(`/status/view/${m.replyToStatus.userId}`, { state: { highlightStatusId: m.replyToStatus.id } });
                                  } catch (e) {}
                                }}
                                className="mb-1 px-2 py-1 bg-green-50 rounded-l-md border-l-2 border-green-500 text-sm text-gray-700 italic cursor-pointer hover:bg-green-100 flex items-center gap-2"
                                title="Open status"
                              >
                                {m.replyToStatus.type !== "text" && m.replyToStatus.url && (
                                  <img src={m.replyToStatus.url} alt="status" className="w-12 h-12 rounded object-cover" />
                                )}
                                <span className="truncate flex-1 text-sm">{m.replyToStatus.caption || m.replyToStatus.type}</span>
                              </div>
                            )}

                            {m.replyTo && (
                              <div
                                onClick={() => {
                                  const original = messages.find(msg => msg.id === m.replyTo.id);
                                  if (original) scrollToMessage(original.id);
                                }}
                                className="mb-1 px-2 py-1 bg-gray-100 rounded-l-md border-l-2 border-blue-500 text-sm text-gray-700 italic cursor-pointer hover:bg-gray-200"
                              >
                                {m.replyTo.text.length > 50
                                  ? m.replyTo.text.substring(0, 50) + "..."
                                  : m.replyTo.text}
                              </div>
                            )}

                            {m.mediaUrl && (
                              <div className="mb-1 cursor-pointer">
                                {m.mediaType === "image" ? (
                                  <img
                                    src={m.mediaUrl}
                                    alt="media"
                                    className="rounded-lg max-w-[200px] max-h-[150px] object-cover"
                                    onClick={() => setMediaModal({ open: true, mediaUrl: m.mediaUrl, mediaType: "image" })}
                                  />
                                ) : (
                                  <video
                                    src={m.mediaUrl}
                                    className="rounded-lg max-w-[200px] max-h-[150px] object-cover"
                                    onClick={() => setMediaModal({ open: true, mediaUrl: m.mediaUrl, mediaType: "video" })}
                                    muted
                                    playsInline
                                  />
                                )}
                              </div>
                            )}

                            {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}

                            {reactions.size > 0 && (
                              <div className="flex gap-1 mt-2 mb-1 flex-wrap">
                                {Array.from(reactions.entries()).map(([emoji, count]) => (
                                  <div key={emoji} className="bg-white/80 px-2 py-1 rounded-full text-xs shadow-sm flex items-center gap-0.5 border border-gray-200">
                                    <span>{emoji}</span>
                                    <span className="text-gray-500 font-bold">{count}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center mt-1 mb-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLike(m.id);
                                }}
                                className={`flex items-center gap-1 text-xs p-1 rounded-lg hover:bg-gray-200 transition-all ${
                                  likedByUser ? "text-red-500 bg-red-100" : "text-gray-400"
                                }`}
                              >
                                <FaHeart /> {likes.size > 0 ? likes.size : ""}
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                              <span>{formatTimestamp(getMessageTime(m))}</span>
                              {mine && (
                                <div className="flex items-center gap-1 ml-auto">
                                  <MessageStatus status={messageStatus} mine={mine} />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {showReactionPicker === m.id && (
                        <ReactionPicker messageId={m.id} onSelect={addReaction} />
                      )}

                      {undoQueue.includes(m.id) && (
                        <div className="absolute -bottom-7 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow flex gap-2">
                          <span>Message deleted</span>
                          <button onClick={() => undoDelete(m.id)} className="underline">UNDO</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed z-[1000] bg-white/95 backdrop-blur-xl shadow-2xl border rounded-2xl py-1 min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(prev => ({ ...prev, show: false }))}
        >
          <button 
            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 flex items-center gap-3 rounded-t-lg"
            onClick={() => {
              const msg = messages.find(m => m.id === contextMenu.messageId);
              handleCopy(msg?.text || '');
            }}
          >
            <FaCopy /> Copy
          </button>
          <button 
            className="w-full text-left px-4 py-3 text-blue-600 hover:bg-blue-50 flex items-center gap-3"
            onClick={() => {
              const msg = messages.find(m => m.id === contextMenu.messageId);
              if (setReplyTo) setReplyTo(msg);
              setContextMenu({ show: false, x: 0, y: 0, messageId: null });
            }}
          >
            <FaReply /> Reply
          </button>
          <button 
            className="w-full text-left px-4 py-3 text-orange-600 hover:bg-orange-50 flex items-center gap-3"
            onClick={() => {
              const msg = messages.find(m => m.id === contextMenu.messageId);
              handleForward(msg);
            }}
          >
            <FaShare /> Forward
          </button>
          <button 
            className="w-full text-left px-4 py-3 text-yellow-600 hover:bg-yellow-50 flex items-center gap-3"
            onClick={() => handleStar(contextMenu.messageId)}
          >
            <FaStar /> Star
          </button>
          {messages.find(m => m.id === contextMenu.messageId)?.senderId === user.uid && (
            <button 
              className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 border-t rounded-b-lg flex items-center gap-3"
              onClick={confirmDelete}
            >
              <FaTrash /> Delete
            </button>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-72 flex flex-col items-center gap-4">
            <h2 className="text-lg font-semibold">Delete message?</h2>
            <p className="text-sm text-gray-600 text-center">This action can be undone for 5 seconds.</p>
            <div className="flex gap-4 mt-4">
              <button
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                onClick={() => setDeleteModal({ open: false, message: null })}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {mediaModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300">
          <button
            className="absolute top-5 right-5 text-white text-3xl flex items-center gap-2"
            onClick={() => setMediaModal({ open: false, mediaUrl: "", mediaType: "" })}
          >
            <FaTimes />
          </button>
          {mediaModal.mediaType === "image" ? (
            <div className="relative">
              <img
                src={mediaModal.mediaUrl}
                alt="full-media"
                className="max-h-[90vh] max-w-[90vw] rounded-lg scale-95 animate-scaleIn"
              />
              <button
                className="absolute bottom-5 right-5 bg-white rounded-full p-2 text-gray-800 shadow"
                onClick={() => handleDownload(mediaModal.mediaUrl)}
              >
                <FaDownload />
              </button>
            </div>
          ) : (
            <div className="relative">
              <video
                src={mediaModal.mediaUrl}
                controls
                autoPlay
                className="max-h-[90vh] max-w-[90vw] rounded-lg scale-95 animate-scaleIn"
              />
              <button
                className="absolute bottom-5 right-5 bg-white rounded-full p-2 text-gray-800 shadow"
                onClick={() => handleDownload(mediaModal.mediaUrl)}
              >
                <FaDownload />
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default React.memo(ChatWindow);
