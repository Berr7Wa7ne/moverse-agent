import { useState, useEffect } from "react";

import { getUser } from "../../services/ChatService";
import UserLayout from "../layouts/UserLayout";

export default function Contact({ chatRoom, onlineUsersId, showLastMessage, showUnread = true }) {
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
        {showLastMessage && chatRoom.last_message && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
            {chatRoom.last_message}
          </p>
        )}
      </div>
      {showUnread && unread > 0 && (
        <div className="flex flex-col items-end ml-2">
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold leading-none text-white bg-blue-600 rounded-full dark:bg-blue-500">
            {unread}
          </span>
        </div>
      )}
    </div>
  );
}
