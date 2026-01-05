import React, { useState, useRef } from "react";
import { db } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import { FaUpload, FaImage, FaTimes, FaArchive } from "react-icons/fa";
import { motion } from "framer-motion";

const CLOUD_NAME = "dcc1upymc";
const UPLOAD_PRESET = "chat_images";
const MAX_VIDEO_SIZE_MB = 50;
const MAX_IMAGE_SIZE_MB = 10;

const TEMPLATES = [
  { id: 'default', name: 'Default', gradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', textColor: '#1e293b' },
  { id: 'blue', name: 'Blue', gradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', textColor: '#1e40af' },
  { id: 'green', name: 'Green', gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', textColor: '#166534' },
];

const PostStatus = ({ currentUser, onCancel }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [archive, setArchive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({});
  const [notification, setNotification] = useState(null);
  const inputRef = useRef(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const validateFiles = (selectedFiles) => {
    const validFiles = [];
    selectedFiles.forEach((file) => {
      const sizeMB = file.size / (1024 * 1024);
      if (file.type.startsWith("video") && sizeMB > MAX_VIDEO_SIZE_MB) {
        showNotification(`Video "${file.name}" exceeds ${MAX_VIDEO_SIZE_MB}MB`, 'error');
      } else if (file.type.startsWith("image") && sizeMB > MAX_IMAGE_SIZE_MB) {
        showNotification(`Image "${file.name}" exceeds ${MAX_IMAGE_SIZE_MB}MB`, 'error');
      } else {
        validFiles.push(file);
      }
    });
    return validFiles;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = validateFiles(selectedFiles);
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [
        ...prev,
        ...validFiles.map(f => ({
          id: URL.createObjectURL(f),
          url: URL.createObjectURL(f),
          type: f.type.startsWith("video") ? "video" : "image",
          name: f.name
        }))
      ]);
      showNotification(`${validFiles.length} file(s) added`);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    previews.forEach(preview => URL.revokeObjectURL(preview.url));
    setFiles([]);
    setPreviews([]);
    setCaption("");
    setSelectedTemplate(TEMPLATES[0]);
    setArchive(false);
    setProgress({});
    if (inputRef.current) inputRef.current.value = "";
    showNotification("Cancelled", 'info');
    if (onCancel) onCancel();
  };

  const handleUpload = async () => {
    if ((!files.length && !caption.trim()) || !currentUser) {
      showNotification("Please add text or media", 'error');
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
          formData,
          {
            onUploadProgress: (e) => {
              if (e.total) {
                setProgress(prev => ({ ...prev, [file.name]: Math.round((e.loaded * 100) / e.total) }));
              }
            },
          }
        );

        uploadedUrls.push({
          url: res.data.secure_url,
          type: file.type.startsWith("video") ? "video" : "image",
          publicId: res.data.public_id,
          name: file.name,
        });
      }

      for (const media of uploadedUrls) {
        await addDoc(collection(db, "statuses"), {
          userId: currentUser.uid,
          username: currentUser.username || "Unknown User",
          url: media.url,
          type: media.type,
          publicId: media.publicId,
          caption: caption.trim(),
          templateId: selectedTemplate.id,
          templateGradient: selectedTemplate.gradient,
          templateTextColor: selectedTemplate.textColor,
          timestamp: serverTimestamp(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          viewedBy: [],
        });

        if (archive) {
          await addDoc(collection(db, "users", currentUser.uid, "archives"), {
            statusId: 'temp',
            ...media,
            caption: caption.trim(),
            templateId: selectedTemplate.id,
            templateGradient: selectedTemplate.gradient,
            templateTextColor: selectedTemplate.textColor,
            timestamp: serverTimestamp(),
            archivedAt: serverTimestamp(),
          });
        }
      }

      if (!files.length && caption.trim()) {
        await addDoc(collection(db, "statuses"), {
          userId: currentUser.uid,
          username: currentUser.username || "Unknown User",
          url: null,
          type: "text",
          caption: caption.trim(),
          templateId: selectedTemplate.id,
          templateGradient: selectedTemplate.gradient,
          templateTextColor: selectedTemplate.textColor,
          timestamp: serverTimestamp(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          viewedBy: [],
        });
      }

      handleCancel();
      showNotification("Status posted successfully", 'success');
    } catch (err) {
      console.error(err);
      showNotification("Upload failed. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaUpload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Post Status</h2>
                <p className="text-xs text-gray-500">Share with friends (24 hours)</p>
              </div>
            </div>

            <motion.button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center justify-center group"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTimes className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
            </motion.button>
          </div>

          <div className="p-6 space-y-6">
            {/* Template Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Background Style</label>
              <div className="flex gap-3">
                {TEMPLATES.map((temp) => (
                  <button
                    key={temp.id}
                    onClick={() => setSelectedTemplate(temp)}
                    className={`flex-shrink-0 w-20 h-12 rounded-xl border-2 transition-all duration-200 p-2 text-sm font-medium ${
                      selectedTemplate.id === temp.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    style={{ background: temp.gradient, color: temp.textColor }}
                  >
                    {temp.name}
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="statusFile"
                className={`block w-full p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  previews.length === 0
                    ? 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    : 'border-blue-200 bg-blue-50/50 shadow-sm'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  {previews.length === 0 ? (
                    <>
                      <FaImage className="w-12 h-12 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Drag & drop or click</p>
                        <p className="text-sm text-gray-500">Images (10MB) or Videos (50MB)</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">{previews.length}</span>
                      </div>
                      Files ready
                    </div>
                  )}
                </div>
                <input
                  ref={inputRef}
                  id="statusFile"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {previews.length > 0 && (
                <div className="flex gap-3 overflow-x-auto mt-4 pt-4 pb-2 -mx-1 px-1">
                  {previews.map((preview, idx) => (
                    <div key={preview.id} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-50">
                      {preview.type === "video" ? (
                        <video src={preview.url} className="w-full h-full object-cover" muted loop />
                      ) : (
                        <img src={preview.url} alt="" className="w-full h-full object-cover" />
                      )}
                      {progress[preview.name] && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${progress[preview.name]}%` }}
                          />
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(idx)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-gray-200 shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
                      >
                        <FaTimes className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Caption */}
            <textarea
              placeholder="Add a caption (optional)..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px] transition-all"
              style={{ background: selectedTemplate.gradient, color: selectedTemplate.textColor }}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors flex-1 sm:flex-none">
                <input
                  type="checkbox"
                  checked={archive}
                  onChange={(e) => setArchive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <FaArchive className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Save to archive</span>
              </label>

              <button
                onClick={handleUpload}
                disabled={loading || (!files.length && !caption.trim())}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  loading || (!files.length && !caption.trim())
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </div>
                ) : (
                  <>
                    <FaUpload className="w-4 h-4" />
                    {files.length > 0 ? `Upload (${files.length})` : 'Post Status'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-lg border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {notification.message}
        </motion.div>
      )}
    </div>
  );
};

export default PostStatus;
