import { useState, useEffect, useRef } from "react";
import { uploadMedia, sendMediaMessage } from "../../services/ChatService";

import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/solid";
import { EmojiHappyIcon } from "@heroicons/react/outline";
import Picker from "emoji-picker-react";

export default function ChatForm(props) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView();
  }, [showEmojiPicker]);

  const handleEmojiClick = (event, emojiObject) => {
    let newMessage = message + emojiObject.emoji;
    setMessage(newMessage);
  };

  const submitMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    await props.handleFormSubmit(trimmed);
    setMessage("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await submitMessage();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await uploadMedia(file, "uploads");
      if (res?.media_url) {
        await sendMediaMessage({ chatRoomId: props.currentChatId || props.chatRoomId, mediaUrl: res.media_url, caption: message || undefined });
      }
      setMessage("");
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setUploading(false);
      // reset input value to allow same file re-select
      e.target.value = "";
    }
  };

  return (
    <div ref={scrollRef}>
      {showEmojiPicker && (
        <Picker className="dark:bg-gray-900" onEmojiClick={handleEmojiClick} />
      )}
      <form onSubmit={handleFormSubmit}>
        <div className="flex items-center justify-between w-full p-3 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <label className="mr-2 cursor-pointer flex items-center">
            <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} />
            <PaperClipIcon
              className="h-6 w-6 text-blue-600 dark:text-blue-500"
              aria-hidden="true"
            />
            {uploading && (
              <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                Uploading...
              </span>
            )}
          </label>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowEmojiPicker(!showEmojiPicker);
            }}
          >
            <EmojiHappyIcon
              className="h-7 w-7 text-blue-600 dark:text-blue-500"
              aria-hidden="true"
            />
          </button>

          <textarea
            rows={1}
            placeholder="Write a message"
            className="block w-full py-2 pl-4 mx-3 resize-none outline-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                await submitMessage();
              }
            }}
          />
          <button type="submit">
            <PaperAirplaneIcon
              className="h-6 w-6 text-blue-600 dark:text-blue-500 rotate-[90deg]"
              aria-hidden="true"
            />
          </button>
        </div>
      </form>
    </div>
  );
}
