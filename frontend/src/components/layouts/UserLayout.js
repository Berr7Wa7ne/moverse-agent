import { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/outline";

export default function UserLayout({ user, onlineUsersId, isOnlineOverride }) {
  const [showPreview, setShowPreview] = useState(false);

  const isOnline =
    typeof isOnlineOverride === "boolean"
      ? isOnlineOverride
      : onlineUsersId?.includes(user?.uid);

  return (
    <>
      <div className="relative flex items-center">
        {user?.photoURL ? (
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="focus:outline-none"
          >
            <img
              className="w-10 h-10 rounded-full object-cover"
              src={user.photoURL}
              alt={user?.displayName || ""}
            />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-200">
            <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
        <span className="block ml-2 text-gray-500 dark:text-gray-400">
          {user?.displayName}
        </span>
        {isOnline ? (
          <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-green-500 dark:bg-green-400 border-2 border-white rounded-full"></span>
        ) : (
          <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-gray-400 border-2 border-white rounded-full"></span>
        )}
      </div>

      {showPreview && user?.photoURL && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowPreview(false)}
        >
          <img
            className="max-w-xs max-h-[70vh] rounded-lg shadow-lg"
            src={user.photoURL}
            alt={user.displayName || ""}
          />
        </div>
      )}
    </>
  );
}
