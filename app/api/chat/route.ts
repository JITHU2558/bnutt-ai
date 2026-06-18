import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    // ✅ Safety check
    if (!messages.length) {
      return NextResponse.json(
        { reply: "No messages provided" },
        { status: 400 }
      );
    }
    if (!process.env.GROQ_API_KEY) {
  return NextResponse.json(
    { reply: "Missing GROQ API key" },
    { status: 500 }
  );
}

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: messages,
          temperature: 0.7,
        }),
      }
    );

    // ✅ Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GROQ HTTP ERROR:", errorText);

      return NextResponse.json(
        { reply: "AI service error" },
        { status: 500 }
      );
    }

    const data = await response.json();

    console.log("GROQ RESPONSE:", data);

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No response from AI";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { reply: "Something went wrong in API" },
      { status: 500 }
    );
  }
}