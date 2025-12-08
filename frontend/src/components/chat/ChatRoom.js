import { useEffect, useRef, useState, useCallback } from "react";
import { getMessagesOfChatRoom, sendMessage } from "../../services/ChatService";
import { supabase } from "../../lib/supabaseClient";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";
import { ChevronRightIcon } from "@heroicons/react/outline";

// Helper function to normalize message structure
const normalizeMessage = (msg) => ({
  ...msg,
  id: msg.id || msg._id,
  sender: msg.sender || (msg.direction === 'outgoing' ? 'self' : 'other'),
  message: msg.message || '',
  message_type: msg.message_type || 'text',
  caption: msg.caption || null,
  media_url: msg.media_url || null,
  file_name: msg.file_name || null,
  file_size: msg.file_size || null,
  mime_type: msg.mime_type || null,
  createdAt: msg.sent_at || msg.createdAt || new Date().toISOString()
});

export default function ChatRoom({ currentChat, onBack, setChatRooms }) { // 🆕 Add setChatRooms prop
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const bgRef = useRef(null);

  // ✅ Live background switcher
  const applyThemeBackground = useCallback(() => {
    if (!bgRef.current) return;
    const isDark = document.documentElement.classList.contains("dark");
    bgRef.current.style.backgroundImage = isDark
      ? "url('/bg1.png')"
      : "url('/bg2.png')";
  }, []);

  // Background theme effect
  useEffect(() => {
    applyThemeBackground();
    const observer = new MutationObserver(applyThemeBackground);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [applyThemeBackground]);

  // 🆕 Mark messages as read - both in DB and local state
  const markAsRead = useCallback(async () => {
    if (!currentChat?._id) return;
    
    try {
      // Update database
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', currentChat._id);
      
      // 🆕 IMMEDIATELY update local state to prevent badge from reappearing
      if (setChatRooms) {
        setChatRooms(prev => 
          prev.map(room => 
            room._id === currentChat._id 
              ? { ...room, unread_count: 0 }
              : room
          )
        );
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [currentChat?._id, setChatRooms]);

  // Load messages and mark as read
  useEffect(() => {
    if (!currentChat?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await getMessagesOfChatRoom(currentChat._id);
        const formattedMessages = res.map(normalizeMessage);
        setMessages(formattedMessages);
        // 🆕 Mark as read when messages are loaded
        await markAsRead();
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [currentChat?._id, markAsRead]);

  // Scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase realtime subscription
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
        async (payload) => {
          const newMessage = normalizeMessage(payload.new);
          setMessages(prev => {
            // Prevent duplicate messages
            const messageExists = prev.some(msg => 
              msg.id === newMessage.id || 
              (msg.createdAt === newMessage.createdAt && 
               msg.message === newMessage.message &&
               msg.sender === newMessage.sender)
            );
            return messageExists ? prev : [...prev, newMessage];
          });
          
          // 🆕 Mark as read immediately since chat is open
          await markAsRead();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentChat?._id, markAsRead]);

  // Send message handler
  const handleFormSubmit = async (message) => {
    if (!message?.trim()) return;
    
    try {
      const sent = await sendMessage({
        chatRoomId: currentChat._id,
        message,
        file_name: message.file_name,
        file_size: message.file_size,
        mime_type: message.mime_type
      });

      const formattedMessage = normalizeMessage({
        ...sent,
        sender: 'self'
      });

      setMessages(prev => {
        // Prevent duplicate messages
        const messageExists = prev.some(msg => 
          msg.id === formattedMessage.id || 
          (msg.createdAt === formattedMessage.createdAt && 
           msg.message === formattedMessage.message)
        );
        return messageExists ? prev : [...prev, formattedMessage];
      });
    } catch (err) {
      console.error("Message send failed:", err);
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
                  key={msg.id || idx}
                  ref={idx === messages.length - 1 ? scrollRef : null}
                >
                  <Message message={msg} self={msg.sender === 'self'} />
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