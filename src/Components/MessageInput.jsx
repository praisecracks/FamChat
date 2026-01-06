import React, { useState, useRef } from "react";
import axios from "axios";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  FaPaperPlane,
  FaTimes,
  FaPhotoVideo,
  FaMicrophone,
} from "react-icons/fa";
import { useToaster } from "./Utils/Toaster";
import VoiceNoteInput from "./ChatFolder/VoiceNoteInput";

const MessageInput = ({ currentChat, user, replyTo, setReplyTo, isMobile }) => {
  const { show: showToast } = useToaster();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const sending = useRef(false);

  const CLOUD_NAME = "dcc1upymc";
  const UPLOAD_PRESET = "chat_images"; // For images/videos
  const VOICE_UPLOAD_PRESET = "chat_voice"; // Create another unsigned preset for audio

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async (msg) => {
    if (!currentChat || !user || sending.current) return;
    sending.current = true;

    try {
      const messagesRef = collection(
        db,
        "chats",
        currentChat.chatId,
        "messages"
      );

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

      if (replyTo) {
        const originalMsgRef = doc(
          db,
          "chats",
          currentChat.chatId,
          "messages",
          replyTo.id
        );
        await updateDoc(originalMsgRef, {
          repliedBy: {
            id: addedMsg.id,
            text: msg.text || "Media",
            senderId: user.uid,
          },
        });
      }

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
      showToast({ message: "Failed to send message", type: "error" });
    } finally {
      sending.current = false;
      setIsRecording(false);
    }
  };

  // ---------------- SEND TEXT ----------------
  const handleSendText = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
  };

  // ---------------- MEDIA UPLOAD ----------------
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
      showToast({ message: "Failed to upload media", type: "error" });
    }
  };

  // ---------------- VOICE NOTE UPLOAD ----------------
  const handleVoiceRecorded = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("upload_preset", VOICE_UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
        formData
      );

      sendMessage({ mediaUrl: res.data.secure_url, mediaType: "audio" });
    } catch (err) {
      console.error("Voice note upload error:", err);
      showToast({ message: "Failed to upload voice note", type: "error" });
      setIsRecording(false);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div
      className="fixed bottom-0 left-0 w-full bg-[#071226] border-t border-gray-700"
      style={{ zIndex: 100, paddingBottom: isMobile ? "70px" : "0px" }}
    >
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center bg-gray-800 text-white px-3 py-2 border-l-4 border-blue-500">
          <span className="text-sm truncate flex-1">{replyTo.text}</span>
          <button onClick={() => setReplyTo(null)} className="ml-2">
            <FaTimes />
          </button>
        </div>
      )}

      <form onSubmit={handleSendText} className="p-3 flex items-center gap-3">
        {/* Media */}
        <label
          htmlFor="media-upload"
          className="p-3 rounded-full bg-gray-700 text-white cursor-pointer hover:bg-gray-600 transition"
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

        {/* Input area */}
        <div className="flex-1">
          {isRecording ? (
            <VoiceNoteInput
              onCancel={() => setIsRecording(false)}
              onRecorded={handleVoiceRecorded}
            />
          ) : (
            <input
              className="w-full px-4 py-2 rounded-full bg-[#0f1724] text-white outline-none"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
        </div>

        {/* Send / Mic */}
        {hasText ? (
          <button
            type="submit"
            className="p-3 rounded-full bg-blue-600 text-white shadow active:scale-90 transition"
          >
            <FaPaperPlane />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsRecording(true)}
            className="p-3 rounded-full bg-gray-700 text-white hover:bg-green-600 transition shadow"
          >
            <FaMicrophone />
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
