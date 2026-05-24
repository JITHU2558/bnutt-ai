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
    <div className="flex h-screen bg-[#0f172a] text-white">

      {/* TASK SIDEBAR */}
      <div className="w-72 bg-[#020617] p-4 border-r border-gray-800 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Tasks</h2>

        <button onClick={clearTasks} className="text-xs text-red-400 mb-4">
          Clear Tasks
        </button>

        <div className="flex-1 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="flex justify-between mb-2 text-sm">
              <span
                onClick={() => toggleTask(task)}
                className={`cursor-pointer ${
                  task.completed ? "line-through text-gray-500" : ""
                }`}
              >
                {task.title}
              </span>

              <button onClick={() => deleteTask(task.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between px-6 py-3 border-b border-gray-800">
          <h1>BNutt AI</h1>
          <button onClick={clearChat} className="text-red-400">
            Clear Chat
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xl px-4 py-3 rounded-xl ${
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
          <div ref={bottomRef} />
        </div>

        {/* IMAGE */}
        {image && (
          <div className="px-6">
            <img
              src={URL.createObjectURL(image)}
              className="w-32 rounded mb-2"
            />
          </div>
        )}

        {/* INPUT */}
        <div className="p-4 border-t border-gray-800 bg-[#020617]">
          <div className="flex gap-2 max-w-3xl mx-auto">

            <button
              onClick={startListening}
              className={`px-3 rounded-xl ${
                listening ? "bg-red-500" : "bg-gray-700"
              }`}
            >
              🎤
            </button>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
              className="text-sm"
            />

            <input
              className="flex-1 p-3 rounded-xl bg-[#1e293b]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message BNutt AI..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />

            <button
              onClick={sendMessage}
              className="bg-blue-600 px-5 rounded-xl"
            >
              {loading ? "..." : "Send"}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}