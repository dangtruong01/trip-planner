
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { cities, places, dates, preferences, attachments, budget, companions, pacing } = await req.json();

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
      
      ** TRAVEL CONTEXT ** (Vital for tailoring the plan):
      - ** Budget **: ${budget} (Adjust dining / activities accordingly.E.g.Luxury = Fine dining, Budget = Street food / Free spots).
      - ** Companions **: ${companions} (E.g.Family = Kid friendly, Couple = Romantic, Friends = Nightlife / Group fun).
      - ** Pacing **: ${pacing} (E.g.Relaxed = Low intensity, late starts.Packed = Maximized sightseeing).

      I have attached some documents / images for context(e.g.flight tickets, hotel bookings, inspiration).
      
      CRITICAL INSTRUCTIONS:
  1. ** Analyze Attachments **: Extract EXACT flight times, hotel names, and locations if visible in the attachments.
          - If a flight lands at 2pm, start the itinerary from ~4pm(accounting for travel).
          - If a hotel is specified, use it as the starting point for daily activities.
          - Create explicit "Arrival" or "Check-in" activities if you find this info.
      
      2. ** Dining **: For every "Lunch" and "Dinner" slot, you MUST suggest a specific restaurant or food spot.Include the cuisine type and why it is recommended.

      3. ** Logistics **: Between activities, briefly mention logical travel methods(e.g. "Take the subway 15 mins" or "Walk 10 mins").Be realistic about travel times.

      4. ** Accommodation **: If a hotel is mentioned in the files or if you suggest one, put it in the "accommodation" field for that day, NOT as an activity.

      5. ** Structure **:
      Return a JSON object strictly following this structure(no markdown code blocks, just raw JSON):
{
  "tripName": "A catchy name for the trip",
    "description": "A brief summary of the journey",
      "days": [
        {
          "date": "YYYY-MM-DD",
          "dayNumber": 1,
          "city": "City Name",
          "accommodation": "Name of Hotel/Stay for this night",
          "activities": [
            {
              "time": "HH:MM",
              "place": "Name of the place (or Restaurant Name)",
              "description": "Description of activity AND logistics to get here. (If restaurant: Cuisine & why)",
              "coordinates": { "lat": 0.0, "lng": 0.0 }, // MUST be accurate for the map
              "address": "Short address for map search"
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
