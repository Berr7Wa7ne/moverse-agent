import { useState, useEffect } from "react";
import { createChatRoom } from "../../services/ChatService";
import Contact from "./Contact";
import UserLayout from "../layouts/UserLayout";
import { supabase } from "../../lib/supabaseClient";
import { getChatRooms } from "../../services/ChatService";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AllUsers({
  users,
  chatRooms,
  setChatRooms,
  onlineUsersId,
  currentUser,
  changeChat,
  currentChat, // 🆕 Add this prop
}) {
  const [selectedChat, setSelectedChat] = useState();
  const [nonContacts, setNonContacts] = useState([]);
  const [contactIds, setContactIds] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel("sidebar-unread-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async () => {
          const updatedRooms = await getChatRooms(currentUser?.id);
          
          // 🆕 Preserve unread_count: 0 for currently open chat
          setChatRooms(prevRooms => {
            return updatedRooms.map(newRoom => {
              // If this is the currently open chat, keep unread_count at 0
              if (currentChat?._id === newRoom._id) {
                return { ...newRoom, unread_count: 0 };
              }
              return newRoom;
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, setChatRooms, currentChat?._id]);

  useEffect(() => {
    const Ids = chatRooms.map((chatRoom) => {
      return chatRoom.members.find((member) => member !== "self");
    });
    setContactIds(Ids);
  }, [chatRooms]);

  useEffect(() => {
    setNonContacts(
      users.filter(
        (f) => f.uid !== currentUser?.id && !contactIds.includes(f.uid)
      )
    );
  }, [contactIds, users, currentUser]);

  const changeCurrentChat = (index, chat) => {
    setSelectedChat(index);
    changeChat(chat);
  };

  const handleNewChatRoom = async (user) => {
    const members = {
      senderId: currentUser?.id,
      receiverId: user.uid,
    };
    const res = await createChatRoom(members);
    setChatRooms((prev) => [...prev, res]);
    changeChat(res);
  };

  return (
    <>
      <ul className="overflow-auto h-[30rem]">
        <h2 className="my-2 mb-2 ml-2 text-blue-700 dark:text-white">Chats</h2>
        <li>
          {chatRooms.map((chatRoom, index) => (
            <div
              key={index}
              className={classNames(
                index === selectedChat
                  ? "bg-blue-50 border-l-4 border-blue-500 dark:bg-gray-700 dark:border-blue-500"
                  : "transition duration-150 ease-in-out cursor-pointer bg-white border-b border-blue-100 hover:bg-blue-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-700",
                "flex items-center px-3 py-2 text-sm "
              )}
              onClick={() => changeCurrentChat(index, chatRoom)}
            >
              <Contact
                chatRoom={chatRoom}
                onlineUsersId={onlineUsersId}
                currentUser={currentUser}
                showLastMessage
                showUnread
                isCurrentChat={currentChat?._id === chatRoom._id}
              />
            </div>
          ))}
        </li>
        <li>
          {nonContacts.map((nonContact, index) => (
            <div
              key={index}
              className="flex items-center px-3 py-2 text-sm bg-white border-b border-blue-100 hover:bg-blue-50 cursor-pointer dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-700"
              onClick={() => handleNewChatRoom(nonContact)}
            >
              <UserLayout user={nonContact} onlineUsersId={onlineUsersId} />
            </div>
          ))}
        </li>
      </ul>
    </>
  );
}