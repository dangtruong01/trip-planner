import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { currentTrip, instructions } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API Key missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const prompt = `
      You are an expert travel assistant.
      
      CURRENT ITINERARY (JSON):
      ${JSON.stringify(currentTrip)}

      USER INSTRUCTIONS:
      "${instructions}"

      TASK:
      Modify the CURRENT ITINERARY based strictly on the USER INSTRUCTIONS.
      - If the user asks to change time, update the time.
      - If the user asks to swap an activity, replace it.
      - If the user asks for a different restaurant, provide one with cuisine details.
      - Maintain the exact same JSON structure.
      - Do not lose any days or activities unless explicitly asked to remove them.
      
      Return ONLY the modified JSON object. No markdown.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up if the model wraps it in markdown code blocks
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanedText);

        return NextResponse.json(data);
    } catch (error) {
        console.error("AI Edit Error:", error);
        return NextResponse.json({ error: "Failed to edit itinerary" }, { status: 500 });
    }
}
