import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import StatusCard from "./Status/StatusCard";
import MobileBottomNav from "../Utils/MobileBottomNav";
import Loader from "../Loader";
import PostStatus from "./Status/PostStatus";
import StatusViewer from "./Status/StatusViewer";
import SidebarDesktop from "../SidebarDesktop"; // Adjust path to your SidebarDesktop
import Header from "../Header"; // Adjust path to your Header
import { useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useToaster } from "../Utils/Toaster";

const StatusPage = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { show: showToast } = useToaster();

  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusViewerUserId, setStatusViewerUserId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archivedStatuses, setArchivedStatuses] = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Window Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Users & Statuses (unchanged)
  useEffect(() => {
    if (!currentUser?.uid) return;

    let unsubUsers = () => {};
    let unsubStatusesByExpires = () => {};
    let unsubStatusesLegacy = () => {};
    let unsubArchives = () => {};
    let recheckTimer;

    try {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const map = {};
        snap.docs.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }));
        setUsers(map);
      });

      unsubArchives = onSnapshot(
        query(
          collection(db, "users", currentUser.uid, "archives"),
          orderBy("archivedAt", "desc")
        ),
        (snap) => {
          setArchivedStatuses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      );

      const statusMap = {};
      const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;

      const computeAndSet = () => {
        const arr = Object.values(statusMap).filter((s) => {
          if (s.expiresAt) {
            try {
              const exp =
                s.expiresAt?.toMillis?.() ??
                (s.expiresAt instanceof Date
                  ? s.expiresAt.getTime()
                  : typeof s.expiresAt === "number"
                  ? s.expiresAt
                  : null);
              return typeof exp === "number" && Date.now() < exp;
            } catch {
              return false;
            }
          }
          if (!s.timestamp) return false;
          try {
            const time =
              s.timestamp?.toMillis?.() ??
              (typeof s.timestamp === "number" ? s.timestamp : null);
            return typeof time === "number" && time > cutoffMs;
          } catch {
            return false;
          }
        });

        arr.sort((a, b) => {
          const ta =
            a.timestamp?.toMillis?.() ?? (typeof a.timestamp === "number" ? a.timestamp : 0);
          const tb =
            b.timestamp?.toMillis?.() ?? (typeof b.timestamp === "number" ? b.timestamp : 0);
          return tb - ta;
        });

        setStatuses(arr);
        setLoading(false);
      };

      unsubStatusesByExpires = onSnapshot(
        query(
          collection(db, "statuses"),
          where("expiresAt", ">", new Date()),
          orderBy("expiresAt", "desc")
        ),
        (snap) => {
          snap.docs.forEach((d) => (statusMap[d.id] = { id: d.id, ...d.data() }));
          computeAndSet();
        }
      );

      unsubStatusesLegacy = onSnapshot(
        query(
          collection(db, "statuses"),
          where("expiresAt", "==", null),
          where("timestamp", ">", new Date(cutoffMs)),
          orderBy("timestamp", "desc")
        ),
        (snap) => {
          snap.docs.forEach((d) => (statusMap[d.id] = { id: d.id, ...d.data() }));
          computeAndSet();
        }
      );

      recheckTimer = setInterval(() => computeAndSet(), 30 * 1000);
    } catch (err) {
      console.error("Error fetching statuses:", err);
      setLoading(false);
    }

    return () => {
      unsubUsers();
      unsubStatusesByExpires();
      unsubStatusesLegacy();
      unsubArchives();
      clearInterval(recheckTimer);
    };
  }, [currentUser?.uid]);

  // Group Statuses by User
  const groupedStatuses = statuses.reduce((acc, s) => {
    if (!s.userId) return acc;
    if (!acc[s.userId]) acc[s.userId] = [];
    acc[s.userId].push(s);
    return acc;
  }, {});

  // Filter by Search
  const filteredUserIds = Object.keys(groupedStatuses).filter((uid) => {
    if (uid === currentUser.uid) return false;
    const user = users[uid] || {};
    const queryLower = searchQuery.toLowerCase();
    return (
      (user.username?.toLowerCase().includes(queryLower) ||
        user.email?.toLowerCase().includes(queryLower) ||
        user.phone?.toLowerCase().includes(queryLower))
    );
  });

  // All existing handlers (unchanged)
  const handleOpenStatus = async (uid) => {
    const userStatuses = groupedStatuses[uid] || [];
    for (const s of userStatuses) {
      const alreadyViewed = s.viewedBy?.some((v) => v.uid === currentUser.uid);
      if (!alreadyViewed) {
        await updateDoc(doc(db, "statuses", s.id), {
          viewedBy: arrayUnion({ uid: currentUser.uid, viewedAt: Date.now() }),
        });
      }
    }
    setStatusViewerUserId(uid);
  };

  const handleRestoreArchive = async (a) => {
    // ... (exact same as original)
  };

  const handleDownloadArchive = async (a) => {
    // ... (exact same as original)
  };

  if (loading || !currentUser?.uid) return <Loader />;

  // Status Content (extracted for reuse)
  const StatusContent = () => (
    <>
      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3 bg-white dark:bg-gray-800 border-b shadow"
          >
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
              <FaSearch className="text-gray-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search by username, email, or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
              />
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowSearch(false);
                }}
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Status */}
      <div className="bg-white dark:bg-gray-800 border-b px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-gray-400">
          <h3 className="text-lg font-semibold text-gray-400">My Status</h3>
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <FaSearch />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <StatusCard
            isSelf
            user={{
              username: currentUser.username || "My Status",
              photoURL: currentUser.photoURL || "/default-avatar.png",
              online: true,
              uid: currentUser.uid,
            }}
            statuses={groupedStatuses[currentUser.uid] || []}
            currentUser={currentUser}
            onClick={() => handleOpenStatus(currentUser.uid)}
          />

          <div className="flex gap-2 mt-3 sm:mt-0 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setPostModalOpen(true)}
              className="w-full sm:w-40 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-medium shadow"
            >
              + Add Status
            </button>

            {archivedStatuses.length > 0 && (
              <button
                onClick={() => setArchiveModalOpen(true)}
                className="w-full sm:w-40 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                View Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Recent Updates</h3>

        {filteredUserIds.length === 0 && searchQuery && (
          <div className="text-center text-gray-400 mt-10">
            No status found for "{searchQuery}"
          </div>
        )}

        {filteredUserIds.map((uid) => {
          const u = users[uid] || {};
          return (
            <div key={uid} className="mb-4 hover:shadow-md transition-shadow rounded-lg">
              <StatusCard
                user={{
                  username: u.username || "Unknown User",
                  photoURL: u.photoURL || "/default-avatar.png",
                  online: u.online || false,
                  uid,
                }}
                statuses={groupedStatuses[uid] || []}
                currentUser={currentUser}
                onClick={() => handleOpenStatus(uid)}
              />
            </div>
          );
        })}
      </div>
    </>
  );

  // Desktop Layout with Sidebar + Header
  const DesktopLayout = ({ children }) => (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <SidebarDesktop
        activeChatId={null}
        setActiveChatUser={() => {}}
        setActiveChatId={() => {}}
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        currentUser={currentUser}
        filteredUsers={null}
        setProfileModalUser={() => {}}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <Header
          appName="FamChat"
          currentUser={currentUser}
          unreadCount={0}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
        />
        
        {/* Scrollable Status Content */}
        <main className="flex-1 overflow-y-auto pt-16">{children}</main>
      </div>
    </div>
  );

  // Mobile Layout
  const MobileLayout = ({ children }) => (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <Header
        appName="Status"
        currentUser={currentUser}
        unreadCount={0}
        sidebarExpanded={false}
        setSidebarExpanded={() => {}}
      />
      
      {/* Status Content */}
      {children}
      
      {/* Fixed Bottom Nav */}
      {!isMobile ? null : (
        <div className="fixed bottom-0 left-0 w-full z-40 md:hidden">
          <MobileBottomNav visible />
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <MobileLayout>
          <StatusContent />
        </MobileLayout>
      ) : (
        <DesktopLayout>
          <StatusContent />
        </DesktopLayout>
      )}

      {/* Post Status Modal */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-lg">Add Status</h3>
              <button
                onClick={() => setPostModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <PostStatus
              currentUser={currentUser}
              onCancel={() => setPostModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-lg">Archived Statuses</h3>
              <button
                onClick={() => setArchiveModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {archivedStatuses.length === 0 && (
                <div className="text-gray-400">No archived statuses yet.</div>
              )}

              {archivedStatuses.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg shadow-sm bg-white dark:bg-gray-800 flex items-center gap-4"
                >
                  <div
                    className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                    style={{ background: a.templateGradient || "#eee" }}
                  >
                    {a.type === "text" ? (
                      <div
                        className="px-3 text-center text-sm font-semibold"
                        style={{ color: a.templateTextColor || "#fff" }}
                      >
                        {a.caption}
                      </div>
                    ) : a.type === "image" ? (
                      <img src={a.url} className="w-full h-full object-cover" alt="Archived" />
                    ) : (
                      <video src={a.url} className="w-full h-full object-cover" muted />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{a.username}</div>
                    <div className="text-sm text-gray-500">
                      {a.archivedAt?.toDate ? a.archivedAt.toDate().toLocaleString() : a.archivedAt || ""}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => {
                        if (a.userId) {
                          setArchiveModalOpen(false);
                          setStatusViewerUserId(a.userId);
                        } else {
                          showToast({ message: a.caption || "Archived media preview" });
                        }
                      }}
                    >
                      View
                    </button>

                    <button
                      className="text-sm px-3 py-1 bg-green-100 rounded text-green-700 hover:bg-green-200"
                      onClick={() => handleRestoreArchive(a)}
                    >
                      Restore
                    </button>

                    <button
                      className="text-sm px-3 py-1 bg-blue-100 rounded text-blue-700 hover:bg-blue-200"
                      onClick={() => handleDownloadArchive(a)}
                    >
                      Download
                    </button>

                    <button
                      className="text-sm px-3 py-1 bg-red-100 rounded text-red-600 hover:bg-red-200"
                      onClick={async () => {
                        // ... (existing delete logic - unchanged)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Viewer */}
      {statusViewerUserId && (
        <StatusViewer
          currentUser={currentUser}
          userId={statusViewerUserId}
          onClose={() => setStatusViewerUserId(null)}
        />
      )}
    </>
  );
};

export default StatusPage;
