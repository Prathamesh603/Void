# Void — Your Research Agent (Frontend)

Modern React UI inspired by [NotebookLM](https://notebooklm.google/): landing page + three-panel workspace.

## Stack

- React 19 + Vite
- React Router
- Tailwind CSS 4
- Framer Motion
- react-resizable-panels
- react-markdown

## Run

```bash
cd frontend
npm install
npm run dev
```

Backend must be running at `http://localhost:8000`.

Optional: copy `.env.example` to `.env.local` and set `VITE_API_URL`.

## Routes

| Path | Page |
|------|------|
| `/` | Landing |
| `/app` | Workspace (new chat) |
| `/app/:sessionId` | Workspace (session) |

## Backend API used

- Users: `POST /api/users/{user_id}`
- Sessions: `GET/POST/DELETE /api/sessions/...`
- Chat: `GET/POST /api/sessions/{id}/messages|chat`
- Papers: `GET /api/papers/{session_id}`
- PDF: `POST /api/pdf/download`, `GET /api/pdf/list/{id}`, `GET /api/pdf/view/{id}`

Default user id: `void_user` (created on first load).
