import React, { useState, useRef } from "react";
import axios from "axios";
import { addDoc, collection, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaPaperPlane, FaTimes, FaPhotoVideo } from "react-icons/fa";
import { useToaster } from "./Utils/Toaster";

const MessageInput = ({ currentChat, user, replyTo, setReplyTo, isMobile }) => {
  const { show: showToast } = useToaster();
  const [text, setText] = useState("");
  const sending = useRef(false);

  // Cloudinary configuration
  const CLOUD_NAME = "dcc1upymc";
  const UPLOAD_PRESET = "chat_images"; // must be unsigned

  const sendMessage = async (msg) => {
    if (!currentChat || !user || sending.current) return;
    sending.current = true;

    try {
      const messagesRef = collection(db, "chats", currentChat.chatId, "messages");

      const addedMsg = await addDoc(messagesRef, {
        text: msg.text || "",
        mediaUrl: msg.mediaUrl || null,
        mediaType: msg.mediaType || null,
        senderId: user.uid,
        time: serverTimestamp(),
        createdAt: Date.now(),
        read: false,
        replyTo: replyTo
          ? { id: replyTo.id, text: replyTo.text, senderId: replyTo.senderId }
          : null,
      });

      // Update original message if it's a reply
      if (replyTo) {
        const originalMsgRef = doc(db, "chats", currentChat.chatId, "messages", replyTo.id);
        await updateDoc(originalMsgRef, {
          repliedBy: { id: addedMsg.id, text: msg.text || "Media", senderId: user.uid },
        });
      }

      // Update last message in chat document
      const chatDocRef = doc(db, "chats", currentChat.chatId);
      await updateDoc(chatDocRef, {
        lastMessage: msg.text || "Media",
        lastMessageTime: serverTimestamp(),
        lastMessageCreatedAt: Date.now(),
      });

      setText("");
      setReplyTo(null);
    } catch (err) {
      console.error("sendMessage error:", err);
    } finally {
      sending.current = false;
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
        formData
      );

      const type = file.type.startsWith("video") ? "video" : "image";
      sendMessage({ mediaUrl: res.data.secure_url, mediaType: type });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      showToast({ message: 'Failed to upload media. Make sure your preset is unsigned and your cloud name is correct.', type: 'error' });
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 w-full bg-[#071226] border-t border-gray-700"
      style={{ zIndex: 100, paddingBottom: isMobile ? "70px" : "0px" }}
    >
      {replyTo && (
        <div className="flex items-center bg-gray-800 text-white px-3 py-2 border-l-4 border-blue-500">
          <span className="text-sm truncate flex-1">{replyTo.text}</span>
          <button onClick={() => setReplyTo(null)} className="ml-2">
            <FaTimes />
          </button>
        </div>
      )}

      <form onSubmit={handleSendText} className="p-3 flex items-center gap-3">
        <label
          htmlFor="media-upload"
          className="p-3 rounded-full bg-gray-700 text-white cursor-pointer"
        >
          <FaPhotoVideo />
        </label>
        <input
          id="media-upload"
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleMediaUpload}
        />

        <input
          className="flex-1 px-4 py-2 rounded-full bg-[#0f1724] text-white outline-none"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="p-3 rounded-full bg-blue-600 text-white shadow active:scale-90 transition"
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
