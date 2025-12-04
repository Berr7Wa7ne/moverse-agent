import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

import { getMessagesOfChatRoom, sendMessage } from "../../services/ChatService";

import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";
import { ChevronRightIcon } from "@heroicons/react/outline";

export default function ChatRoom({ currentChat, onBack }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();

  // 🟢 Fetch messages when chat room changes
  useEffect(() => {
    if (!currentChat?._id) return;
    
    const fetchData = async () => {
      console.log("[ChatRoom] Fetching messages for:", currentChat._id);
      const res = await getMessagesOfChatRoom(currentChat._id);
      console.log("[ChatRoom] Messages fetched:", res);
      setMessages(res);
    };

    fetchData();
  }, [currentChat?._id]);

  // 🟢 Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🟢 Real-time subscription for new messages
  useEffect(() => {
    if (!currentChat?._id) return;

    console.log("[ChatRoom] Setting up real-time subscription for:", currentChat._id);

    // Subscribe to new messages for this conversation
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
          console.log("[ChatRoom] NEW MESSAGE FROM SUPABASE:", payload);
          const m = payload.new;
          
          // 🟢 FIX: Include message_type and caption in real-time updates
          setMessages((prev) => [
            ...prev,
            {
              sender: m.direction === "outgoing" ? "self" : "other",
              message: m.message,
              message_type: m.message_type || "text",
              caption: m.caption || null,
              createdAt: m.sent_at,
            },
          ]);
        }
      )
      .subscribe((status) => {
        console.log("[ChatRoom] Subscription status:", status);
      });

    return () => {
      console.log("[ChatRoom] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [currentChat?._id]);

  const handleFormSubmit = async (message) => {
    try {
      console.log("[ChatRoom] Sending message:", message);
      await sendMessage({ chatRoomId: currentChat._id, message });
    } catch (error) {
      console.error("[ChatRoom] Error sending message:", error);
    }
  };

  return (
    <div className="lg:col-span-2 lg:block">
      <div className="w-full">
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
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="relative w-full p-6 overflow-y-auto h-[30rem] bg-white border-b border-blue-100 dark:bg-gray-900 dark:border-gray-700">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 dark:text-gray-500">No messages yet</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {messages.map((message, index) => (
                <div key={index} ref={index === messages.length - 1 ? scrollRef : null}>
                  <Message 
                    message={message} 
                    self={"self"} 
                  />
                </div>
              ))}
            </ul>
          )}
        </div>

        <ChatForm handleFormSubmit={handleFormSubmit} chatRoomId={currentChat._id} />
      </div>
    </div>
  );
}