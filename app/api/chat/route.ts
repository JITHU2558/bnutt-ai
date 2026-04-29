export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemPrompt = {
    role: "system",
    content: `
You are an AI assistant.

If the user asks to create a task or reminder,
respond ONLY in JSON format like this:

{
  "type": "task",
  "title": "task title"
}

Do NOT use "reminder" or other types.
Do NOT add explanation text.

If it's not a task, respond normally.
`,
  };

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [systemPrompt, ...messages],
        stream: true,
      }),
    }
  );

  return new Response(response.body);
}