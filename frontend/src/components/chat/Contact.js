import { useState, useEffect } from "react";

import { getUser } from "../../services/ChatService";
import UserLayout from "../layouts/UserLayout";

export default function Contact({ chatRoom, onlineUsersId }) {
  const [contact, setContact] = useState();

  useEffect(() => {
    const preload = async () => {
      // Prefer pre-joined contact info
      if (chatRoom?.contact) {
        setContact({
          uid: chatRoom.contact.id,
          displayName: chatRoom.contact.profile_name || chatRoom.contact.wa_id,
          photoURL: chatRoom.contact.profile_picture_url || undefined,
        });
        return;
      }

      // Fallback: derive contact id from members list (expects ["self", contactId])
      const contactId = chatRoom.members?.find((m) => m !== "self");
      if (contactId) {
        const res = await getUser(contactId);
        setContact(res);
      }
    };
    preload();
  }, [chatRoom]);

  const status = chatRoom.status || "open";
  const unread = chatRoom.unread_count || 0;

  const lastMessageAt = chatRoom.last_message_at;
  let isOnline = false;
  if (lastMessageAt) {
    const last = new Date(lastMessageAt).getTime();
    const diffMs = Date.now() - last;
    if (!Number.isNaN(last)) {
      isOnline = diffMs < 5 * 60 * 1000; // 5 minutes
    }
  }

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex-1 min-w-0">
        <UserLayout
          user={contact}
          onlineUsersId={onlineUsersId}
          isOnlineOverride={isOnline}
        />
      </div>
      <div className="flex flex-col items-end ml-2">
        <span
          className={`text-[10px] uppercase tracking-wide rounded px-1 py-0.5 ${
            status === "open"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
          }`}
        >
          {status}
        </span>
        {unread > 0 && (
          <span className="mt-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-blue-600 rounded-full dark:bg-blue-500">
            {unread}
          </span>
        )}
      </div>
    </div>
  );
}
