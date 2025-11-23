import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

import { getMessagesOfChatRoom, sendMessage } from "../../services/ChatService";

import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

export default function ChatRoom({ currentChat, onBack }) {
  const [messages, setMessages] = useState([]);

  const scrollRef = useRef();

  useEffect(() => {
    if (!currentChat?._id) return;
    const fetchData = async () => {
      const res = await getMessagesOfChatRoom(currentChat._id);
      setMessages(res);
    };

    fetchData();
  }, [currentChat?._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!currentChat?._id) return;
    // Subscribe to new messages for this conversation
    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentChat._id}`,
        },
        (payload) => {
          console.log("NEW MESSAGE FROM SUPABASE", payload);
          const m = payload.new;
          setMessages((prev) => [
            ...prev,
            {
              sender: m.direction === "outgoing" ? "self" : "other",
              message: m.message,
              createdAt: m.sent_at,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChat?._id]);

  const handleFormSubmit = async (message) => {
    await sendMessage({ chatRoomId: currentChat._id, message });
  };

  return (
    <div className="lg:col-span-2 lg:block">
      <div className="w-full">
        <div className="p-3 bg-blue-50 border-b border-blue-100 dark:bg-gray-900 dark:border-gray-700 flex items-center">
          {onBack && (
            <button
              type="button"
              className="mr-2 inline-flex items-center justify-center rounded-full bg-white text-blue-600 border border-blue-200 px-2 py-1 text-xs font-medium shadow-sm lg:hidden"
              onClick={onBack}
            >
              Back
            </button>
          )}
          <div className="flex-1 min-w-0">
            <Contact chatRoom={currentChat} showLastMessage={false} showUnread={false} />
          </div>
        </div>

        <div className="relative w-full p-6 overflow-y-auto h-[30rem] bg-white border-b border-blue-100 dark:bg-gray-900 dark:border-gray-700">
          <ul className="space-y-2">
            {messages.map((message, index) => (
              <div key={index} ref={scrollRef}>
                <Message message={message} self={"self"} />
              </div>
            ))}
          </ul>
        </div>

        <ChatForm handleFormSubmit={handleFormSubmit} chatRoomId={currentChat._id} />
      </div>
    </div>
  );
}
