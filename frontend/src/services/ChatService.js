import axios from "axios";
import { supabase } from "../lib/supabaseClient";

const AGENCY_BASE_URL = process.env.REACT_APP_AGENCY_API_URL || "https://moverse-portfolio.vercel.app";
const AGENT_APP_BASE_URL = process.env.REACT_APP_AGENT_APP_API_URL || ""; // empty -> same origin

export const initiateSocketConnection = async () => {
  // Socket.io removed. Provide a minimal stub to keep legacy callers from crashing.
  const stub = {
    emit: () => {},
    on: () => {},
  };
  return stub;
};

// Upload media to Agent App, returns { media_url }
export const uploadMedia = async (file, folder = "uploads") => {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const url = `${AGENT_APP_BASE_URL}/api/uploadMedia`;
  const res = await axios.post(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Send media message by sending the media URL via Agency sendMessage (text body contains link or caption + link)
export const sendMediaMessage = async ({ chatRoomId, mediaUrl, caption }) => {
  const text = caption ? `${caption}\n${mediaUrl}` : mediaUrl;
  return sendMessage({ chatRoomId, message: text });
};

// Map Supabase contact row -> legacy user shape consumed by UI components
const mapContactToUser = (c) => ({
  uid: c?.id,
  email: undefined,
  displayName: c?.profile_name || c?.wa_id,
  photoURL: c?.profile_picture_url || undefined,
});

// Legacy: list of users; now sourced from contacts
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, wa_id, profile_name, profile_picture_url");
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []).map(mapContactToUser);
};

// Legacy: get user by id; now contact by id
export const getUser = async (userId) => {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, wa_id, profile_name, profile_picture_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return mapContactToUser(data);
};

// Legacy: chat rooms list; now conversations joined to contacts, mapped to legacy shape
export const getChatRooms = async (_userId) => {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, contact_id, status, unread_count, last_message_at, contacts:contact_id(id, wa_id, profile_name, profile_picture_url)"
    )
    .order("last_message_at", { ascending: false });

  console.log("[getChatRooms] data", data);
  console.log("[getChatRooms] error", error);

  if (error) {
    console.error(error);
    return [];
  }

  const conversations = data || [];

  if (conversations.length === 0) {
    return [];
  }

  // Fetch the latest message per conversation so we can show a preview and
  // derive a reliable last_message_at that also reflects inbound messages
  // that may have arrived while the agent was offline.
  const conversationIds = conversations.map((c) => c.id);

  const { data: allLastMessages, error: lastMsgError } = await supabase
    .from("messages")
    .select("conversation_id, message, sent_at")
    .in("conversation_id", conversationIds)
    .order("sent_at", { ascending: false });

  if (lastMsgError) {
    console.error("[getChatRooms] last message fetch error", lastMsgError);
  }

  const lastMessageByConversation = {};
  (allLastMessages || []).forEach((m) => {
    if (!lastMessageByConversation[m.conversation_id]) {
      lastMessageByConversation[m.conversation_id] = m;
    }
  });

  return conversations.map((row) => {
    const latest = lastMessageByConversation[row.id];
    const lastMessageAt = latest?.sent_at || row.last_message_at || null;

    return {
      _id: row.id,
      members: ["self", row.contact_id],
      status: row.status,
      unread_count: row.unread_count,
      last_message_at: lastMessageAt,
      last_message: latest?.message || "",
      contact: row.contacts,
    };
  });
};

// Legacy: get messages of chat room; now messages of conversation
export const getMessagesOfChatRoom = async (chatRoomId) => {
  // Fetch messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, conversation_id, direction, message, sent_at")
    .eq("conversation_id", chatRoomId)
    .order("sent_at", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  // Map to legacy message shape: { sender, message, createdAt }
  return (messages || []).map((m) => ({
    sender: m.direction === "outgoing" ? "self" : "other",
    message: m.message,
    createdAt: m.sent_at,
  }));
};

// Legacy helper retained for API parity; unused in new flow
export const getChatRoomOfUsers = async () => {
  return [];
};

export const createChatRoom = async () => {
  return null;
};

// Send text message via Agency App; derive recipient from conversation contact
export const sendMessage = async ({ chatRoomId, message }) => {
  // Lookup conversation -> contact -> phone_number
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, contact_id, contacts:contact_id(phone_number)")
    .eq("id", chatRoomId)
    .maybeSingle();

  if (convErr || !conv) {
    console.error(convErr || new Error("Conversation not found"));
    throw convErr || new Error("Conversation not found");
  }

  const to = conv.contacts?.phone_number || "";
  if (!to) throw new Error("Contact phone number is missing");

  // Call Agent backend proxy, which forwards to Agency /api/sendMessage
  const url = `${AGENT_APP_BASE_URL}/api/sendMessage`;
  const payload = { to, message };

  const res = await axios.post(url, payload, { headers: { "Content-Type": "application/json" } });

  // Optimistically return message in legacy shape
  return {
    sender: "self",
    message,
    createdAt: new Date().toISOString(),
  };
};
