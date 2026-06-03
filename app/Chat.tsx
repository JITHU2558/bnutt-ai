"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabase";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ✅ ONLY ADDITION (fix)
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const handleDeepLink = async (event: any) => {
    const url = event.url;

    if (url.includes("access_token")) {
      await supabase.auth.setSession({
        access_token: new URL(url).hash.split("access_token=")[1].split("&")[0],
        refresh_token: new URL(url).hash.split("refresh_token=")[1].split("&")[0],
      });

      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
  };

  window.addEventListener("message", handleDeepLink);

  return () => {
    window.removeEventListener("message", handleDeepLink);
  };
}, []);
  
  // USER
  useEffect(() => {
    // get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false); // ✅ added
    });

    supabase.auth.getSession().then(({ data }) => {
  if (data.session?.user) {
    setUser(data.session.user);
    setAuthLoading(false);
  }
});

    // listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        setAuthLoading(false); // ✅ added
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ✅ FIXED REDIRECT (only change)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading]);

  // LOAD DATA
  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(
          data.map((m: any) => ({
            role: m.role,
            content: m.content,
          }))
        );
      }
    };

    const loadTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      if (data) setTasks(data);
    };

    loadMessages();
    loadTasks();
  }, [user]);

  // SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🎤 VOICE INPUT
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
  };

  // TASK CREATE
  const createTask = async (title: string) => {
    const { data } = await supabase
      .from("tasks")
      .insert([{ title, completed: false, user_id: user.id }])
      .select();

    if (data) setTasks((prev) => [...prev, ...data]);
  };

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    setLoading(true);

    const userMsg: Message = { role: "user", content: input };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    await supabase.from("messages").insert([
      { user_id: user.id, role: "user", content: input },
    ]);

    setInput("");
    setImage(null);
const imageToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
    
    try {
   let imageBase64: string | null = null;

if (image) {
  imageBase64 = await imageToBase64(image);
}

const res = await fetch(`${window.location.origin}/api/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: updatedMessages,
    image: imageBase64,
  }),
});

if (!res.ok) {
  const txt = await res.text();
  throw new Error(`API failed: ${res.status} ${txt}`);
}

const data = await res.json();

let aiText =
  data?.reply || "No response";
      // TASK PARSE
      try {
        const json = JSON.parse(aiText);
        if (json.type === "task") {
          await createTask(json.title);
          aiText = `✅ Task added: ${json.title}`;
        }
      } catch {}

      const aiMsg: Message = { role: "assistant", content: aiText };

      setMessages((prev) => [...prev, aiMsg]);

      await supabase.from("messages").insert([
        { user_id: user.id, role: "assistant", content: aiText },
      ]);
    } catch (err: any) {
  console.error(err);
  const aiMsg: Message = {
    role: "assistant",
    content: `ERROR: ${err.message}`,
  };
  setMessages((prev) => [...prev, aiMsg]);
}

    setLoading(false);
  };

  // TASK ACTIONS
  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTask = async (task: Task) => {
    await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const clearTasks = async () => {
    await supabase.from("tasks").delete().eq("user_id", user.id);
    setTasks([]);
  };

  const clearChat = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete failed:", error.message);
      return;
    }

    setMessages([]);
  };

  // ✅ FIXED LOADING CHECK
  if (authLoading) {
    return <div className="p-10 text-white">Loading...</div>;
  }

 return (
  <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-white overflow-hidden">

    {/* MOBILE HEADER */}
<div className="md:hidden border-b border-gray-800 bg-[#020617] px-4 py-3 flex items-center justify-between">
  <button
    onClick={() => setShowSidebar(true)}
    className="text-xl"
  >
    ☰
  </button>

  <h2 className="text-lg font-bold">
    BNutt AI
  </h2>

  <button
    onClick={clearChat}
    className="text-red-400 text-sm"
  >
    Clear
  </button>
</div>

    {/* TASK SIDEBAR */}
    <>
  {showSidebar && (
    <div
      className="fixed inset-0 bg-black/60 z-40 md:hidden"
      onClick={() => setShowSidebar(false)}
    />
  )}

  <div
    className={`
      fixed md:relative
      top-0 left-0
      h-full
      w-[85vw] max-w-72 md:w-72
      bg-[#020617]
      border-r border-gray-800
      z-50
      transform transition-transform duration-300
      ${showSidebar ? "translate-x-0" : "-translate-x-full"}
      md:translate-x-0
      flex flex-col
    `}
  >
    <div className="p-4 flex items-center justify-between">
      <h2 className="text-lg font-bold">Tasks</h2>

      <button
        onClick={() => setShowSidebar(false)}
        className="md:hidden text-xl"
      >
        ✕
      </button>
    </div>

    <div className="px-4 mb-4">
      <button
        onClick={clearTasks}
        className="text-xs text-red-400"
      >
        Clear Tasks
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400">
          No tasks yet
        </p>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between mb-3 text-sm bg-[#0f172a] rounded-xl px-3 py-2"
          >
            <span
              onClick={() => toggleTask(task)}
              className={`cursor-pointer flex-1 ${
                task.completed
                  ? "line-through text-gray-500"
                  : ""
              }`}
            >
              {task.title}
            </span>

            <button
              onClick={() => deleteTask(task.id)}
              className="ml-3 text-red-400"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  </div>
</>
    {/* CHAT AREA */}
    <div className="flex-1 flex flex-col min-h-0">

      {/* HEADER */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#020617]">
        <h1 className="text-xl font-semibold">
          BNutt AI
        </h1>

        <button
          onClick={clearChat}
          className="text-red-400 text-sm"
        >
          Clear Chat
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 space-y-4 pb-36">

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-blue-600"
                  : "bg-[#1e293b]"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-400">
            BNutt AI is thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* IMAGE PREVIEW */}
      {image && (
        <div className="px-4 pb-2">
          <img
            src={URL.createObjectURL(image)}
            className="w-24 h-24 object-cover rounded-xl border border-gray-700"
          />
        </div>
      )}

      {/* INPUT AREA */}
      <div className="sticky bottom-0 border-t border-gray-800 bg-[#020617]/95 backdrop-blur-md px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">

        <div className="flex items-end gap-2 max-w-4xl mx-auto">

          {/* VOICE */}
          <button
            onClick={startListening}
            className={`h-11 w-11 rounded-full flex items-center justify-center text-lg ${
              listening
                ? "bg-red-500"
                : "bg-[#1e293b]"
            }`}
          >
            🎤
          </button>

          {/* IMAGE */}
          <label className="h-11 w-11 rounded-full bg-[#1e293b] flex items-center justify-center cursor-pointer text-lg">
            🖼️
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
              className="hidden"
            />
          </label>

          {/* TEXT INPUT */}
          <textarea
            className="flex-1 resize-none rounded-2xl bg-[#1e293b] px-4 py-3 text-sm outline-none min-h-[48px] max-h-40 overflow-y-auto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message BNutt AI..."
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          {/* SEND */}
          <button
            onClick={sendMessage}
            className="h-11 px-5 rounded-2xl bg-blue-600 text-sm font-medium"
          >
            {loading ? "..." : "Send"}
          </button>

        </div>
      </div>
    </div>
  </div>
);
}