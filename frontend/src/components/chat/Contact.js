import { useState, useEffect } from "react";
import { getUser } from "../../services/ChatService";
import UserLayout from "../layouts/UserLayout";
import {
  PhotographIcon,
  VideoCameraIcon,
  MusicNoteIcon,
  DocumentTextIcon,
  EmojiHappyIcon,
  LocationMarkerIcon,
  UserIcon,
} from "@heroicons/react/outline";

export default function Contact({
  chatRoom,
  onlineUsersId,
  showLastMessage,
  showUnread = true,
}) {
  const [contact, setContact] = useState();

  useEffect(() => {
    const preload = async () => {
      if (chatRoom?.contact) {
        setContact({
          uid: chatRoom.contact.id,
          displayName:
            chatRoom.contact.profile_name || chatRoom.contact.wa_id,
          photoURL: chatRoom.contact.profile_picture_url || undefined,
        });
        return;
      }

      const contactId = chatRoom.members?.find((m) => m !== "self");
      if (contactId) {
        const res = await getUser(contactId);
        setContact(res);
      }
    };
    preload();
  }, [chatRoom]);

  const unread = chatRoom.unread_count || 0;

  // 🟢 Determine online status using last message time
  const lastMessageAt = chatRoom.last_message_at;
  let isOnline = false;
  if (lastMessageAt) {
    const last = new Date(lastMessageAt).getTime();
    if (!Number.isNaN(last)) {
      isOnline = Date.now() - last < 5 * 60 * 1000;
    }
  }

  // ✅ Last message with HeroIcons
  const getLastMessagePreview = () => {
    const type = chatRoom.last_message_type || "text";
    const caption = chatRoom.last_message_caption;
    const message = chatRoom.last_message;
    const fileName = chatRoom.last_message_file_name;

    const icons = {
      image: <PhotographIcon className="h-4 w-4 mr-1 text-gray-500" />,
      video: <VideoCameraIcon className="h-4 w-4 mr-1 text-gray-500" />,
      audio: <MusicNoteIcon className="h-4 w-4 mr-1 text-gray-500" />,
      document: <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-500" />,
      sticker: <EmojiHappyIcon className="h-4 w-4 mr-1 text-gray-500" />,
      location: <LocationMarkerIcon className="h-4 w-4 mr-1 text-gray-500" />,
      contact: <UserIcon className="h-4 w-4 mr-1 text-gray-500" />,
    };

    const fallback = {
      image: "Photo",
      video: "Video",
      audio: "Audio",
      document: fileName || "Document",
      sticker: "Sticker",
      location: "Location",
      contact: "Contact card",
    };

    if (type !== "text") {
      return (
        <span className="flex items-center">
          {icons[type]}
          {caption || fallback[type] || ""}
        </span>
      );
    }

    return message || "";
  };

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
            {getLastMessagePreview()}
          </p>
        )}
      </div>

      {/* ✅ Clean unread badge */}
      {showUnread && unread > 0 && (
        <div className="flex flex-col items-end ml-2">
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full dark:bg-blue-500">
            {unread > 9 ? "9+" : unread}
          </span>
        </div>
      )}
    </div>
  );
}
