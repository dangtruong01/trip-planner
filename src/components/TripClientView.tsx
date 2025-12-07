"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils"; // Assuming we might add utils later, but for now inline is fine, I'll use clsx manually if needed or just template literals.
// Actually checking package.json I see clsx installed, so I can use it if I want but standard strings are fine for this simplicity.

const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-primary/5 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
});

interface Activity {
    time: string;
    place: string;
    description: string;
    coordinates: { lat: number; lng: number };
}

interface Day {
    date: string;
    dayNumber: number;
    city: string;
    activities: Activity[];
}

interface TripData {
    tripName: string;
    description: string;
    days: Day[];
}

export default function TripClientView({ id }: { id: string }) {
    const [data, setData] = useState<TripData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [expandedActivityIndex, setExpandedActivityIndex] = useState<number | null>(null);
    const [activeLocation, setActiveLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(`trip_${id}`);
        if (stored) {
            try {
                setData(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse trip data", e);
            }
        }
        setLoading(false);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-primary animate-pulse">
                <div className="text-2xl font-serif">Unfolding the map...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
                <div className="text-2xl font-serif">Trip not found.</div>
                <Link href="/plan" className="underline hover:text-secondary">Create a new trip</Link>
            </div>
        );
    }

    const selectedDay = data.days[selectedDayIndex];

    return (
        <div className="min-h-screen flex flex-col bg-background animate-in fade-in duration-500">
            {/* Header */}
            <header className="border-b border-primary/10 bg-card/50 backdrop-blur-md sticky top-0 z-10 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/plan" className="p-2 hover:bg-primary/5 rounded-full transition-colors" title="Back to Plan">
                        <ArrowLeft className="w-5 h-5 text-primary" />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-serif text-primary font-bold">{data.tripName}</h1>
                        <p className="text-xs sm:text-sm text-primary/60 max-w-md truncate">{data.description}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
                {/* Timeline Sidebar */}
                <div className="w-full lg:w-1/3 flex flex-col border-r border-primary/10 bg-card">
                    {/* Day Tabs */}
                    <div className="flex overflow-x-auto p-2 gap-2 border-b border-primary/10 bg-background/50 scrollbar-hide">
                        {data.days.map((day, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedDayIndex(idx);
                                    setExpandedActivityIndex(null); // Close expanded items when changing days
                                }}
                                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${selectedDayIndex === idx
                                        ? "bg-secondary text-white border-secondary shadow-md"
                                        : "bg-background text-primary/70 border-primary/10 hover:border-secondary/50 hover:text-secondary"
                                    }`}
                            >
                                {/* Format date if valid, else fallback to Day X */}
                                {day.date && !isNaN(Date.parse(day.date))
                                    ? format(parseISO(day.date), "MMM d")
                                    : `Day ${day.dayNumber}`}
                            </button>
                        ))}
                    </div>

                    {/* Active Day Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {selectedDay && (
                            <div className="animate-in slide-in-from-left-5 duration-300">
                                <div className="mb-6 pb-4 border-b border-primary/10">
                                    <h2 className="text-2xl font-serif text-primary">{selectedDay.city}</h2>
                                    <p className="text-sm text-primary/50 font-medium uppercase tracking-wider mt-1">{selectedDay.date}</p>
                                </div>

                                <div className="space-y-3">
                                    {selectedDay.activities.map((activity, idx) => {
                                        const isExpanded = expandedActivityIndex === idx;
                                        return (
                                            <div
                                                key={idx}
                                                className={`rounded-lg border transition-all duration-300 overflow-hidden ${isExpanded
                                                    ? "bg-card border-secondary/20 shadow-lg scale-[1.02]"
                                                    : "bg-background border-primary/5 hover:border-secondary/30 hover:bg-card/50"
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => {
                                                        const isOpening = expandedActivityIndex !== idx;
                                                        setExpandedActivityIndex(isOpening ? idx : null);
                                                        if (isOpening && activity.coordinates) {
                                                            setActiveLocation([activity.coordinates.lat, activity.coordinates.lng]);
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-between p-4 text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                                                        <div>
                                                            <h3 className={`font-bold text-lg leading-tight transition-colors ${isExpanded ? "text-secondary" : "text-primary"}`}>
                                                                {activity.place}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-xs text-primary/50 mt-1 font-mono">
                                                                <Clock className="w-3 h-3" /> {activity.time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-primary/30" /> : <ChevronDown className="w-4 h-4 text-primary/30" />}
                                                </button>

                                                {/* Details Section (Collapsible) */}
                                                <div
                                                    className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                                        }`}
                                                >
                                                    <div className="overflow-hidden">
                                                        <div className="p-4 pt-0 text-sm text-primary/70 leading-relaxed border-t border-primary/5 mt-2">
                                                            <p className="mb-2">{activity.description}</p>
                                                            <div className="flex items-center gap-1 text-xs text-accent/80 font-medium">
                                                                <MapPin className="w-3 h-3" />
                                                                <span>Location marked</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Area */}
                <div className="w-full lg:w-2/3 h-full bg-primary/5 relative">
                    {/* Pass only the selected day's activities to map if we want to focus, 
                    OR pass all days to show full trip context but highlight current day.
                    Let's pass all days for now but maybe we can focus the map on the selected day.
                */}
                    <Map days={data.days} activeLocation={activeLocation} />
                </div>
            </main>
        </div>
    );
}
