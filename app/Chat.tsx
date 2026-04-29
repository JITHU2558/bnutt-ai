"use client";

import { useState, useEffect, useRef } from "react";
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

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔐 Get user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // 📥 Load messages
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

    loadMessages();
  }, [user]);

  // 📥 Load tasks
  useEffect(() => {
    if (!user) return;

    const loadTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id);

      if (data) setTasks(data);
    };

    loadTasks();
  }, [user]);

  // 🔽 Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🧠 Detect & create task
  const tryCreateTask = async (text: string) => {
    try {
      const json = JSON.parse(text);

      // ✅ Accept task + reminder + todo
      if (["task", "reminder", "todo"].includes(json.type)) {
        const { data } = await supabase
          .from("tasks")
          .insert([
            {
              title: json.title,
              completed: false,
              user_id: user.id,
            },
          ])
          .select();

        if (data) {
          setTasks((prev) => [...prev, ...data]);
        }
      }
    } catch {}
  };

  // 🚀 Stream AI
  const streamResponse = async (msgs: Message[]) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: msgs }),
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    let text = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.trim() !== "");

      for (const line of lines) {
        if (line === "data: [DONE]") continue;

        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "");

          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content;

            if (content) {
              text += content;

              setMessages((prev) => {
                const base = prev.slice(0, -1);
                return [...base, { role: "assistant", content: text }];
              });
            }
          } catch {}
        }
      }
    }

    // 💾 Save AI message
    await supabase.from("messages").insert([
      { user_id: user.id, role: "assistant", content: text },
    ]);

    // 🧠 Try create task
    await tryCreateTask(text);

    setLoading(false);
  };

  // 📤 Send message
  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    setLoading(true);

    const userMsg: Message = { role: "user", content: input };
    const newMsgs = [...messages, userMsg];

    // 💾 Save user message
    await supabase.from("messages").insert([
      { user_id: user.id, role: "user", content: input },
    ]);

    setMessages([...newMsgs, { role: "assistant", content: "..." }]);
    setInput("");

    await streamResponse(newMsgs);
  };

  if (!user) return <div className="p-10 text-white">Login first</div>;

  return (
    <div className="flex h-screen bg-[#0b1220] text-white">

      {/* TASK PANEL */}
      <div className="w-64 bg-gray-900 p-4">
        <h2 className="mb-4 font-bold">Tasks</h2>

        {tasks.map((task) => (
          <div key={task.id} className="mb-2">
            • {task.title}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col">

        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className="mb-3">
              <div className="bg-gray-800 p-2 rounded">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 flex gap-2">
          <input
            className="flex-1 p-2 bg-gray-900"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={sendMessage}>
            {loading ? "..." : "Send"}
          </button>
        </div>

      </div>
    </div>
  );
}