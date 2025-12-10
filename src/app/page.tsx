"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Map, Compass, Clock, ArrowRight } from "lucide-react";

interface SavedTrip {
  id: string;
  name: string;
  date: string;
}

export default function Home() {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  useEffect(() => {
    const indexStr = localStorage.getItem("trip_index");
    if (indexStr) {
      try {
        setSavedTrips(JSON.parse(indexStr).reverse()); // Show newest first
      } catch (e) {
        console.error("Failed to parse saved trips", e);
      }
    }
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen p-8 sm:p-20 text-center animate-in fade-in duration-700">
      <header className="flex flex-col items-center space-y-4 mb-12 flex-grow">
        <div className="p-4 rounded-full border-2 border-primary/20 bg-card shadow-lg">
          <Compass className="w-16 h-16 text-secondary" strokeWidth={1} />
        </div>
        <h1 className="text-5xl sm:text-7xl font-serif text-primary tracking-wide">
          The Voyager
        </h1>
        <p className="text-xl sm:text-2xl text-primary/80 max-w-2xl font-light italic">
          "A journey of a thousand miles begins with a single step."
        </p>
      </header>

      <main className="flex flex-col gap-8 items-center w-full max-w-4xl">
        <div className="p-8 w-full max-w-lg bg-card border border-primary/10 shadow-xl rounded-xl">
          <p className="text-lg mb-6 leading-relaxed">
            Craft your perfect itinerary with our AI-powered travel assistant.
            Specializing in Asian aesthetics, history, and culture.
          </p>

          <Link
            href="/plan"
            className="inline-flex items-center gap-2 px-8 py-3 bg-secondary text-white rounded-md text-lg hover:bg-secondary/90 transition-colors shadow-md font-serif tracking-wider"
          >
            <Map className="w-5 h-5" />
            Start Your Journey
          </Link>
        </div>

        {/* Saved Trips Section */}
        {savedTrips.length > 0 && (
          <div className="w-full animate-in slide-in-from-bottom-10 duration-1000 delay-200">
            <h2 className="text-2xl font-serif text-primary/80 mb-6 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" /> My Past Journeys
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
              {savedTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trip/${trip.id}`}
                  className="group block p-5 bg-card border border-primary/5 rounded-lg hover:border-secondary/30 hover:shadow-lg transition-all"
                >
                  <h3 className="font-bold text-lg text-primary group-hover:text-secondary truncate">{trip.name}</h3>
                  <div className="flex items-center justify-between mt-2 text-sm text-primary/50">
                    <span>{trip.date}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-sm text-primary/50">
        <p>Est. 2025 • Crafted with patience and code</p>
      </footer>
    </div>
  );
}
