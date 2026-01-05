import React, { useState } from "react";

export default function About() {
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 mt-4">

      {/* App Version */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm text-gray-300">
        <h3 className="font-semibold text-white">App Version</h3>
        1.0.0
      </div>

      {/* Terms & Conditions Dropdown */}
      <div className="bg-gray-800 rounded-lg shadow-sm text-gray-300">
        <div
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => setTermsOpen(!termsOpen)}
        >
          <h3 className="font-semibold text-white">Terms & Conditions</h3>
          <span className="text-gray-400">{termsOpen ? "▲" : "▼"}</span>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            termsOpen ? "max-h-96 p-4 border-t border-gray-700" : "max-h-0 p-0 border-t-0"
          }`}
        >
          <p className="text-gray-300 text-sm">
            Welcome to our app! By using this application, you agree to comply
            with our terms and conditions. You are responsible for any activity
            performed under your account. The app and its content are provided
            "as is" without warranty of any kind. We reserve the right to
            modify or terminate the service at any time without notice. Use of
            the app indicates acceptance of these terms.
          </p>
        </div>
      </div>

      {/* Privacy Policy Dropdown */}
      <div className="bg-gray-800 rounded-lg shadow-sm text-gray-300">
        <div
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => setPrivacyOpen(!privacyOpen)}
        >
          <h3 className="font-semibold text-white">Privacy Policy</h3>
          <span className="text-gray-400">{privacyOpen ? "▲" : "▼"}</span>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            privacyOpen ? "max-h-96 p-4 border-t border-gray-700" : "max-h-0 p-0 border-t-0"
          }`}
        >
          <p className="text-gray-300 text-sm">
            We respect your privacy and are committed to protecting your
            personal information. We collect data only to provide and improve
            the app experience. Your information is never shared with third
            parties without your consent. You can manage your privacy settings
            in the app and request data deletion at any time. By using the
            app, you agree to our privacy practices.
          </p>
        </div>
      </div>
    </div>
  );
}
