import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const month = formData.get("month");

    if (!file) {
      return NextResponse.json({ error: "Tiedosto puuttuu" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const response = await openai.chat.completions.create({
      model: "gpt-5.3",
      messages: [
        {
          role: "system",
          content: "Analysoi suomalainen tuloslaskelma ja tase ja palauta JSON.",
        },
        { role: "user", content: text },
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
