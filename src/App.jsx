// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToasterProvider } from "./Components/Utils/Toaster";
import { useRef, useState } from "react";
import AuthLanding from "./Components/Auth/AuthLanding";
import Signup from "./Components/Auth/Signup";
import Signin from "./Components/Auth/Signin";
import Dashboard from "./Components/Dashboard";
import AuthWatcher from "./Components/Auth/AuthWatcher";
import Call from "./Components/Pages/Call";
import Profile from "./Components/Pages/Profile"; 
import Setting from "./Components/Pages/Setting";
import Bot from "./Components/Pages/Bot";


// ✅ Status Components
import StatusPage from "./Components/Pages/StatusPage";
import StatusViewer from "./Components/Pages/Status/StatusViewer";

function App() {
  const sidebarRef = useRef();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <Router>
      <AuthWatcher setCurrentUser={setCurrentUser} />

      {/* Toaster provider for in-app toasts */}
      <ToasterProvider>
        <Routes>
        {/* Auth */}
        <Route path="/" element={<AuthLanding />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <Dashboard
              sidebarRef={sidebarRef}
              sidebarExpanded={sidebarExpanded}
              setSidebarExpanded={setSidebarExpanded}
              currentUser={currentUser}
            />
          }
        />

        {/* Calls */}
        <Route
          path="/calls"
          element={
            <Call
              sidebarExpanded={sidebarExpanded}
              setSidebarExpanded={setSidebarExpanded}
              currentUser={currentUser}
            />
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <Profile
              sidebarExpanded={sidebarExpanded}
              setSidebarExpanded={setSidebarExpanded}
              currentUser={currentUser}
            />
          }
        />

        {/* Settings */}
       <Route
  path="/setting"
  element={
    <Setting
      sidebarExpanded={sidebarExpanded}
      setSidebarExpanded={setSidebarExpanded}
      currentUser={currentUser}
    />
  }
/>

         {/* Settings */}
        <Route
          path="/ai"
          element={
            <Bot
  sidebarExpanded={sidebarExpanded}
  setSidebarExpanded={setSidebarExpanded}
  currentUser={currentUser}
/>

          }
        />

        {/* ========================= */}
        {/*       STATUS ROUTES       */}
        {/* ========================= */}

        {/* Status Home */}
        <Route
          path="/status"
          element={
            <StatusPage
              currentUser={currentUser}
              sidebarRef={sidebarRef}
              sidebarExpanded={sidebarExpanded}
              setSidebarExpanded={setSidebarExpanded}
            />
          }
        />

        {/* Fullscreen Status Viewer */}
        <Route
          path="/status/view/:userId"
          element={<StatusViewer currentUser={currentUser} />}
        />
      </Routes>
      </ToasterProvider>
    </Router>
  );
}

export default App;
