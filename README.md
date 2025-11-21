# Moverse Agent App

A WhatsApp-first agent console for Moverse Technologies.

This app lets an internal agent log in, see conversations synced from the WhatsApp Business API (via an external "Agency" service), and reply to customers in a real-time style UI powered by Supabase.

The project started from the original **"Let's Chat"** repo, then was refactored to:

- Use **Supabase** for conversations, messages, and contacts.
- Integrate with an external **Agency App** / WhatsApp Business API proxy.
- Keep a simplified **email/password auth** flow.
- Refresh the **UI** to match Moverse branding.

---

## Tech Stack

- **Frontend**: React, TailwindCSS (CRA in `frontend/`)
- **Auth**: Email/password via the existing `AuthContext` (Firebase or compatible provider)
- **Data**: Supabase Postgres + Supabase client for:
  - `conversations` (chat rooms)
  - `messages` (WhatsApp messages, inbound and outbound)
  - `contacts` (WhatsApp contacts / customers)
- **Realtime**: Supabase Realtime on the `messages` table
- **WhatsApp Integration**: Agent App backend (Node) that proxies to the Agency / WhatsApp Business API and writes into Supabase

There is no longer any MongoDB or Socket.io dependency in the main flow.

---

## Main Features

- **Agent login** (email + password)
- **Agent header** branded as *Moverse Technologies*
- **Sidebar with conversations**
  - List of WhatsApp conversations from `conversations` / `contacts`
  - Search across contacts
  - Blue-accent UI for active chat, unread count, and statuses
- **Chat room view**
  - Message history loaded from Supabase `messages`
  - Realtime updates via Supabase Realtime (new rows on `messages`)
  - Incoming vs outgoing bubble styles
  - Emoji picker integration
  - File upload helper for media messages (uploads to Agent backend then sends a media message)
- **Profile page** for the current agent
- **Dark mode** toggle

---

## Project Structure

- `frontend/`
  - React app (this is what you run in development)
  - `src/components/chat` – chat UI (ChatLayout, ChatRoom, Message, AllUsers, etc.)
  - `src/components/accounts` – Login, Register, Profile
  - `src/components/layouts` – Header, layout wrappers, error banner
  - `src/services/ChatService.js` – Supabase queries + Agent backend HTTP calls
  - `src/contexts/AuthContext.js` – auth handling and current user
- `server/` (if present)
  - Agent backend / proxy responsible for:
    - Handling `/api/sendMessage` and `/api/uploadMedia`
    - Receiving WhatsApp webhooks from the Agency / Meta
    - Writing `conversations`, `contacts`, and `messages` into Supabase

---

## Getting Started (Dev)

### 1. Clone and install

```bash
git clone <this-repo-url>
cd moverse-agent

# frontend
cd frontend
npm install
```

If you are running the backend in this repo, also:

```bash
cd ../server
npm install
```

---

### 2. Configure environment variables

In `frontend/.env` (create it if needed), set:

```bash
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional – only if the Agent App is not same-origin
REACT_APP_AGENT_APP_API_URL=http://localhost:4000

# Optional – Agency app public URL if needed
REACT_APP_AGENCY_API_URL=https://your-agency-app.example.com
```

Configure your auth provider (Firebase or equivalent) as required by `AuthContext.js`.

On the backend side (if you run it from this repo), create a root `.env` (or `server/.env`) with:

- Supabase service role key
- WhatsApp Business / Agency credentials
- Agent app port, etc.

---

### 3. Supabase schema expectations

The frontend expects at least these tables:

- `contacts`
  - `id`, `wa_id`, `profile_name`, `profile_picture_url`, `phone_number`
- `conversations`
  - `id`, `contact_id`, `status`, `unread_count`, `last_message_at`
- `messages`
  - `id`, `conversation_id`, `direction` ("incoming" | "outgoing"), `message`, `sent_at`, plus WhatsApp metadata

Enable **Realtime** on the `messages` table and add it to the `supabase_realtime` publication so new rows stream into the UI.

---

### 4. Run the app

In one terminal:

```bash
cd frontend
npm start
```

This starts the React dev server at `http://localhost:3000`.

If you run the backend locally, start it in another terminal according to its README (usually `npm run dev` or `npm start`).

---

## Usage Flow

1. Open `http://localhost:3000` – you will see the **Login** screen by default.
2. Log in as an agent.
3. You are redirected to `/chat`, where you see:
   - Sidebar with conversations and search.
   - Main chat panel with message history.
4. New WhatsApp messages (inserted into `messages`) appear in real time.
5. Use the text area, emoji picker, and send button to reply.

---

## Notes

- This codebase is tailored to Moverse workflows; it is no longer a generic multi-user public chat.
- Keep all API keys, Supabase keys, and WhatsApp credentials private and **never** commit them to version control.

