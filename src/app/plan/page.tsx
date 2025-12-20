"use client";

import { useState } from "react";
import { Plus, X, Calendar, MapPin, Feather } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PlanTrip() {
    const router = useRouter();
    const [cities, setCities] = useState<string[]>([""]);
    const [places, setPlaces] = useState<string>("");
    const [dates, setDates] = useState({ start: "", end: "" });
    const [preferences, setPreferences] = useState<string[]>([]);
    const [budget, setBudget] = useState("Moderate");
    const [companions, setCompanions] = useState("Couple");
    const [pacing, setPacing] = useState("Balanced");
    const [attachments, setAttachments] = useState<{ name: string; data: string }[]>([]); // {name, base64}
    const [loading, setLoading] = useState(false);

    const vibeOptions = [
        "Culture & Tradition",
        "Local Food & Cuisine",
        "Nature & Landscapes",
        "History & Architecture",
        "Shopping & Markets",
        "Relaxation & Wellness",
    ];

    const handleAddCity = () => {
        setCities([...cities, ""]);
    };

    const handleCityChange = (index: number, value: string) => {
        const newCities = [...cities];
        newCities[index] = value;
        setCities(newCities);
    };

    const togglePreference = (pref: string) => {
        if (preferences.includes(pref)) {
            setPreferences(preferences.filter((p) => p !== pref));
        } else {
            setPreferences([...preferences, pref]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newAttachments = await Promise.all(
                files.map((file) => {
                    return new Promise<{ name: string; data: string }>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                            resolve({
                                name: file.name,
                                data: reader.result as string,
                            });
                        reader.readAsDataURL(file);
                    });
                })
            );
            setAttachments([...attachments, ...newAttachments]);
            e.target.value = ""; // Reset input so the same file can be selected again if removed
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cities,
                    places,
                    dates,
                    preferences,
                    budget,
                    companions,
                    pacing,
                    attachments: attachments.map(a => a.data) // Send only data string to API for now
                }),
            });

            if (!response.ok) throw new Error("Failed to generate itinerary");

            const data = await response.json();

            // Store result in localStorage for demo purposes (no DB)
            const tripId = Date.now().toString();
            const tripData = { id: tripId, ...data, createdAt: new Date().toISOString() };

            localStorage.setItem(`trip_${tripId}`, JSON.stringify(tripData));

            // Also update a "trip_index" for easier listing
            const indexStr = localStorage.getItem("trip_index");
            const index = indexStr ? JSON.parse(indexStr) : [];
            index.push({ id: tripId, name: data.tripName, date: dates.start });
            localStorage.setItem("trip_index", JSON.stringify(index));

            router.push(`/trip/${tripId}`);
        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 sm:p-20 flex flex-col items-center animate-in slide-in-from-bottom-5 duration-700">
            <div className="w-full max-w-2xl bg-card border border-primary/10 rounded-xl shadow-2xl p-8 sm:p-12 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Feather className="w-32 h-32" />
                </div>

                <h1 className="text-4xl font-serif text-primary mb-2">Curate Your Journey</h1>
                <p className="text-primary/60 mb-8 font-light italic">Tell us your desires, and we will weave the path.</p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Destinations */}
                    <div className="space-y-4">
                        <label className="block text-lg font-serif text-secondary flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Destinations
                        </label>
                        {cities.map((city, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => handleCityChange(idx, e.target.value)}
                                    placeholder={idx === 0 ? "e.g. Kyoto, Japan" : "Another city..."}
                                    className="w-full bg-background border border-primary/20 rounded-md p-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-primary/30"
                                    required
                                />
                                {cities.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setCities(cities.filter((_, i) => i !== idx))}
                                        className="p-3 text-primary/50 hover:text-secondary transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddCity}
                            className="text-sm text-accent hover:text-accent/80 flex items-center gap-1 font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Destination
                        </button>
                    </div>

                    {/* Specific Places */}
                    <div className="space-y-4">
                        <label className="block text-lg font-serif text-secondary">Specific Places (Optional)</label>
                        <textarea
                            value={places}
                            onChange={(e) => setPlaces(e.target.value)}
                            placeholder="e.g. Fushimi Inari Shrine, a hidden ramen shop..."
                            className="w-full bg-background border border-primary/20 rounded-md p-3 h-24 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all placeholder:text-primary/30 resize-none"
                        />
                    </div>

                    {/* Preferences */}
                    <div className="space-y-4">
                        <label className="block text-lg font-serif text-secondary">Your Vibe</label>
                        <div className="flex flex-wrap gap-3">
                            {vibeOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => togglePreference(option)}
                                    className={`px-4 py-2 rounded-full border transition-all duration-300 text-sm sm:text-base ${preferences.includes(option)
                                        ? "bg-primary text-white border-primary"
                                        : "bg-transparent text-primary border-primary/30 hover:border-primary"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                        <label className="block text-lg font-serif text-secondary flex items-center gap-2">
                            <Calendar className="w-5 h-5" /> Timing
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-xs text-primary/50 mb-1 block uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    value={dates.start}
                                    onChange={(e) => setDates({ ...dates, start: e.target.value })}
                                    className="w-full bg-background border border-primary/20 rounded-md p-3 focus:outline-none focus:border-secondary transition-all text-primary/80"
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-primary/50 mb-1 block uppercase tracking-wider">End Date</label>
                                <input
                                    type="date"
                                    value={dates.end}
                                    onChange={(e) => setDates({ ...dates, end: e.target.value })}
                                    className="w-full bg-background border border-primary/20 rounded-md p-3 focus:outline-none focus:border-secondary transition-all text-primary/80"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Travel Details: Budget, Companions, Pacing */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Budget */}
                        <div className="space-y-4">
                            <label className="block text-lg font-serif text-secondary">Budget</label>
                            <div className="flex flex-col gap-2">
                                {["Budget", "Moderate", "Luxury"].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setBudget(opt)}
                                        className={`px-4 py-2 rounded-md border text-left transition-all ${budget === opt
                                            ? "bg-secondary text-white border-secondary"
                                            : "bg-background text-primary border-primary/20 hover:border-primary/50"
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Companions */}
                        <div className="space-y-4">
                            <label className="block text-lg font-serif text-secondary">Companions</label>
                            <div className="flex flex-col gap-2">
                                {["Solo", "Couple", "Family", "Friends"].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setCompanions(opt)}
                                        className={`px-4 py-2 rounded-md border text-left transition-all ${companions === opt
                                            ? "bg-secondary text-white border-secondary"
                                            : "bg-background text-primary border-primary/20 hover:border-primary/50"
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pacing */}
                        <div className="space-y-4">
                            <label className="block text-lg font-serif text-secondary">Pacing</label>
                            <div className="flex flex-col gap-2">
                                {["Relaxed", "Balanced", "Packed"].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setPacing(opt)}
                                        className={`px-4 py-2 rounded-md border text-left transition-all ${pacing === opt
                                            ? "bg-secondary text-white border-secondary"
                                            : "bg-background text-primary border-primary/20 hover:border-primary/50"
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <label className="block text-lg font-serif text-secondary flex items-center gap-2">
                            Attachments (Optional)
                        </label>
                        <div className="border border-dashed border-primary/30 rounded-md p-6 text-center hover:bg-primary/5 transition-colors">
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <span className="text-primary/60 mb-2">Upload Booking Confirmations or Inspiration</span>
                                <span className="text-xs text-primary/40">Images or PDFs supported</span>
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="flex flex-col gap-2 mt-4">
                                {attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-card border border-primary/10 p-3 rounded-md animate-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-primary/5 rounded-full">
                                                <Feather className="w-4 h-4 text-secondary" />
                                            </div>
                                            <span className="text-sm text-primary/80 truncate max-w-[200px]">{file.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttachment(idx)}
                                            className="p-2 text-primary/30 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-8 flex items-center justify-between">
                        <Link href="/" className="text-primary/50 hover:text-primary transition-colors">
                            Back
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-3 bg-secondary text-white rounded-md shadow-lg font-serif tracking-wider hover:bg-secondary/90 transition-all ${loading ? "opacity-70 cursor-wait" : ""
                                }`}
                        >
                            {loading ? "Crafting Itinerary..." : "Generate Trip"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
