// MobileChatScreen.jsx
import React from "react";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";

function MobileChatScreen({
  currentChat,
  messages,
  authUser,
  replyTo,
  setReplyTo,
  onBack,
}) {
  if (!currentChat) {
    return (
      <div className="flex flex-col h-screen bg-[#0b1220] text-gray-400">
        <div className="flex items-center gap-2 px-4 py-3 bg-[#202c33] text-white shadow-md">
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
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          Select a chat to start messaging
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen relative bg-[#0b1220]">
      {/* Existing ChatWindow – mobile styles already there */}
      <div className="flex-1 overflow-y-auto pb-28">
        <ChatWindow
          messages={messages}
          user={authUser}
          chatUser={currentChat}
          chatId={currentChat.chatId}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          onBack={onBack}   // back arrow handled inside ChatWindow
        />
      </div>

      {/* Same MessageInput as desktop, just pinned at bottom */}
      <div className="absolute bottom-0 left-0 w-full z-10">
        <MessageInput
          currentChat={currentChat}
          user={authUser}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
        />
      </div>
    </div>
  );
}

export default MobileChatScreen;
