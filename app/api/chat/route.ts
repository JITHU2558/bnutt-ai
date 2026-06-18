import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const image = body.image;

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

    let groqMessages: any[] = [...messages];

    // Vision input
    if (image) {
      const lastUserMessage =
        messages[messages.length - 1]?.content ||
        "Analyze this image.";

      groqMessages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `
Analyze the uploaded image and provide:

1. Image description
2. OCR (extract all readable text)
3. Document analysis if applicable
4. Signs of editing/manipulation
5. Confidence level
6. Limitations of the analysis

User request:
${lastUserMessage}
              `,
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ];
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
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: groqMessages,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("GROQ ERROR:", errorText);

      return NextResponse.json(
        { reply: `AI service error: ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();

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