import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";
import familyLogo from "../../assets/fam.png";
import { getFirebaseErrorMessage } from "../Utils/firebaseErrors";

const Signin = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      setErrorMsg(getFirebaseErrorMessage(error.code));
    }

    setLoading(false);
  };

  const handleGoogleSignin = async () => {
    setErrorMsg("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google user:", result.user);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to sign in with Google. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <motion.div
        className="w-full max-w-md mx-2 sm:mx-0"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Main Card - FLAT, NO SHADOWS, MATCHES BACKGROUND */}
        <motion.div
className="
  relative
  bg-gradient-to-br from-slate-50 via-white to-blue-50
  p-8 sm:p-10
  rounded-3xl
  border border-white/30
  max-h-[95vh]
  overflow-y-auto
  scrollbar-hide
"
          whileHover={{ y: -2 }}
        >
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center border-4 border-white/30"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={familyLogo}
                alt="FamChat Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl"
              />
            </motion.div>
            <motion.h1 
              className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              FamChat
            </motion.h1>
          </div>

          {/* Welcome Text */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
              Welcome back
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Connect with your family, share moments, create memories together
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Form */}
          <form onSubmit={handleSignin} className="space-y-6 mb-8">
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 pl-12 pr-12 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-300"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 pl-12 pr-14 text-lg font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-400 transition-all duration-300"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <motion.button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? <FiEyeOff size={20} className="text-gray-500" /> : <FiEye size={20} className="text-gray-500" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Sign In Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing you in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-r from-slate-50 to-blue-50 text-gray-600 font-medium">OR</span>
            </div>
          </div>

          {/* Google Sign In */}
          <motion.button
            onClick={handleGoogleSignin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-white border-2 border-gray-200 py-5 px-6 rounded-2xl font-semibold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FcGoogle size={24} />
            <span>Continue with Google</span>
          </motion.button>

          {/* Sign Up Link - YOUR EXACT ORIGINAL */}
          <motion.p 
            className="text-center mt-4 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Don't have an account?{" "}
            <span
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </span>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signin;
