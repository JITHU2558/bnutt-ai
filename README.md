# 🚀 BNutt AI – Smart AI Assistant with Task Management

BNutt AI is a full-stack AI-powered assistant built using Next.js 16, React 19, Supabase, and Groq AI.  
It combines conversational AI with task management, voice input, markdown rendering, and mobile support.

---

# 🌐 Live Demo

https://bnutt-ai.vercel.app

---

# ✨ Features

- 💬 Real-time AI chat
- 🧠 Groq AI integration using llama-3.1-8b-instant
- 🔐 Google OAuth authentication with Supabase Auth
- 📝 AI-powered task creation and management
- 📦 Persistent chat history storage
- ✅ Task management system
- 🎤 Voice input using Web Speech API
- 📄 Markdown rendering with GitHub Flavored Markdown
- 🖼️ Image upload support
- 📱 Android mobile app using Capacitor
- 🧑‍💻 Multi-user secure access with Row Level Security (RLS)
- ⚡ Fast deployment on Vercel
- 🛡️ Secure backend API routes

---

# 🏗️ Tech Stack

## Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## Backend
- Next.js API Routes
- Supabase
- PostgreSQL

## AI
- Groq API
- llama-3.1-8b-instant

## Mobile
- Capacitor Android

## Deployment
- Vercel

---

# 📁 Project Structure

```txt
bnutt-ai/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── login/
│   │   └── page.tsx
│   ├── Chat.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
├── lib/
│   └── supabase.ts
├── public/
├── android/
├── .env.local
├── package.json
└── README.md
```

---

# ⚙️ Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

GROQ_API_KEY=your_groq_api_key
```

---

# 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/bnutt-ai.git
```

Go to project folder:

```bash
cd bnutt-ai
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Run Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

# 🏭 Production Build

```bash
npm run build
```

---

# 📱 Android Build (Capacitor)

```bash
npm run build

npx cap sync android

npx cap open android
```

---

# 🧠 How It Works

1. User logs in using Google OAuth
2. Messages are sent through secure backend API routes
3. Groq AI generates responses
4. Responses are rendered with markdown support
5. Chats and tasks are stored in Supabase
6. Voice input and image upload enhance interaction

---

# 🔒 Security

- Secure backend AI API handling
- Environment variable protection
- Row Level Security (RLS) enabled
- Users can only access their own data
- Protected authentication flow

---

# 🛠️ Challenges Solved

- Fixed authentication redirect loop using auth loading state
- Fixed React and React DOM version conflicts
- Resolved broken package.json dependency issues
- Moved Groq API calls from frontend to backend for security
- Fixed API parsing causing “No response” issues
- Solved Vercel deployment size limitations
- Fixed Android Gradle Proguard build errors
- Fixed Next.js build issues caused by Android generated assets

---

# ⚠️ Current Limitations

- No long-term AI memory yet
- Vision/image understanding still in progress
- Limited by free-tier AI usage

---

# 🚀 Future Improvements

- AI image understanding
- Streaming AI responses
- Semantic memory search
- Push notifications
- Offline support
- Smart task prioritization
- AI tool calling system

---

# 🧑‍💻 Author

Built by Jithin P Biju

---

# 📄 License

MIT
