import React from "react";

const ViewerModal = ({ open, onClose, viewers = [] }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-4 rounded-xl shadow-lg animate-slideUp">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Viewed by</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {viewers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
            <span className="text-4xl mb-2 animate-bounce">👀</span>
            <span className="text-center text-sm">No one has viewed this status yet.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
            {viewers.map((viewer) => (
              <div
                key={viewer.uid}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 flex-shrink-0">
                  <img
                    src={viewer.photoURL || "/default-avatar.png"}
                    alt={viewer.username || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Username + timestamp */}
                <div className="flex flex-col flex-1">
                  <span className="font-medium text-gray-800 dark:text-gray-100">
                    {viewer.username || "Unknown User"}
                  </span>
                  {viewer.viewedAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(
                        viewer.viewedAt?.toDate
                          ? viewer.viewedAt.toDate()
                          : viewer.viewedAt
                      ).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>

                {/* Optional reaction */}
                {viewer.reaction && (
                  <span className="text-sm text-xl">{viewer.reaction}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerModal;
