import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are evaluating a user's ability to describe an image through a text prompt.
The user saw a target image and wrote a prompt to recreate it. Compare the target and their result.
Be specific and pedagogically useful. Return only valid JSON.`;

const PROMPT = `Compare the TARGET image (first) with the USER'S RESULT (second).

Score each dimension 1–10 and give one concrete sentence of feedback.

Dimensions:
1. subjects — objects, count, identity
2. colors — palette, tones, contrast
3. composition — layout, framing, spatial relationships
4. style — rendering, texture, medium
5. mood — atmosphere, lighting, feeling

Also provide:
- overall_score: weighted average
- got_right: 2–3 specific things the user captured well
- to_fix: top 3 concrete prompt improvements
- style_feedback: a warm, non-technical paragraph (4–6 sentences) about how this user tends to see and describe reality. Not about this specific image — about their observational style. Do they lead with objects and miss atmosphere? Do they measure instead of feel? Do they describe what they expect to see rather than what's actually there? The goal of this exercise is not to prompt a specific image, but to train the ability to truly observe. Speak to them directly, as a teacher would.

Respond with this exact JSON shape:
{
  "dimensions": {
    "subjects":    { "score": 0, "feedback": "" },
    "colors":      { "score": 0, "feedback": "" },
    "composition": { "score": 0, "feedback": "" },
    "style":       { "score": 0, "feedback": "" },
    "mood":        { "score": 0, "feedback": "" }
  },
  "overall_score": 0,
  "got_right": [],
  "to_fix": [],
  "style_feedback": ""
}`;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in environment variables." }, { status: 500 });
    }

    const form = await req.formData();
    const target = form.get("target") as File | null;
    const student = form.get("student") as File | null;
    const promptText = (form.get("prompt") as string) || "";

    if (!target || !student) {
      return NextResponse.json({ error: "Both images required" }, { status: 400 });
    }

    const toBase64 = async (file: File) =>
      Buffer.from(await file.arrayBuffer()).toString("base64");

    const [targetB64, studentB64] = await Promise.all([toBase64(target), toBase64(student)]);

    const normalizeType = (f: File): "image/jpeg" | "image/png" | "image/webp" | "image/gif" => {
      const t = f.type?.toLowerCase();
      if (t === "image/png") return "image/png";
      if (t === "image/webp") return "image/webp";
      if (t === "image/gif") return "image/gif";
      return "image/jpeg";
    };

    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1500,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "TARGET IMAGE:" },
            { type: "image", source: { type: "base64", media_type: normalizeType(target), data: targetB64 } },
            { type: "text", text: "STUDENT'S RESULT:" },
            { type: "image", source: { type: "base64", media_type: normalizeType(student), data: studentB64 } },
            { type: "text", text: `User's prompt: "${promptText}"\n\n${PROMPT}` },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    const result = JSON.parse(text.slice(start, end));

    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
