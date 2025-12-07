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
          
          // 🟢 ENHANCED: Include ALL metadata fields for complete message display
          setMessages((prev) => [
            ...prev,
            {
              sender: m.direction === "outgoing" ? "self" : "other",
              message: m.message,
              message_type: m.message_type || "text",
              messageType: m.message_type || "text",      // Both formats for compatibility
              caption: m.caption || null,
              media_url: m.media_url || null,
              mediaUrl: m.media_url || null,              // Both formats for compatibility
              file_name: m.file_name || null,             // 🟢 NEW - Original filename
              file_size: m.file_size || null,             // 🟢 NEW - File size
              mime_type: m.mime_type || null,             // 🟢 NEW - MIME type
              thumbnail_url: m.thumbnail_url || null,     // 🟢 NEW - Video thumbnail
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

  // 🟢 ENHANCED: Handle text message submission
  const handleFormSubmit = async (message) => {
    try {
      console.log("[ChatRoom] Sending text message:", message);
      
      // Send the message
      const sentMessage = await sendMessage({ 
        chatRoomId: currentChat._id, 
        message 
      });
      
      // 🟢 Add optimistic message to UI immediately
      // Note: Real-time subscription will also add it, but this makes it instant
      setMessages((prev) => [...prev, sentMessage]);
      
      console.log("[ChatRoom] ✅ Message sent successfully");
    } catch (error) {
      console.error("[ChatRoom] ❌ Error sending message:", error);
      // Optionally show error toast to user
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

        <ChatForm 
          handleFormSubmit={handleFormSubmit} 
          chatRoomId={currentChat._id}
          currentChatId={currentChat._id}  // 🟢 Pass this for media messages
        />
      </div>
    </div>
  );
}