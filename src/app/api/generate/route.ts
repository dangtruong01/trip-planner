import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { cities, places, dates, preferences, attachments } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Returning mock data.");
      return NextResponse.json(getMockData(cities, dates));
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Prepare image parts if attachments exist
    const imageParts = (attachments || []).map((att: string) => {
      // att is "data:image/jpeg;base64,..."
      const [meta, data] = att.split(",");
      const mimeType = meta.split(":")[1].split(";")[0];
      return {
        inlineData: {
          data,
          mimeType
        }
      };
    });

    const promptText = `
      Plan a detailed trip itinerary.
      Destinations: ${cities.join(", ")}.
      Dates: ${dates.start} to ${dates.end}.
      Preferences: ${preferences.join(", ")}.
      Specific wishes: ${places}.
      
      I have attached some documents/images for context (e.g. flight tickets, inspiration). Use them to refine the location or timing if applicable.
      
      CRITICAL INSTRUCTION: For every "Lunch" and "Dinner" slot, you MUST suggest a specific restaurant or food spot that fits the user's vibe. Include the cuisine type and why it is recommended.

      Return a JSON object strictly following this structure (no markdown code blocks, just raw JSON):
      {
        "tripName": "A catchy name for the trip",
        "description": "A brief summary of the journey",
        "days": [
          {
            "date": "YYYY-MM-DD",
            "dayNumber": 1,
            "city": "City Name",
            "activities": [
              {
                "time": "HH:MM",
                "place": "Name of the place (or Restaurant Name)",
                "description": "What to do there. (If restaurant: Cuisine type & why)",
                "coordinates": { "lat": 0.0, "lng": 0.0 }
              }
            ]
          }
        ]
      }
      Ensure coordinates are approximate but accurate enough for map visualization.
    `;

    const result = await model.generateContent([promptText, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Clean up if the model wraps it in markdown code blocks
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanedText);

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate itinerary" }, { status: 500 });
  }
}

function getMockData(cities: string[], dates: { start: string }) {
  // Simple mock generator
  return {
    tripName: `Journey to ${cities[0]}`,
    description: "A simulated itinerary for demonstration purposes.",
    days: [
      {
        date: dates.start,
        dayNumber: 1,
        city: cities[0],
        activities: [
          {
            time: "09:00",
            place: `${cities[0]} Station`,
            description: "Arrival and check-in",
            coordinates: { lat: 35.6895, lng: 139.6917 } // Tokyo approx
          },
          {
            time: "13:00",
            place: "Local Market",
            description: "Explore the vibrant market streets.",
            coordinates: { lat: 35.6905, lng: 139.7000 }
          }
        ]
      }
    ]
  };
}
