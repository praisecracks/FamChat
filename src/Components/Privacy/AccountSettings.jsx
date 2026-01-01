import React, { useState } from "react";
import { FaCamera, FaPencilAlt, FaEnvelope, FaPhone, FaLock } from "react-icons/fa";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { useToaster } from "../Utils/Toaster";

export default function AccountSettings({ user, setUser }) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user.username || "");
  const [editingStatus, setEditingStatus] = useState(false);
  const [status, setStatus] = useState(user.bio || "Hey there! I am using FamChat");
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState(user.email || "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState(user.phone || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { show: showToast } = useToaster();

  // Profile Picture Upload
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "chat_images");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcc1upymc/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");

      const photoURL = data.secure_url;
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { photoURL });
      setUser((prev) => ({ ...prev, photoURL }));
    } catch (err) {
      console.error(err);
      showToast({ message: 'Failed to upload profile picture.', type: 'error' });
    }
  };

  // Generic Field Save
  const saveField = async (field, value, setter) => {
    const docRef = doc(db, "users", auth.currentUser.uid);

    if (field === "email") {
      try {
        await updateEmail(auth.currentUser, value);
        await sendEmailVerification(auth.currentUser);
        showToast({ message: 'Email updated! Please verify your new email.', type: 'success' });
      } catch (err) {
        console.error(err);
        showToast({ message: 'Failed to update email. Make sure it\'s valid and not in use.', type: 'error' });
        return;
      }
    } else if (field === "phone") return;

    await updateDoc(docRef, { [field]: value });
    setUser((prev) => ({ ...prev, [field]: value }));
    setter(false);
  };

  // Change Password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast({ message: 'New password and confirm password do not match.', type: 'error' });
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      showToast({ message: 'Password updated successfully!', type: 'success' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangingPassword(false);
    } catch (err) {
      console.error(err);
      showToast({ message: 'Failed to change password. Make sure current password is correct.', type: 'error' });
    }
  };

  // Recaptcha Setup
  const setupRecaptcha = () => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible", callback: () => {} },
        auth
      );
      window.recaptchaVerifier.render().catch(console.error);
    }
  };

  // Send OTP
  const sendOtp = async () => {
    setupRecaptcha();
    setOtpError("");
    setOtpSuccess("");
    if (!window.recaptchaVerifier) return;

    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) formattedPhone = "+234" + formattedPhone.slice(1);
    else if (!formattedPhone.startsWith("+")) formattedPhone = "+" + formattedPhone;

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      setOtpSuccess("OTP sent successfully!");
    } catch (err) {
      console.error(err);
      setOtpError("Failed to send OTP. Check phone number format.");
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    setOtpError("");
    setOtpSuccess("");
    try {
      await window.confirmationResult.confirm(otp);
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { phone });
      setUser((prev) => ({ ...prev, phone }));
      setEditingPhone(false);
      setOtp("");
      setOtpSent(false);
      setOtpSuccess("Phone number updated successfully!");
    } catch (err) {
      console.error(err);
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("0")) value = "+234" + value.slice(1);
    setPhone(value);
  };

  return (
    <div className="bg-gray-800 m-4 rounded-2xl p-6 flex flex-col items-center shadow-lg overflow-y-auto max-h-screen">
      {/* Profile Picture */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-bold overflow-hidden shadow-lg hover:scale-105 transition transform">
        {user.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover rounded-full" />
        ) : (
          user.username?.[0]?.toUpperCase() || "U"
        )}
        <button
          onClick={() => document.getElementById("profileUpload").click()}
          className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 p-2 rounded-full shadow-lg"
        >
          <FaCamera size={16} />
        </button>
      </div>
      <input type="file" id="profileUpload" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />

      {/* Username */}
      {editingName ? (
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
          />
          <button onClick={() => saveField("username", name, setEditingName)} className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600">
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-4">
          <h2 className="text-2xl font-bold">{user.username}</h2>
          <FaPencilAlt className="cursor-pointer hover:text-blue-400" onClick={() => setEditingName(true)} />
        </div>
      )}

      {/* Status */}
      {editingStatus ? (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
          />
          <button onClick={() => saveField("bio", status, setEditingStatus)} className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600">
            Save
          </button>
        </div>
      ) : (
        <p
          className="text-gray-300 cursor-pointer text-center mt-2 bg-gray-900 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-700/50 transition max-w-md"
          onClick={() => setEditingStatus(true)}
        >
          {status}
        </p>
      )}

      {/* Email */}
      {editingEmail ? (
        <div className="flex gap-2 mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
          />
          <button onClick={() => saveField("email", email, setEditingEmail)} className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600">
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-4">
          <FaEnvelope className="text-gray-400" />
          <span>{user.email}</span>
          <FaPencilAlt className="cursor-pointer hover:text-blue-400" onClick={() => setEditingEmail(true)} />
        </div>
      )}

      {/* Phone */}
      {editingPhone ? (
        <div className="flex flex-col gap-2 mt-2 w-full max-w-md">
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
            placeholder="Enter phone number"
          />
          {!otpSent ? (
            <button onClick={sendOtp} className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600">
              Send OTP
            </button>
          ) : (
            <>
              <input
                type="text"
                value={otp}
                placeholder="Enter OTP"
                onChange={(e) => setOtp(e.target.value)}
                className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
              />
              <button onClick={verifyOtp} className="px-3 py-1 bg-green-500 rounded hover:bg-green-600">
                Verify OTP
              </button>
            </>
          )}
          {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
          {otpSuccess && <p className="text-green-500 text-sm">{otpSuccess}</p>}
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-2">
          <FaPhone className="text-gray-400" />
          <span>{user.phone || "-"}</span>
          <FaPencilAlt className="cursor-pointer hover:text-blue-400" onClick={() => setEditingPhone(true)} />
        </div>
      )}

      {/* Change Password */}
      <div className="w-full mt-6">
        <h3 className="text-gray-400 uppercase text-sm font-semibold mb-2">Change Password</h3>
        {changingPassword ? (
          <div className="flex flex-col gap-2">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="px-3 py-1 rounded bg-gray-900 text-white outline-none w-60 sm:w-96"
            />
            <div className="flex gap-2">
              <button onClick={handleChangePassword} className="px-3 py-1 bg-blue-500 rounded hover:bg-blue-600">
                Save
              </button>
              <button onClick={() => setChangingPassword(false)} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setChangingPassword(true)}
            className="flex items-center gap-2 mt-2 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 shadow-sm"
          >
            <FaLock />
            Change Password
          </button>
        )}
      </div>

      {/* Recaptcha container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}
