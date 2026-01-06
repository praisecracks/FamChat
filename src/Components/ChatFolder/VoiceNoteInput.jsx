import React, { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaPause, FaTimes, FaStop, FaPaperPlane } from "react-icons/fa";

function VoiceNoteInput({ onCancel, onRecorded }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // Timer
  useEffect(() => {
    if (!isRecording || isPaused) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  // Auto-start recording
  useEffect(() => {
    startRecording();
    return () => stopRecording(true); // cleanup on unmount
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          onRecorded(audioBlob);
        }
        cleanup();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Microphone access denied", err);
      onCancel();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = (cancel = false) => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop(); // triggers onstop
    }

    // Stop all tracks
    mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;

    if (cancel) {
      chunksRef.current = [];
      onCancel();
    }

    setIsRecording(false);
    setIsPaused(false);
    setSeconds(0);
  };

  const cleanup = () => {
    chunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setSeconds(0);
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-14 flex items-center justify-between px-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-lg">
      {/* Left: Mic + Timer */}
      <div className="flex items-center gap-3 flex-1">
        <FaMicrophone className={`w-5 h-5 ${isRecording ? "text-red-400 animate-pulse" : "text-gray-500"}`} />
        <span className="text-lg font-mono font-bold text-white">{formatTime(seconds)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Pause/Resume */}
        <button
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="w-10 h-10 rounded-xl bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-all active:scale-95"
          disabled={!isRecording}
        >
          {isPaused ? <FaMicrophone className="w-4 h-4" /> : <FaPause className="w-4 h-4" />}
        </button>

        {/* Stop = Cancel */}
        <button
          onClick={() => stopRecording(true)}
          className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-red-400 transition-all active:scale-95"
          disabled={!isRecording}
        >
          <FaStop className="w-4 h-4" />
        </button>

        {/* Send */}
        <button
          onClick={() => stopRecording(false)}
          className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md hover:shadow-blue-400 transition-all active:scale-95"
          disabled={!isRecording || seconds < 1}
        >
          <FaPaperPlane className="w-4 h-4" />
        </button>
      </div>

      {/* Cancel */}
      <button
        onClick={() => stopRecording(true)}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
      >
        <FaTimes className="w-5 h-5" />
      </button>
    </div>
  );
}

export default VoiceNoteInput;
