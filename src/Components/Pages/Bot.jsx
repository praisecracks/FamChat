import React, { useState, useRef, useEffect, useCallback } from "react";
import SidebarDesktop from "../SidebarDesktop";
import SidebarMobile from "../SidebarMobile";
import MobileBottomNav from "../Utils/MobileBottomNav";
import Header from "../Header";

function Bot({ sidebarExpanded, setSidebarExpanded, currentUser }) {
  const [mobileView, setMobileView] = useState("ai");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // -------------------------------
  // Time formatter
  // -------------------------------
  const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // -------------------------------
  // AI Prompt Library
  // -------------------------------
  const aiPrompts = [
    {
      questions: [/hello/i, /hi/i, /hey/i, /good morning/i, /good afternoon/i],
      answers: [
        "Hello! 👋 I'm FamChat AI, your family chat buddy 😊 How can I help today?",
        "Hi there! 👨‍👩‍👧‍👦 Great to chat with you! What's on your mind?",
        "Hey! 😄 FamChat AI here - ready to help with family chats!"
      ]
    },
    {
      questions: [/name/i, /who are you/i, /what are you/i],
      answers: [
        "I'm FamChat AI 🤖, your friendly family chat assistant! I help with FamChat features and family bonding tips 😊"
      ]
    },
    {
      questions: [/how are/i, /you doing/i],
      answers: [
        "I'm doing great, thank you! 😊 Ready to help your family stay connected!",
        "Perfect! 👌 Just here assisting families with FamChat. How about you?",
        "All good! ✨ Excited to chat about family features!"
      ]
    },
    {
      questions: [/what is famchat/i, /what's famchat/i],
      answers: [
        "FamChat is a family-only chat app that connects families to share stories, experiences, and daily thoughts privately 👨‍👩‍👧‍👦💕"
      ]
    },
    {
      questions: [/developer/i, /who made/i, /dev/i],
      answers: [
        "Durotoluwa-Praise built FamChat! 👨‍💻 He's a software engineer creating family connection apps 😊"
      ]
    },
    {
      questions: [/feature/i, /what can/i],
      answers: [
        "FamChat family features 😍:\n✅ Private family groups\n✅ Story & photo sharing\n✅ Daily thoughts\n✅ Status updates\n✅ Voice notes\n✅ Family memories"
      ]
    },
    {
      questions: [/how/i, /chat/i],
      answers: [
        "Family chat guide 📱:\n1️⃣ Tap + → Family Group\n2️⃣ Add family only\n3️⃣ Share stories 📸\n4️⃣ Post thoughts 💭\n5️⃣ Voice notes 🎤"
      ]
    },
    {
      questions: [/status/i, /post/i],
      answers: [
        "Post family status 📸:\n1️⃣ Profile → My Status\n2️⃣ Photo + thought\n3️⃣ Family sees instantly 👨‍👩‍👧‍👦"
      ]
    },
    {
      questions: [/thank/i, /thanks/i],
      answers: [
        "You're welcome! 😊 Happy to help your family stay connected with FamChat!"
      ]
    },
    {
      questions: [/bye/i, /goodbye/i],
      answers: [
        "Bye! 👋 Keep sharing family moments on FamChat. See you soon! 😄"
      ]
    }
  ];

  // -------------------------------
  // AI Response Function with simple analysis
  // -------------------------------
  const getAIResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();

    // Analyze input for keywords
    const keyword = aiPrompts.find((prompt) =>
      prompt.questions.some((q) => q.test(input))
    );

    if (keyword) {
      const answers = keyword.answers;
      return answers[Math.floor(Math.random() * answers.length)];
    }

    // Catch-all response
    return `Hey! 😊 I'm FamChat AI - your family chat expert!

Try asking:
✨ "What is FamChat?"
👨‍💻 "Developer?"
📱 "How to chat?"
📸 "Post status?"

What family chat adventure shall we explore? 🚀`;
  };

  // -------------------------------
  // Send Message
  // -------------------------------
  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: text, time: formatTime() }
    ]);

    setIsLoading(true);
    setInputValue("");
    setIsTyping(true);

    const delay = Math.random() * 2000 + 1000; // 1-3s

    setTimeout(() => {
      const response = getAIResponse(text);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: response, time: formatTime() }
      ]);

      setIsTyping(false);
      setIsLoading(false);
    }, delay);
  };

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      sendMessage(inputValue);
    },
    [inputValue, isLoading]
  );

  // Quick actions
  const handleStartChat = () => sendMessage("Hello FamChat AI");
  const handleWhatIsFamChat = () => sendMessage("What is FamChat?");

  return (
    <div className="pt-20 flex h-dvh bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden sm:block fixed inset-y-0 left-0 z-40">
        <SidebarDesktop
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          currentUser={currentUser}
        />
      </div>

      <Header
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        currentUser={currentUser}
        appName="AI"
      />

      <div className="sm:hidden">
        <SidebarMobile
          mobileView={mobileView}
          setMobileView={setMobileView}
          currentUser={currentUser}
        />
      </div>

      {/* Chat Area */}
      <main className="flex-1 sm:ml-[92px] flex flex-col overflow-hidden relative z-10 bg-gray-900">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8 lg:py-10 space-y-5 lg:space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-md mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-100">FamChat AI</h1>
              <p className="text-lg text-gray-400">Your friendly family chat assistant 😊</p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                <button
                  onClick={handleWhatIsFamChat}
                  className="px-4 py-2 border border-gray-700 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-200 text-sm font-semibold"
                  disabled={isLoading}
                >
                  What is FamChat?
                </button>
                <button
                  onClick={handleStartChat}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                  disabled={isLoading}
                >
                  Say Hello 😊
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 sm:px-6 sm:py-4 border transition-all duration-300 ${
                    msg.role === "user"
                      ? "bg-indigo-600 border-indigo-500 shadow-lg"
                      : "bg-gray-800 border-gray-700 shadow-md"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base font-medium">
                    {msg.content}
                  </p>
                  <span className="block mt-2 text-xs text-gray-400 font-mono tracking-wide">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 max-w-[70%] shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 p-1 bg-gray-700 rounded-lg">
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0s]" />
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full [animation-delay:0.2s] animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full [animation-delay:0.4s] animate-bounce" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 tracking-wide">
                    FamChat AI
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="px-6 py-3 bg-gray-900 border-t border-gray-700 w-full
                        fixed bottom-24 sm:relative sm:bottom-0 z-30">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex items-center">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hello! Ask me anything about FamChat 😊"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-2 text-sm sm:text-base placeholder-gray-400 text-white outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="ml-3 w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 hover:bg-indigo-700 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="sm:hidden z-20">
        <MobileBottomNav mobileView={mobileView} setMobileView={setMobileView} visible />
      </div>
    </div>
  );
}

export default Bot;
