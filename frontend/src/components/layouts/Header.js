import { LogoutIcon, UserCircleIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import Logout from "../accounts/Logout";
import ThemeToggler from "./ThemeToggler";

export default function Header() {
  const [modal, setModal] = useState(false);

  const { currentUser } = useAuth();

  return (
    <>
      <nav className="px- px-2 sm:px-4 py-2.5 bg-blue-50 border-blue-100 dark:bg-gray-800 dark:border-gray-700 text-gray-900 text-sm rounded border dark:text-white">
        <div className="container mx-auto flex flex-wrap items-center justify-between">
          <Link to="/" className="flex">
            <span className="self-center text-lg font-semibold whitespace-nowrap text-blue-700 dark:text-white">
              Moverse Technologies
            </span>
          </Link>
          <div className="flex md:order-2">
            <ThemeToggler />

            {currentUser && (
              <>
                <button
                  className="text-blue-600 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 focus:outline-none rounded-lg text-sm p-2.5"
                  onClick={() => setModal(true)}
                >
                  <LogoutIcon className="h-8 w-8" aria-hidden="true" />
                </button>

                <Link
                  to="/profile"
                  className="text-blue-600 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700 focus:outline-none rounded-full text-sm p-2.5"
                >
                  {currentUser.photoURL ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "Profile"}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-700 dark:text-gray-200">
                      <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {modal && <Logout modal={modal} setModal={setModal} />}
    </>
  );
}
