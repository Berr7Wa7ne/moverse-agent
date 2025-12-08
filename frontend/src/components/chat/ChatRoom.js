import { useEffect, useRef, useState } from "react";
import { getMessagesOfChatRoom, sendMessage } from "../../services/ChatService";
import { supabase } from "../../lib/supabaseClient";

import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";
import { ChevronRightIcon } from "@heroicons/react/outline";

export default function ChatRoom({ currentChat, onBack }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const bgRef = useRef(null);

  // ✅ Live background switcher
  const applyThemeBackground = () => {
    if (!bgRef.current) return;

    const isDark = document.documentElement.classList.contains("dark");

    bgRef.current.style.backgroundImage = isDark
      ? "url('/bg1.png')"
      : "url('/bg2.png')";
  };

  useEffect(() => {
    applyThemeBackground();

    const observer = new MutationObserver(() => {
      applyThemeBackground();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Load messages
  useEffect(() => {
    if (!currentChat?._id) return;

    const fetchMessages = async () => {
      const res = await getMessagesOfChatRoom(currentChat._id);
      setMessages(res);
    };

    fetchMessages();
  }, [currentChat?._id]);

  // Scroll to latest
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase realtime
  useEffect(() => {
    if (!currentChat?._id) return;

    const channel = supabase
      .channel(`chat-messages-${currentChat._id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentChat._id}`,
        },
        (payload) => {
          const m = payload.new;
          setMessages((prev) => [
            ...prev,
            {
              sender: m.direction === "outgoing" ? "self" : "other",
              message: m.message,
              message_type: m.message_type || "text",
              caption: m.caption || null,
              media_url: m.media_url || null,
              createdAt: m.sent_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentChat?._id]);

  // Send message
  const handleFormSubmit = async (message) => {
    if (!message.trim()) return;
    try {
      const sent = await sendMessage({
        chatRoomId: currentChat._id,
        message,
      });

      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error("Message send failed", err);
    }
  };

  return (
    <div className="lg:col-span-2 lg:block">
      <div className="w-full">

        {/* Header */}
        <div className="p-3 bg-blue-50 border-b border-blue-100 dark:bg-gray-900 dark:border-gray-700 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <Contact
              chatRoom={currentChat}
              showLastMessage={false}
              showUnread={false}
            />
          </div>

          {onBack && (
            <button
              type="button"
              className="ml-2 inline-flex items-center justify-center rounded-full bg-white text-blue-600 border border-blue-200 p-1 shadow-sm lg:hidden"
              onClick={onBack}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Chat Body */}
        <div
          ref={bgRef}
          className="relative w-full p-6 overflow-y-auto h-[30rem] border-b border-blue-100 dark:border-gray-700 bg-no-repeat bg-cover bg-center bg-fixed transition-all duration-300"
        >
          <div className="relative z-10 space-y-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 dark:text-gray-300">
                  No messages yet
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  ref={idx === messages.length - 1 ? scrollRef : null}
                >
                  <Message message={msg} self="self" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input */}
        <ChatForm
          handleFormSubmit={handleFormSubmit}
          chatRoomId={currentChat?._id}
        />
      </div>
    </div>
  );
}
