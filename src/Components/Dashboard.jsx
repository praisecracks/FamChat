// Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  getDocs,
  onSnapshot,
  orderBy,
  addDoc,
  where,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import Header from "./Header";
import SidebarDesktop from "./SidebarDesktop";
import SidebarMobile from "./SidebarMobile";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";
import FloatingButton from "./FloatingButton";
import MobileBottomNav from "./Utils/MobileBottomNav";
import { useToaster } from "./Utils/Toaster";
import ProfileModal from "./Modals/ProfileModal";
import MobileChatScreen from "./MobileChatScreen"; // ✅ NEW

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#f472b6",
  "#6366f1",
];

const getColorFromUsername = (username) => {
  if (!username) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash % COLORS.length)];
};

const Dashboard = () => {
  const { show: showToast } = useToaster();
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeScreen, setActiveScreen] = useState("chats");
  const [mobileView, setMobileView] = useState("chats"); // "chats" | "chat"
  const [unreadMap, setUnreadMap] = useState({});
  const [authUser, setAuthUser] = useState(null);
  const [currentUserDoc, setCurrentUserDoc] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  // Profile modal state
  const [profileModalUser, setProfileModalUser] = useState(null);

  const chatContainerRef = useRef(null);
  const markReadTimeout = useRef(null);

  // Detect mobile view
  useEffect(() => {
    const update = () =>
      setIsMobile(window.matchMedia("(max-width: 639px)").matches);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user || null);
      if (!user) {
        setCurrentUserDoc(null);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const unsubUserDoc = onSnapshot(
        userDocRef,
        (snap) =>
          setCurrentUserDoc(
            snap.exists() ? { uid: snap.id, ...snap.data() } : null
          ),
        (err) => console.error("User snapshot error:", err)
      );

      updateDoc(userDocRef, { online: true }).catch(() => {});
      return () => unsubUserDoc();
    });

    return () => unsubAuth();
  }, []);

  // Update online/offline status
  useEffect(() => {
    if (!authUser) return;
    const userDocRef = doc(db, "users", authUser.uid);

    const handleBeforeUnload = async () => {
      try {
        await updateDoc(userDocRef, {
          online: false,
          lastSeen: new Date(),
        });
      } catch {}
    };
    const handleVisibilityChange = async () => {
      try {
        await updateDoc(userDocRef, {
          online: document.visibilityState === "visible",
        });
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authUser]);

  const markMessagesAsRead = useCallback(
    async (chatId) => {
      if (!chatId || !authUser) return;
      clearTimeout(markReadTimeout.current);
      markReadTimeout.current = setTimeout(async () => {
        try {
          const msgsRef = collection(db, "chats", chatId, "messages");
          const q = query(msgsRef, where("read", "==", false));
          const snap = await getDocs(q);
          const promises = snap.docs
            .map((d) => {
              const data = d.data();
              if (data.senderId && data.senderId !== authUser.uid) {
                return updateDoc(
                  doc(db, "chats", chatId, "messages", d.id),
                  { read: true }
                );
              }
              return null;
            })
            .filter(Boolean);
          await Promise.all(promises);
        } catch (err) {
          console.error("markMessagesAsRead error:", err);
        }
      }, 220);
    },
    [authUser]
  );

  // Listen to messages
  useEffect(() => {
    if (!currentChat?.chatId) {
      setMessages([]);
      return;
    }
    const msgsRef = collection(db, "chats", currentChat.chatId, "messages");
    const q = query(msgsRef, orderBy("createdAt"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const loaded = snap.docs.map((d) => {
          const data = d.data();
          let time = "";
          try {
            if (data.createdAt?.toDate) {
              const dt = data.createdAt.toDate();
              time = dt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            } else if (data.createdAt?.seconds) {
              const dt = new Date(data.createdAt.seconds * 1000);
              time = dt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          } catch (e) {
            time = "";
          }
          return { id: d.id, ...data, time };
        });
        setMessages(loaded);

        // Scroll to bottom
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 50);

        markMessagesAsRead(currentChat.chatId);
      },
      (err) => {
        console.error("Messages snapshot error:", err);
        setError("Unable to load messages. Check permissions.");
      }
    );
    return () => unsub();
  }, [currentChat, markMessagesAsRead]);

  // Open chat with selected user
  const openChatWith = async (selectedUser) => {
    if (!authUser) {
      setError("You must be signed in to open a chat.");
      return;
    }
    try {
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", authUser.uid)
      );
      const snap = await getDocs(q);

      const existingChat = snap.docs.find((docSnap) => {
        const parts = docSnap.data().participants || [];
        return (
          parts.includes(selectedUser.uid) && parts.includes(authUser.uid)
        );
      });

      if (existingChat) {
        setCurrentChat({ chatId: existingChat.id, ...selectedUser });
      } else {
        const newChat = await addDoc(chatsRef, {
          participants: [authUser.uid, selectedUser.uid],
          createdAt: serverTimestamp(),
          lastMessage: "",
        });
        setCurrentChat({ chatId: newChat.id, ...selectedUser });
      }

      setActiveScreen("chats");
      if (isMobile) setMobileView("chat");
    } catch (err) {
      console.error("Failed to open chat:", err);
      setError("Cannot open chat. Check your Firebase permissions.");
    }
  };

  const totalUnread = Object.values(unreadMap).reduce(
    (a, b) => a + (b || 0),
    0
  );

  return (
    <div className="flex flex-col h-screen bg-gray-800">
      <Header
        chatUser={currentChat}
        appName="FamChat"
        currentUser={currentUserDoc}
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        unreadCount={totalUnread}
      />

      <div className="relative mt-16 lg:mt-0 flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden sm:block fixed inset-y-0 left-0 z-40">
          <SidebarDesktop
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            activeChatId={currentChat?.chatId}
            setActiveChatUser={openChatWith}
            setActiveChatId={(id) =>
              setCurrentChat((c) => ({ ...(c || {}), chatId: id }))
            }
            sidebarExpanded={sidebarExpanded}
            setSidebarExpanded={setSidebarExpanded}
            currentUser={currentUserDoc}
            unreadMap={unreadMap}
            setProfileModalUser={setProfileModalUser}
          />
        </div>

        {/* Mobile sidebar */}
        <div className="sm:hidden">
          <SidebarMobile
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            mobileView={mobileView}
            setMobileView={setMobileView}
            setActiveChatUser={openChatWith}
            setActiveChatId={(id) =>
              setCurrentChat((c) => ({ ...(c || {}), chatId: id }))
            }
            unreadMap={unreadMap}
            currentUser={currentUserDoc}
            setProfileModalUser={setProfileModalUser}
          />
        </div>

        {/* Main content */}
        <div className="h-full flex flex-col relative sm:ml-[92px]">
          {profileModalUser && (
            <ProfileModal
              user={profileModalUser}
              onClose={() => setProfileModalUser(null)}
            />
          )}

          {error && (
            <div className="p-4 bg-red-100 text-red-800 text-center font-medium">
              {error}
            </div>
          )}

          {/* MOBILE VIEW */}
          {isMobile ? (
            <div className="flex flex-col h-screen relative">
              {mobileView === "chat" ? (
                <MobileChatScreen
                  currentChat={currentChat}
                  messages={messages}
                  authUser={authUser}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  onBack={() => {
                    setMobileView("chats");
                    setCurrentChat(null);
                  }}
                />
              ) : (
                <div
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto pb-28 bg-[#0b1220]"
                >
                  {!currentChat && (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      Select a chat to start messaging
                    </div>
                  )}
                </div>
              )}

              {mobileView !== "chat" && (
                <MobileBottomNav
                  activeScreen={activeScreen}
                  setActiveScreen={setActiveScreen}
                  mobileView={mobileView}
                  setMobileView={setMobileView}
                />
              )}
            </div>
          ) : (
            // DESKTOP VIEW
            <>
              {!currentChat ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-4 relative overflow-hidden text-center">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        "url('https://i.ibb.co/1dR1qYw/whatsapp-bg-pattern.png')",
                      backgroundRepeat: "repeat",
                      backgroundSize: "60px 60px",
                    }}
                  />
                  <div className="relative animate-fadeIn">
                    <div className="mb-3 text-2xl sm:text-3xl font-bold text-white">
                      Welcome to FamChat 👋
                    </div>
                    <div className="mb-2 text-gray-300 text-base sm:text-lg">
                      Select a chat from the sidebar
                    </div>
                    <div className="text-sm text-gray-400">
                      Or tap{" "}
                      <span className="font-bold text-green-400">+</span> to
                      start a new chat
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="lg:mt-20 flex justify-center w-full mt-3 mb-2">
                    <div className="flex items-center gap-4 px-6 py-3 rounded-2xl backdrop-blur-lg bg-white/5 border border-white/10 shadow max-w-[720px] w-full text-white">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold"
                        style={{
                          backgroundColor: getColorFromUsername(
                            currentChat.username
                          ),
                        }}
                      >
                        {!currentChat.photoURL ? (
                          <span className="text-white">
                            {currentChat.username?.[0]?.toUpperCase() || "U"}
                          </span>
                        ) : (
                          <img
                            src={currentChat.photoURL}
                            className="w-12 h-12 rounded-full object-cover"
                            alt={currentChat.username}
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-lg">
                          {currentChat.username}
                        </span>
                        <span className="text-sm text-gray-300">
                          {currentChat.online ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div
                        className={`ml-auto w-3 h-3 rounded-full ${
                          currentChat.online
                            ? "bg-green-400"
                            : "bg-gray-500"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto ">
                    <ChatWindow
                      messages={messages}
                      user={authUser}
                      chatUser={currentChat}
                      chatId={currentChat.chatId}
                      replyTo={replyTo}
                      setReplyTo={setReplyTo}
                    />
                  </div>
                  <MessageInput
                    currentChat={currentChat}
                    user={authUser}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                  />
                </>
              )}
            </>
          )}

          <FloatingButton
            onClick={() => showToast({ message: "New chat coming soon" })}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
