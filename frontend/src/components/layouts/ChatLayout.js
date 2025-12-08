import { useEffect, useRef, useState } from "react";

import { getAllUsers, getChatRooms } from "../../services/ChatService";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";

import ChatRoom from "../chat/ChatRoom";
import Welcome from "../chat/Welcome";
import AllUsers from "../chat/AllUsers";
import SearchUsers from "../chat/SearchUsers";

export default function ChatLayout() {
  const [users, SetUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);

  const [currentChat, setCurrentChat] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedChat = localStorage.getItem('currentChat');
      return savedChat ? JSON.parse(savedChat) : undefined;
    }
    return undefined;
  });
  const [onlineUsersId, setonlineUsersId] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isContact, setIsContact] = useState(false);

  const socket = useRef();

  const { currentUser, agentProfile } = useAuth();

  // Socket.io removed; online presence not implemented. Keep empty list.

  useEffect(() => {
    const fetchData = async () => {
      const res = await getChatRooms(currentUser?.id);
      setChatRooms(res);
    };

    if (currentUser) fetchData();
  }, [currentUser]);

  // Keep chatRooms (last message preview + unread_count) in sync in real time
  // whenever new messages are inserted.
  useEffect(() => {
  if (!currentUser) return;

  const channel = supabase
    .channel("chat-conversations")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
      },
      async (payload) => {
        const res = await getChatRooms(currentUser.id);
        setChatRooms(res);

        // ✅ Auto clear unread for open chat
        if (currentChat && payload.new.conversation_id === currentChat._id) {
          setChatRooms((prev) =>
            prev.map((room) =>
              room._id === currentChat._id
                ? { ...room, unread_count: 0 }
                : room
            )
          );
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
      },
      (payload) => {
        setChatRooms((prev) =>
          prev.map((room) =>
            room._id === payload.new.id
              ? { ...room, ...payload.new }
              : room
          )
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentUser, currentChat]);


  useEffect(() => {
    const fetchData = async () => {
      const res = await getAllUsers();
      SetUsers(res);
    };

    fetchData();
  }, []);

  useEffect(() => {
    setFilteredUsers(users);
    setFilteredRooms(chatRooms);
  }, [users, chatRooms]);

  useEffect(() => {
    if (isContact) {
      setFilteredUsers([]);
    } else {
      setFilteredRooms([]);
    }
  }, [isContact]);

  const handleChatChange = async (chat) => {
  setCurrentChat(chat);
  if (typeof window !== "undefined") {
    localStorage.setItem("currentChat", JSON.stringify(chat));
  }

  if (chat?._id) {
    // ✅ Optimistic UI update
    setChatRooms((prev) =>
      prev.map((room) =>
        room._id === chat._id ? { ...room, unread_count: 0 } : room
      )
    );

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", chat._id);

      if (error) {
        console.error("Failed to update unread count", error);
      }
    } catch (err) {
      console.error("Unread update failed", err);
    }
  }
};

  const handleSearch = (newSearchQuery) => {
    setSearchQuery(newSearchQuery);

    const searchedUsers = users.filter((user) => {
      return user.displayName
        .toLowerCase()
        .includes(newSearchQuery.toLowerCase());
    });

    const searchedUsersId = searchedUsers.map((u) => u.uid);

    // If there are initial contacts
    if (chatRooms.length !== 0) {
      chatRooms.forEach((chatRoom) => {
        // Check if searched user is a contact or not.
        const isUserContact = chatRoom.members.some(
          (e) => e !== "self" && searchedUsersId.includes(e)
        );
        setIsContact(isUserContact);

        isUserContact
          ? setFilteredRooms([chatRoom])
          : setFilteredUsers(searchedUsers);
      });
    } else {
      setFilteredUsers(searchedUsers);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="min-w-full bg-white border-x border-b border-blue-100 dark:bg-gray-900 dark:border-gray-700 rounded lg:grid lg:grid-cols-3">
        <div
          className={`${
            currentChat ? "hidden lg:block" : "block"
          } bg-blue-50 border-r border-blue-100 dark:bg-gray-900 dark:border-gray-700 lg:col-span-1`}
        >
          <div className="px-4 py-3 border-b border-blue-100 dark:border-gray-700 flex flex-col">
            <span className="text-sm font-semibold text-blue-950 dark:text-white">
              {agentProfile?.name || currentUser?.email || "Agent"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {agentProfile?.role || "agent"}
            </span>
          </div>
          <SearchUsers handleSearch={handleSearch} />

          <AllUsers
            users={searchQuery !== "" ? filteredUsers : users}
            chatRooms={searchQuery !== "" ? filteredRooms : chatRooms}
            setChatRooms={setChatRooms}
            onlineUsersId={onlineUsersId}
            currentUser={currentUser}
            changeChat={handleChatChange}
            currentChat={currentChat}
          />
        </div>

        {currentChat ? (
          <ChatRoom
            currentChat={currentChat}
            currentUser={currentUser}
            socket={socket}
            onBack={() => setCurrentChat(undefined)}
            setChatRooms={setChatRooms} 
          />
        ) : (
          <Welcome />
        )}
      </div>
    </div>
  );
}
